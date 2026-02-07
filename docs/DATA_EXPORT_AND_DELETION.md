# Data Export and Deletion

This document defines the export and deletion guarantees.

## 1) Export (ZIP)

- Export is always available, including during read-only.
- Export is generated asynchronously as a job.
- Output:
  - a ZIP archive with structured data (JSON/CSV)
  - and media (attachments, progress photos, non-expired audio)
- Delivery:
  - stored temporarily in S3-compatible storage (MinIO)
  - downloaded via a signed URL
  - export files have a short TTL (e.g. 24-72 hours)

## 2) Delete my data (tenant purge)

- Delete is always available, including during read-only.
- Purge must be idempotent.
- Purge includes:
  - Postgres: delete all tenant data
  - Object storage: delete `tenant/{tenant_id}/...`
  - Revoke tokens/sessions
  - Write an audit event without PII

## 3) Backups and retention

- Postgres backups are encrypted.
- Object storage backups are encrypted.
- Retention: 30 days.

Important limitation:

- Purge deletes active data immediately.
- Existing backups are not rewritten. Data disappears from backups when they expire by rotation.
