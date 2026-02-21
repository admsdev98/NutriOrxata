# QA / Testing Rules

## What we must protect

- Tenant isolation: no cross-tenant reads or writes.
- Authorization: no role boundary bypass (worker vs client).
- Access modes: `read_only` blocks mutations with deterministic `403` + `detail="read_only"`.
- Migrations: upgrade must succeed on a fresh DB.
- UX invariants on touched flows: mobile-first, calm UI, common actions in 2-3 clicks.

## Minimum per sprint

- Unit tests for pure logic.
- Integration tests for tenant isolation + authz + access modes.
- Minimal manual smoke for critical flows.

## Manual smoke expectations

- Every critical empty state includes a clear next action.
- Read-only and blocked states are explicit and understandable.
- Worker flows avoid excessive scrolling for primary actions.

## Commands

API:

```bash
cd apps/api
pytest -q
```

Web:

```bash
npm --prefix apps/web run build
```

Infra smoke:

```bash
docker compose -p nutriorxata-v1 -f infra/compose/dev.yml up --build -d
curl -sS http://localhost:8010/api/health
docker compose -p nutriorxata-v1 -f infra/compose/dev.yml down
```

## Severity

- Blocker: tenant leak, authz bypass, read-only bypass, migration failure/corruption.
- High: core workflow broken.
- Medium: partial degradation with workaround.
- Low: polish/docs.

## Common gaps to track (keep visible)

- Integration coverage tends to lag outside the Food domain as new modules land.
- Scripted smoke checks for critical flows are expected to move into `scripts/` over time.
