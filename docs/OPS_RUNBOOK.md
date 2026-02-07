# Ops Runbook (OVH VPS)

This runbook defines minimum operational procedures.

## 1) Deploy

- Use Docker Compose in `infra/compose/prod.yml`.
- Keep secrets in `infra/compose/.env` on the server (never in git).

Deploy command:

```bash
docker compose -p nutriorxata -f infra/compose/prod.yml --env-file infra/compose/.env up --build -d
```

## 2) Backups

Goals:

- Encrypted backups for Postgres and MinIO.
- Retention: 30 days.
- Restore must be tested.

Policy note:

- Tenant purge deletes active data immediately.
- Backups are not rewritten; data disappears when backups expire by rotation.

## 3) Restore (high level)

- Stop app writes.
- Restore Postgres dump.
- Restore MinIO data.
- Restart stack.

## 4) Security baseline

- SSH keys only.
- UFW enabled.
- fail2ban enabled.
- TLS terminated at reverse proxy.

## 5) Incident: tenant purge request

- User can trigger purge from the app.
- Support can run a server-side purge script if needed (future `scripts/purge_tenant.py`).
