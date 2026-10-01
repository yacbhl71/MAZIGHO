#!/usr/bin/env python3
"""Fail closed if the S3 backup bucket is not actually protected."""
import json
import subprocess
from backup_db import required


def config(operation, bucket):
    output = subprocess.check_output(['aws', 's3api', operation, '--bucket', bucket, '--output', 'json'])
    return json.loads(output)


def verify(version, lock, block, lifecycle):
    if version.get('Status') != 'Enabled':
        raise RuntimeError('S3 versioning is not enabled')
    lock = lock.get('ObjectLockConfiguration', {})
    retention = lock.get('Rule', {}).get('DefaultRetention', {})
    if lock.get('ObjectLockEnabled') != 'Enabled' or retention.get('Days', 0) < 30:
        raise RuntimeError('S3 Object Lock default retention below 30 days')
    public = block.get('PublicAccessBlockConfiguration', {})
    if not all(public.get(k) is True for k in ('BlockPublicAcls', 'IgnorePublicAcls', 'BlockPublicPolicy', 'RestrictPublicBuckets')):
        raise RuntimeError('S3 public access block incomplete')
    ids = {r.get('ID') for r in lifecycle.get('Rules', []) if r.get('Status') == 'Enabled'}
    if not {'database-daily-expire-after-30-days', 'media-keep-current-retain-replaced-versions-30-days'}.issubset(ids):
        raise RuntimeError('Backup lifecycle rules missing')


if __name__ == '__main__':
    bucket = required('BACKUP_S3_BUCKET')
    verify(*(config(operation, bucket) for operation in ('get-bucket-versioning', 'get-object-lock-configuration',
             'get-public-access-block', 'get-bucket-lifecycle-configuration')))
    print('S3 protections verified')
