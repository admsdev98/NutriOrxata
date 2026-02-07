# Open Questions

This file tracks decisions that are not yet locked.

## Database and security

- Do we enable Postgres RLS for tenant isolation as defense-in-depth in v1?
- Password hashing: argon2id vs bcrypt (and operational constraints for Alpine images).
- Rate limiting approach: reverse proxy (Caddy) vs app-level middleware vs both.

## Messaging

- Spam/moderation: do we need message abuse controls in MVP?
- Attachment storage retention for photos/PDF in messages (no auto-delete currently specified).

## Training

- How far do we go with schema flexibility for "generic activities" without overusing JSONB?

## Operations

- Backups: do we want daily + weekly rotation scheme within the 30-day window?
- Monitoring: minimal stack (Caddy logs + container metrics) vs add Prometheus/Grafana later.
