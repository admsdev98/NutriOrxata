# S06 Weekly Planning and Plan Instances

Status: Completed

References:

- `docs/product-specs/weekly-planning.md`
- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`

## Goals

- Add tenant-scoped week plan templates for reusable planning structures.
- Add tenant-scoped week plan instances by `client_ref + week_start_date`.
- Enforce template-to-instance snapshot behavior.
- Keep mutations blocked in read-only mode.

## Backend Checklist

Data model and migration:

- [x] Alembic migration `0004_weekly_planning` added.
- [x] `week_plan_templates` and `week_plan_template_items` tables added.
- [x] `week_plan_instances` and `week_plan_instance_items` tables added.
- [x] Tenant and weekly retrieval indexes added.
- [x] Unique instance constraint per tenant/client/week added.

API:

- [x] `/api/planning/week-plan-templates` list/search added.
- [x] `/api/planning/week-plan-templates/{id}` get/update/delete added.
- [x] `/api/planning/week-plan-instances/from-template` create added.
- [x] `/api/planning/week-plan-instances/by-client-week` get added.
- [x] `/api/planning/week-plan-instances/{id}` get/update added.
- [x] Read-only mode blocks planning mutations with deterministic `403 read_only`.

Tests:

- [x] Planning integration tests added in `apps/api/tests/test_planning_endpoints.py`.
- [x] Tenant isolation checks for planning flows.
- [x] Snapshot immutability checks: instance edits do not mutate template.

## Frontend Checklist

- [x] Weekly planning tab is functional in worker workspace.
- [x] Worker can select week and create instance from template.
- [x] Worker can edit instance items and save.
- [x] Worker sees loading/error/empty states for templates and instances.
- [x] Read-only mode disables mutation actions in weekly planning panel.

## Verification Checklist

Backend:

- [x] `docker exec compose-api-1 python -m unittest discover -s tests -p 'test_*.py' -v`
- [x] `docker exec compose-api-1 alembic upgrade head`

Frontend:

- [x] `docker exec compose-web-1 npm run build`

Manual smoke:

- [x] Login in worker workspace.
- [x] Open weekly plan tab for a client.
- [x] Create week instance from template.
- [x] Edit one slot and save.
- [x] Confirm template data remains unchanged after instance edit.
