# API Conventions (v1)

This document defines API-level conventions for consistency, security, and DX.

## 1) URL structure

- Public health: `/health`
- API namespace: `/api/*`
- Versioning: start unversioned in MVP; introduce `/api/v1` only when necessary.

## 2) Auth

- Use bearer tokens (JWT) for API requests.
- Tokens include: `sub`, `role`, `tenant_id`, `exp`.
- Server must enforce tenant isolation for every request.

## 3) Error format

Return consistent errors:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Do not leak sensitive details in production.

## 4) Pagination

- Default: cursor-based pagination for large lists.
- Provide `limit` (bounded) and `cursor`.

## 5) Idempotency

- For operations like export or purge, consider idempotency keys.

## 6) Rate limits

Must rate limit at least:

- login
- invite
- upload
- export

Enforce at app level, and optionally also at the proxy.

## 7) Uploads and downloads

- Use signed URLs for S3-compatible storage.
- Enforce MIME allowlists and max size.
- Never expose buckets publicly.

## 8) Audit events

For critical actions, write audit events (no PII) and include:

- `tenant_id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `created_at`
