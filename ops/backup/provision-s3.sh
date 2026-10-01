#!/usr/bin/env bash
set -euo pipefail
# Explicit operator action only. Creates a NEW backup bucket with WORM protection.
if [[ ${1:-} != '--apply' ]]; then
  echo 'DRY RUN. After reviewing costs and permissions: BACKUP_S3_BUCKET=... BACKUP_AWS_REGION=... bash ops/backup/provision-s3.sh --apply'
  exit 0
fi
: "${BACKUP_S3_BUCKET:?required}"
: "${BACKUP_AWS_REGION:?required}"
export AWS_DEFAULT_REGION="$BACKUP_AWS_REGION"
if [[ "$BACKUP_AWS_REGION" == us-east-1 ]]; then
  aws s3api create-bucket --bucket "$BACKUP_S3_BUCKET" --object-lock-enabled-for-bucket
else
  aws s3api create-bucket --bucket "$BACKUP_S3_BUCKET" --region "$BACKUP_AWS_REGION" --create-bucket-configuration "LocationConstraint=$BACKUP_AWS_REGION" --object-lock-enabled-for-bucket
fi
aws s3api put-public-access-block --bucket "$BACKUP_S3_BUCKET" --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
aws s3api put-bucket-versioning --bucket "$BACKUP_S3_BUCKET" --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$BACKUP_S3_BUCKET" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-object-lock-configuration --bucket "$BACKUP_S3_BUCKET" --object-lock-configuration 'ObjectLockEnabled=Enabled,Rule={DefaultRetention={Mode=GOVERNANCE,Days=30}}'
aws s3api put-bucket-lifecycle-configuration --bucket "$BACKUP_S3_BUCKET" --lifecycle-configuration file://ops/backup/s3-lifecycle.json
aws s3api get-bucket-versioning --bucket "$BACKUP_S3_BUCKET"
aws s3api get-object-lock-configuration --bucket "$BACKUP_S3_BUCKET"
aws s3api get-bucket-lifecycle-configuration --bucket "$BACKUP_S3_BUCKET" --query 'Rules[].ID'
