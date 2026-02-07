# DB, Security, and Indexing Baseline

This document defines the security and database expectations for v1.

## 1) Tenant isolation

- Every worker is a tenant boundary.
- Every entity owned by a worker must include `tenant_id`.
- Authorization and tenant isolation must be enforced server-side for every request.

Recommended defense-in-depth:

- Consider Postgres RLS as a second barrier (optional, but recommended).

## 2) Indexing strategy (baseline)

Identifiers:

- Use UUIDs for tenant and user identities, and for any IDs exposed in URLs.
- Avoid sequential IDs in public URLs to reduce enumeration risk.

Indexes must match query patterns. Expected patterns:

- List screens: `(tenant_id, created_at)`
- Client-owned entities: `(tenant_id, client_id, created_at)`
- Weekly planning: `(tenant_id, client_id, week_start)`
- Messaging:
  - `(tenant_id, conversation_id, created_at)`
  - `(tenant_id, user_id)` for unread counters/last_read
- Work planner:
  - `(tenant_id, assignee_id, due_at)`
  - `(tenant_id, starts_at)`

Search:

- If we need "contains" search, use `pg_trgm` with `GIN` indexes.

## 3) Upload security

- Allowlist MIME types.
- Enforce size limits:
  - photos: <= 5MB
  - PDFs: <= 2MB
  - audio: duration limits + storage TTL
- Store objects under `tenant/{tenant_id}/...`.
- Serve downloads via signed URLs.

## 4) Rate limiting

Rate limit at least:

- login
- invites
- uploads
- export

## 5) Data retention

- Audio messages: TTL 7 days.
- Progress photos: TTL 90 days with in-app reminders (30/15/7/1 days before deletion).
