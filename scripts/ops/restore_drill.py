#!/usr/bin/env python3
"""Restore latest encrypted snapshot to an EMPTY NON-PRODUCTION database; never touches production."""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from backup_db import database_parts, required


def call(*args, **kwargs):
    return subprocess.run(list(args), check=True, **kwargs)


def main():
    source = database_parts(required('DATABASE_URL'))
    target = database_parts(required('RESTORE_DATABASE_URL'))
    if source[0] == target[0]:
        raise RuntimeError('Restore target must use a distinct host from production')
    identity = required('BACKUP_AGE_IDENTITY')
    bucket = required('BACKUP_S3_BUCKET')
    if not Path(identity).is_file():
        raise RuntimeError('BACKUP_AGE_IDENTITY file not found')
    prefix = 'database/daily/'
    items = json.loads(subprocess.check_output(['aws', 's3api', 'list-objects-v2', '--bucket', bucket,
                                                 '--prefix', prefix, '--output', 'json']))['Contents']
    candidates = sorted((i['Key'] for i in items if i['Key'].endswith('.sql.gz.age')), reverse=True)
    if not candidates:
        raise RuntimeError('No completed database snapshots found')
    key = candidates[0]
    with tempfile.TemporaryDirectory(prefix='mazigho-restore-') as directory:
        archive = Path(directory) / 'snapshot.age'
        manifest = Path(directory) / 'manifest.json'
        call('aws', 's3', 'cp', f's3://{bucket}/{key}', str(archive), '--no-progress', stdout=subprocess.DEVNULL)
        call('aws', 's3', 'cp', f's3://{bucket}/{key}.json', str(manifest), '--no-progress', stdout=subprocess.DEVNULL)
        meta = json.loads(manifest.read_text())
        with archive.open('rb') as input_file:
            checksum = hashlib.file_digest(input_file, 'sha256').hexdigest()
        if meta['key'] != key or meta['sha256_ciphertext'] != checksum:
            raise RuntimeError('Snapshot integrity verification failed')
        host, port, user, password, prefix = target
        db = f"{prefix}_drill_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        if len(db) > 64:
            raise RuntimeError('Restore schema name exceeds MySQL limit')
        env = {**os.environ, 'MYSQL_PWD': password}
        base = ['mysql', '--host', host, '--port', str(port), '--user', user, '--ssl-mode=VERIFY_IDENTITY']
        # A unique database is created on a dedicated test instance, never on production.
        call(*base, '-e', f'CREATE DATABASE `{db}`', env=env)
        try:
            args = [*base, db]
            age = subprocess.Popen(['age', '-d', '-i', identity, str(archive)], stdout=subprocess.PIPE)
            unzip = subprocess.Popen(['gzip', '-d'], stdin=age.stdout, stdout=subprocess.PIPE)
            age.stdout.close()
            mysql = subprocess.Popen(args, stdin=unzip.stdout, env=env)
            unzip.stdout.close()
            results = (mysql.wait(), unzip.wait(), age.wait())
            if any(results):
                raise RuntimeError(f'Restore process failed (mysql/gzip/age): {results}')
            names = {line.decode().strip() for line in subprocess.check_output([*args, '-N', '-e', 'SHOW TABLES'], env=env).splitlines()}
            if not {'stores', 'users'}.issubset(names):
                raise RuntimeError('Restore missing critical tables')
            count = subprocess.check_output([*args, '-N', '-e', 'SELECT COUNT(*) FROM stores'], env=env).decode().strip()
            print(json.dumps({'status': 'restore_ok', 'tables_found': len(names), 'stores': int(count), 'snapshot_key': key}))
        finally:
            call(*base, '-e', f'DROP DATABASE `{db}`', env=env)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'restore drill failed: {exc}', file=sys.stderr)
        sys.exit(1)
