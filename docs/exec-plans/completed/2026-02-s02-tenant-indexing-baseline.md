# S02 Tenant Enforcement and Indexing Baseline

**Status:** Completed (with deferred audit-events item)

References:

- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`
- `docs/SECURITY.md`
- `apps/api/alembic/versions/0002_nutrition_profiles.py`
- `apps/api/alembic/versions/0003_food_library.py`

## Goals

- Verify tenant scoping on implemented domain endpoints.
- Add tenant-oriented indexes for nutrition and food data access.
- Establish integration-test baseline for tenant isolation.

## Delivery Checklist

- [x] Tenant filters are enforced in implemented nutrition and food endpoint paths.
- [x] Tenant-oriented indexes were added for nutrition and food tables.
- [x] Tenant isolation integration baseline is implemented in food endpoint tests.
- [x] Migration chain (`0001 -> 0002 -> 0003`) is validated on a fresh PostgreSQL database.
- [x] Audit event baseline was explicitly deferred and tracked as tech debt TD-006.

## Verification Checklist

Backend tests:

- [x] `PYTHONPATH=. ./.venv/bin/pytest -q tests/test_food_endpoints.py`
  - Observed: pass (`3 passed`) including tenant read/write isolation and read-only mutation blocking.

Migration validation (fresh DB via isolated compose project):

- [x] `DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 docker compose -p pres06mig -f infra/compose/dev.yml up -d db minio`
- [x] `DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 docker compose -p pres06mig -f infra/compose/dev.yml run --rm api alembic upgrade head`
  - Observed: upgrades `0001_init_auth`, `0002_nutrition_profiles`, `0003_food_library` applied successfully.
- [x] `DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 docker compose -p pres06mig -f infra/compose/dev.yml down -v`

API smoke (seeded worker on isolated stack):

- [x] `DEV_DB_PORT=15436 DEV_MINIO_PORT=19130 DEV_MINIO_CONSOLE_PORT=19131 DEV_API_PORT=18022 DEV_WEB_PORT=15185 docker compose -p pres06smoke2 -f infra/compose/dev.yml up -d db minio`
- [x] `DEV_DB_PORT=15436 DEV_MINIO_PORT=19130 DEV_MINIO_CONSOLE_PORT=19131 DEV_API_PORT=18022 DEV_WEB_PORT=15185 docker compose -p pres06smoke2 -f infra/compose/dev.yml run --rm api alembic upgrade head`
- [x] `DEV_DB_PORT=15436 DEV_MINIO_PORT=19130 DEV_MINIO_CONSOLE_PORT=19131 DEV_API_PORT=18022 DEV_WEB_PORT=15185 docker compose -p pres06smoke2 -f infra/compose/dev.yml up -d minio_init api`
- [x] `curl -sS http://localhost:18022/api/health` returns `{"status":"ok"}`.
- [x] Login with seeded worker (`s04_test_worker@example.com` / `TestPass123!`) and call:
  - `GET /api/food/ingredients` -> `200`
  - `POST /api/food/ingredients` -> `200`
- [x] `DEV_DB_PORT=15436 DEV_MINIO_PORT=19130 DEV_MINIO_CONSOLE_PORT=19131 DEV_API_PORT=18022 DEV_WEB_PORT=15185 docker compose -p pres06smoke2 -f infra/compose/dev.yml down -v`

## Notes / Known gaps

- Audit event baseline for security-relevant actions remains pending and is tracked as TD-006 (target S10-S11).
