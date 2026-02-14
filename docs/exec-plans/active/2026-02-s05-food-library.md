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

- [ ] Alembic migration for `ingredients` table + indexes
- [ ] `/api/food/ingredients` list/search
- [ ] `/api/food/ingredients` create (WriteAccess)
- [ ] `/api/food/ingredients/{id}` get/update/delete (WriteAccess for mutations)
- [ ] `/api/food/ingredients/{id}/used-by` usage inspection
- [ ] `DELETE` returns `409 ingredient_in_use` when referenced

Dish templates:

- [ ] Alembic migration for `dish_templates` + `dish_template_items`
- [ ] `/api/food/dish-templates` list/search
- [ ] `/api/food/dish-templates/{id}` get
- [ ] `/api/food/dish-templates` create/update/delete (WriteAccess)
- [ ] Totals computed from items (service layer)

Tests:

- [ ] Unit tests for macro calculations
- [ ] Basic tenant isolation checks for food endpoints
- [ ] Read-only mutation checks (403 `read_only`)

## Frontend Checklist

- [ ] Route added: `/worker/library/food`
- [ ] Navigation entry available from header
- [ ] Ingredients UI: list/search + create/edit/delete
- [ ] Dish templates UI: list/search + create/edit/delete with items and macro preview
- [ ] When ingredient delete is blocked, show which dish templates use it (via `used-by`)

## Verification Checklist

Backend:

- [ ] `docker exec nutriorxata-v1-api-1 python -m unittest discover -s tests -p 'test_*.py' -v`
- [ ] Apply migrations in dev (`alembic upgrade head`) and verify endpoints via curl

Frontend:

- [ ] `docker exec nutriorxata-v1-web-1 npm run build`
- [ ] Manual smoke:
  - login
  - create ingredient
  - create dish template
  - try deleting ingredient in use and confirm usage list appears
