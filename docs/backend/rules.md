# Backend Rules

Audience: engineers and subagents.

## Layering

- `domain`: entities/enums (no FastAPI, no SQLAlchemy sessions).
- `service`: business rules.
- `infrastructure`: external dependencies.
- `api`: schemas + routers.

Shared foundations live in `apps/api/app/core`.

Allowed dependency direction:

- `api -> service -> domain`
- `api -> infrastructure`

Disallowed:

- `domain` importing from `api`, `service`, or `infrastructure`.
- Cross-domain imports that bypass module boundaries.

## Security and Tenancy

Security invariants:

- No secrets committed to git.
- Server-side authorization is mandatory.
- Tenant isolation is mandatory for all domain data access.
- Data minimization by default.

- Every protected route validates identity and tenant scope.
- Tenant filtering is explicit in query construction.
- Role boundaries are explicit (worker vs client).

Access modes:

- `active`: normal.
- `read_only`: all mutations fail with `403` + `detail="read_only"`.
- `blocked`: access denied.

Access-state policy (product-level):

- Worker not verified: blocked.
- Trial active: normal access.
- Trial expired: worker read-only, client blocked.
- Disabled tenant: blocked.

## Error Contract (UI-facing)

- `401` missing/invalid token: stable `detail` code (e.g. `missing_token`).
- `403` read-only mutation: `detail="read_only"`.
- `404` missing resource.
- `409` domain conflicts with stable codes.

## Migrations and Index Review

- Schema changes go through Alembic.
- Every tenant-filtered lookup path gets an index review.

## Data lifecycle

- Data export must remain available.
- Tenant deletion flow must remain available.
- Retention rules must be explicit for media and backups.

## Audit events

- Record security-relevant audit events without storing sensitive payloads.
- If missing for a touched flow, add it or track explicitly as debt (see TD-006 in `docs/exec-plans/rules.md`).

## Reliability baseline

- Keep the core health endpoint available.
- Prefer startup ordering and dependency health checks via compose.

## Testing

- Unit tests for pure logic.
- Integration tests for tenant isolation + authz + access-mode on touched endpoints.

```bash
cd apps/api
pytest -q
```
