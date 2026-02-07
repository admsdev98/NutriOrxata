# Security and Privacy (Baseline)

Client data is sensitive by default. This document defines minimum expectations.

## 1) Data classification

- Sensitive: any client personal info, health constraints, check-ins, messages.
- Operational: app logs, audit events (still treat carefully).

## 2) Access control

- Tenant isolation is mandatory.
- A client can only access their own data under their worker's tenant.
- A worker can only access data inside their tenant.

Trial/subscription gate:

- A worker cannot access the app until email is verified.
- When a tenant trial expires, the worker is forced to read-only.
- Clients cannot access the app while the tenant is expired (show a calm explanation).

## 3) Retention

- Attachments and audio must have explicit retention rules.
- Ephemeral audio (if implemented) must delete automatically after a short TTL.

MVP rules:

- Audio messages: TTL 7 days.
- Progress photos (optional): TTL 90 days with in-app reminders (30/15/7/1 days).
- Export ZIP files: short TTL (24-72 hours).

## 4) Upload safety

- Restrict allowed MIME types.
- Enforce file size limits.
- Virus/malware scanning is a future requirement if we allow arbitrary files.

MVP limits:

- Photos: <= 5MB
- PDF: <= 2MB

## 5) Auditability (minimum)

- Record "who did what" for critical actions:
  - client created/deactivated
  - plan assigned
  - targets changed
  - data export
  - delete my data (tenant purge)

## 6) Secrets

- Never commit `.env` or credentials.
- Use environment variables and compose overrides for local dev.

## 7) Backups

- Backups are encrypted.
- Retention: 30 days.

Important limitation:

- Data deletion removes active data immediately.
- Existing backups are not rewritten. Data disappears from backups when they expire by rotation.
