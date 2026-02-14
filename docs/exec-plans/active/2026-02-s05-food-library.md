# S05 Food Library (Ingredients + Dish Templates)

Status: Active

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
- [ ] Basic tenant isolation checks for food endpoints
- [ ] Read-only mutation checks (403 `read_only`)

## Frontend Checklist

- [x] Route added: `/worker/library/food`
- [x] Navigation entry available from header
- [x] Ingredients UI: list/search + create/edit/delete
- [x] Dish templates UI: list/search + create/edit/delete with items and macro preview
- [x] When ingredient delete is blocked, show which dish templates use it (via `used-by`)

## Verification Checklist

Backend:

- [x] `docker exec nutriorxata-v1-api-1 python -m unittest discover -s tests -p 'test_*.py' -v`
- [x] Apply migrations in dev (`alembic upgrade head`) and verify endpoints

Frontend:

- [x] `docker exec nutriorxata-v1-web-1 npm run build`
- [ ] Manual smoke:
  - login
  - create ingredient
  - create dish template
  - try deleting ingredient in use and confirm usage list appears
