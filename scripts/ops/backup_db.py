#!/usr/bin/env python3
"""Logical snapshot: mysqldump -> gzip -> age -> private S3; no plaintext dump on disk."""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit


def database_parts(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ("mysql", "mysql2") or not parsed.hostname or not parsed.username or not parsed.path.strip("/"):
        raise ValueError("DATABASE_URL must contain a mysql host, user and database")
    name = unquote(parsed.path.lstrip("/"))
    if not re.fullmatch(r"[A-Za-z0-9_-]+", name):
        raise ValueError("Unsafe database name")
    return parsed.hostname, parsed.port or 3306, unquote(parsed.username), unquote(parsed.password or ""), name


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing {name}")
    return value


def run():
    host, port, user, password, database = database_parts(required("DATABASE_URL"))
    bucket, recipient = required("BACKUP_S3_BUCKET"), required("BACKUP_AGE_RECIPIENT")
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    key = f"database/daily/{stamp}-{os.urandom(5).hex()}.sql.gz.age"
    with tempfile.TemporaryDirectory(prefix="mazigho-backup-") as directory:
        encrypted = Path(directory) / "backup.sql.gz.age"
        env = {**os.environ, "MYSQL_PWD": password}
        dump = subprocess.Popen(["mysqldump", "--host", host, "--port", str(port), "--user", user,
                                 "--ssl-mode=VERIFY_IDENTITY", "--single-transaction", "--quick", "--skip-lock-tables",
                                 "--no-tablespaces", "--hex-blob", "--default-character-set=utf8mb4", database],
                                stdout=subprocess.PIPE, env=env, stderr=subprocess.PIPE)
        gzip = subprocess.Popen(["gzip", "-1"], stdin=dump.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        dump.stdout.close()
        with encrypted.open("wb") as output:
            age = subprocess.Popen(["age", "-r", recipient], stdin=gzip.stdout, stdout=output, stderr=subprocess.PIPE)
            gzip.stdout.close()
            age_error = age.communicate()[1]
        gzip_error = gzip.communicate()[1]
        dump_error = dump.communicate()[1]
        if any((dump.returncode, gzip.returncode, age.returncode)) or encrypted.stat().st_size < 100:
            raise RuntimeError("Snapshot failed (dump/gzip/age): " + "; ".join(
                x.decode(errors="replace")[-600:] for x in (dump_error, gzip_error, age_error) if x))
        with encrypted.open("rb") as input_file:
            sha = hashlib.file_digest(input_file, "sha256").hexdigest()
        manifest = {"created_utc": stamp, "key": key, "encrypted_bytes": encrypted.stat().st_size,
                    "sha256_ciphertext": sha, "format": "mysqldump|gzip|age", "retention_days": 30}
        # The manifest contains no credentials, SQL or tenant metadata.
        manifest_path = Path(directory) / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, sort_keys=True) + "\n", encoding="utf-8")
        for path, destination in ((encrypted, key), (manifest_path, key + ".json")):
            subprocess.run(["aws", "s3", "cp", str(path), f"s3://{bucket}/{destination}", "--no-progress",
                            "--sse", "AES256"], check=True)
        # Fail the job if either object is missing after upload.
        for destination in (key, key + ".json"):
            subprocess.run(["aws", "s3api", "head-object", "--bucket", bucket, "--key", destination,
                            "--query", "ContentLength", "--output", "text"], check=True, stdout=subprocess.DEVNULL)
    print(json.dumps(manifest, sort_keys=True))


if __name__ == "__main__":
    try:
        run()
    except Exception as error:
        print(f"backup failed: {error}", file=sys.stderr)
        sys.exit(1)
