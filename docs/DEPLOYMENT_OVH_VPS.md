# Deployment Baseline (OVH VPS)

v1 will run on an OVH VPS using Docker Compose.

## 1) Services (minimum)

- Reverse proxy with TLS termination
- API (FastAPI)
- Web (static SPA)
- Postgres
- MinIO (S3-compatible storage)
- Job runner (exports/TTL/reminders)

## 2) Security baseline

- SSH keys only
- Firewall (UFW)
- fail2ban
- Strict CORS
- Secrets via environment variables (never committed)

## 3) Backups

- Encrypted backups for Postgres and MinIO.
- Retention: 30 days.
- Restore runbook must be tested.
