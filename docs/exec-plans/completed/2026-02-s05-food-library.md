# S05 Food Library (Ingredients + Dish Templates)

**Status:** Completed

References:

- `docs/product-specs/food-library.md`
- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`

## Goals

- Provide tenant-scoped reusable ingredients.
- Provide tenant-scoped dish templates composed of ingredients.
- Keep mutations blocked by server when token is `read_only`.
- Provide a dedicated worker route for fast access: `/worker/library/food`.

## Backend Checklist

Ingredients:

- [x] Alembic migration for `ingredients` table + indexes
- [x] `/api/food/ingredients` list/search
- [x] `/api/food/ingredients` create (WriteAccess)
- [x] `/api/food/ingredients/{id}` get/update/delete (WriteAccess for mutations)
- [x] `/api/food/ingredients/{id}/used-by` usage inspection
- [x] `DELETE` returns `409 ingredient_in_use` when referenced

Dish templates:

- [x] Alembic migration for `dish_templates` + `dish_template_items`
- [x] `/api/food/dish-templates` list/search
- [x] `/api/food/dish-templates/{id}` get
- [x] `/api/food/dish-templates` create/update/delete (WriteAccess)
- [x] Totals computed from items (service layer)

Tests:

- [x] Unit tests for macro calculations
- [x] Basic tenant isolation checks for food endpoints
- [x] Read-only mutation checks (403 `read_only`)

## Frontend Checklist

- [x] Route added: `/worker/library/food`
- [x] Navigation entry available from header
- [x] Ingredients UI: list/search + create/edit/delete
- [x] Dish templates UI: list/search + create/edit/delete with items and macro preview
- [x] When ingredient delete is blocked, show which dish templates use it (via `used-by`)

## Verification Checklist

Backend:

- [x] `docker compose -f infra/compose/dev.yml exec api python -m unittest discover -s tests -p 'test_*.py' -v`
- [x] Apply migrations on a fresh DB (`alembic upgrade head`)
- [x] Verify endpoints via curl (login -> list ingredients + dish templates returns 200)

Frontend:

- [x] `npm run build` (run from `apps/web/`)
- [x] Manual smoke:
  - [x] login (dev seed user: `s04_test_worker@example.com` / `TestPass123!`, no email verification needed)
  - [x] create ingredient
  - [x] create dish template
  - [x] try deleting ingredient in use and confirm usage list appears

## Notes

- 2026-02-18: unit tests verified via dev compose (`api` service). Frontend build verified locally; `docker compose ... exec web npm run build` currently fails due to an optional Rollup native dependency in the container image.
- 2026-02-18: `alembic upgrade head` verified against a fresh Postgres volume using an isolated compose project name (to avoid conflicts with any existing local stack):

  ```bash
  DEV_DB_PORT=15433 DEV_MINIO_PORT=19100 DEV_MINIO_CONSOLE_PORT=19101 DEV_API_PORT=18010 DEV_WEB_PORT=15173 \
    docker compose -p s05migcheck -f infra/compose/dev.yml up -d db minio
  DEV_DB_PORT=15433 DEV_MINIO_PORT=19100 DEV_MINIO_CONSOLE_PORT=19101 DEV_API_PORT=18010 DEV_WEB_PORT=15173 \
    docker compose -p s05migcheck -f infra/compose/dev.yml run --rm api alembic upgrade head
  DEV_DB_PORT=15433 DEV_MINIO_PORT=19100 DEV_MINIO_CONSOLE_PORT=19101 DEV_API_PORT=18010 DEV_WEB_PORT=15173 \
    docker compose -p s05migcheck -f infra/compose/dev.yml down -v
  ```

  If your local persistent dev DB gets out of sync with repo migrations, prefer using a fresh compose project (as above) or resetting the dev volume.
