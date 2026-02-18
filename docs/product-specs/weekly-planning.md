# Weekly Planning and Plan Instances

## Goal

Enable workers to create reusable weekly planning templates and generate tenant-scoped client week instances that can be edited safely without mutating the source template.

## Primary Users

- Worker (nutritionist/trainer).

## Concepts

### Week plan template

A tenant-scoped reusable plan structure that can be applied to many clients and many weeks.

Rules:

- Template data is reusable and mutable by workers.
- Template edits affect only future instances, not past generated instances.

### Week plan instance

A tenant-scoped weekly snapshot assigned to a specific client reference and week.

Rules:

- Instance identity is unique by `tenant_id + client_ref + week_start_date`.
- Instance data can be edited independently after creation.
- Editing an instance must never mutate the template used to generate it.

### Client reference

`client_ref` is an opaque tenant-local identifier used by worker workflows.

Rules:

- The API treats `client_ref` as a required string key.
- The API never resolves cross-tenant client references.

## Required Surfaces

- Worker can list/search week plan templates.
- Worker can create/update/delete week plan templates.
- Worker can create a week plan instance from a template.
- Worker can fetch an existing week plan instance by `client_ref + week_start_date`.
- Worker can update week plan instance entries without changing template data.

## S06X Delivered Follow-up

- Worker planner includes inline template CRUD (create, edit, delete) without leaving weekly planning.
- Worker can bulk-assign one dish by scope:
  - one day
  - selected days
  - full week
- Dish suggestions are available for assignment via `slot_key`-aware ranking.
- Client has a minimum read-only weekly plan route at `/client/weekly-plan` with slot detail inspection.

### Suggestion endpoint

- `GET /api/planning/dish-suggestions`
  - Inputs: `slot_key` (required), optional `query`, optional `limit`.
  - Output: tenant-scoped dish list ranked by slot-derived meal type history and name keyword hints.
  - Behavior: if meal-type matches exist, results are filtered to ranked matches; otherwise fallback to tenant dishes.

## Required Fields (v1)

Week plan template:

- `name` (required)
- `days[]` where each day has:
  - `day_key` (`mon|tue|wed|thu|fri|sat|sun`)
  - `slot_key` (required, free text id like `breakfast`, `lunch`, `dinner`, `snack_1`)
  - `dish_template_id` (optional)
  - `notes` (optional)

Week plan instance:

- `template_id` (required in S06 create flow)
- `client_ref` (required)
- `week_start_date` (required, ISO date)
- `days[]` with the same entry structure as template snapshot plus optional overrides.

## Access and Isolation Requirements

- Tenant-scoped: workers can only read/write templates and instances under their tenant.
- Read-only access mode blocks all mutations server-side with deterministic `403` and `detail="read_only"`.
- High-frequency list/get paths are index-reviewed for tenant filters and weekly retrieval.

## Error Contract (UI-facing)

- Missing template: `404` with `detail="week_plan_template_not_found"`.
- Missing instance: `404` with `detail="week_plan_instance_not_found"`.
- Duplicate instance per client/week: `409` with `detail="week_plan_instance_exists"`.
- Invalid template reference in clone flow: `404` with `detail="week_plan_template_not_found"`.

## Acceptance Criteria

- Worker flow remains within 2-3 clicks for common action:
  - open weekly plan tab -> select week -> create from template -> edit one slot -> save.
- UI always renders loading/error/empty states for template and instance panels.
- A template update after instance creation does not alter previously created instances.
- Worker in read-only mode can review templates/instances but cannot mutate any planning data.

## Non-goals (v1)

- Automatic conflict detection against training schedule.
- Multi-week recurring generation in one action.
- Manual instance creation without template clone.
- Client-side plan editing.
- Advanced optimization by macro target balancing inside planning flow.
