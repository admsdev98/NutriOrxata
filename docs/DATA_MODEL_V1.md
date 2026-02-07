# Data Model v1 (Blueprint)

This document describes the v1 PostgreSQL schema at a blueprint level: tables, PKs, FKs, constraints, and indexing.

It is written to support:

- strict multi-tenant isolation (worker == tenant)
- safe data export and "delete my data" (tenant purge)
- predictable performance (indexes match access paths)

Reference docs:

- `docs/DB_SECURITY_AND_INDEXING.md`
- `docs/AUTH_TRIAL_SUBSCRIPTION.md`
- `docs/DATA_EXPORT_AND_DELETION.md`

## 0) Conventions

Identifiers:

- Use UUIDs for any IDs exposed in URLs.
- Primary keys are UUID unless explicitly stated.
- Every tenant-owned table includes `tenant_id`.

Multi-tenant FK pattern (recommended):

- For tables that reference other tenant-owned rows, use composite foreign keys:
  - `(tenant_id, referenced_id) -> referenced_table(tenant_id, id)`
- To enable that in PostgreSQL, each referenced table defines `UNIQUE (tenant_id, id)` even if `id` is globally unique.

Timestamps:

- Use `timestamptz`.
- Every row has `created_at`.
- Use `updated_at` on mutable entities.

Soft delete vs purge:

- Normal UX may use `archived_at`/`is_active` fields.
- "Delete my data" is a hard purge of all tenant data from active systems.

Email uniqueness:

- Workers: email unique globally (case-insensitive).
- Clients: email unique per tenant (case-insensitive).

Postgres extensions (expected):

- `pgcrypto` (UUID generation, crypto helpers)
- `pg_trgm` (optional, for fast contains-search)

## 1) Entity map (at a glance)

Legend:

- PK: primary key
- FK: foreign key
- UQ: unique constraint
- IDX: index

### 1.1 Core tables list

| Table | Purpose | PK | Tenant-scoped | Key FKs | Key indexes |
|---|---|---|---|---|---|
| `tenants` | Worker tenant boundary + subscription/trial state | `id` | n/a | n/a | `trial_ends_at`, `status` |
| `users` | Auth identities (worker + client) | `id` | yes | `tenant_id` | worker email UQ, client email UQ per tenant |
| `email_verification_tokens` | Worker verify email flow | `id` | yes | `user_id` | `token_hash`, `expires_at` |
| `password_reset_tokens` | Password reset flow | `id` | yes | `user_id` | `token_hash`, `expires_at` |
| `client_invites` | Invite client (24h) | `id` | yes | `client_id` | `token_hash`, `expires_at` |
| `clients` | Managed clients (can exist without login) | `id` | yes | optional `user_id` | `(tenant_id, is_active)`, name search |
| `client_custom_fields` | Worker-defined extra fields (limit 10) | `id` | yes | `client_id` | `(tenant_id, client_id)` |
| `client_nutrition_profiles` | Nutrition inputs per client | `client_id` | yes | `client_id` | `(tenant_id, client_id)` |
| `client_calorie_targets` | Targets history (computed vs final) | `id` | yes | `client_id`, `created_by_user_id` | `(tenant_id, client_id, effective_from)` |
| `tenant_meal_slots` | Meal slots defaults per tenant | `id` | yes | `tenant_id` | `(tenant_id, sort_order)` |
| `ingredients` | Ingredient library (per 100g macros) | `id` | yes | `created_by_user_id` | name search, `(tenant_id, archived_at)` |
| `dish_templates` | Dish base templates | `id` | yes | `created_by_user_id` | name search |
| `dish_template_items` | Ingredient grams in a dish template | `id` | yes | `dish_template_id`, `ingredient_id` | `(tenant_id, dish_template_id)` |
| `week_plans` | Week plan header | `id` | yes | `client_id` | UQ `(tenant_id, client_id, week_start)` |
| `week_plan_meals` | Meals in a week plan (date + slot) | `id` | yes | `week_plan_id`, `meal_slot_id` | `(tenant_id, week_plan_id, meal_date)` |
| `dish_instances` | Per-plan copy of a dish when edited | `id` | yes | `week_plan_meal_id` | `(tenant_id, week_plan_meal_id)` |
| `dish_instance_items` | Items for a dish instance (lock/unlock) | `id` | yes | `dish_instance_id`, `ingredient_id` | `(tenant_id, dish_instance_id)` |
| `routine_templates` | Routine templates (gym/run/walk/etc) | `id` | yes | `created_by_user_id` | name search |
| `routine_template_items` | Routine items (activities/exercises) | `id` | yes | `routine_template_id` | `(tenant_id, routine_template_id, sort_order)` |
| `routine_assignments` | Routine assigned to a client | `id` | yes | `client_id`, `routine_template_id` | `(tenant_id, client_id, starts_on)` |
| `workout_sessions` | Client workout sessions | `id` | yes | `client_id`, optional `routine_assignment_id` | `(tenant_id, client_id, started_at)` |
| `workout_entries` | Logged performance per routine item | `id` | yes | `workout_session_id`, optional `routine_template_item_id` | `(tenant_id, workout_session_id)` |
| `conversations` | Worker-client conversation | `id` | yes | `client_id` | UQ `(tenant_id, client_id)` |
| `messages` | Message stream | `id` | yes | `conversation_id`, `sender_user_id` | `(tenant_id, conversation_id, created_at)` |
| `media_objects` | S3/MinIO object metadata | `id` | yes | `uploaded_by_user_id` | `(tenant_id, kind, expires_at)` |
| `message_attachments` | Link messages to media objects | `id` | yes | `message_id`, `media_object_id` | `(tenant_id, message_id)` |
| `progress_checkins` | Weekly weight + notes | `id` | yes | `client_id` | UQ `(tenant_id, client_id, checkin_date)` |
| `progress_photos` | Optional photos with 90d TTL | `id` | yes | `client_id`, `media_object_id` | `(tenant_id, client_id, expires_at)` |
| `in_app_notifications` | Notifications/reminders (30/15/7/1) | `id` | yes | `user_id` | `(tenant_id, user_id, created_at)` |
| `jobs` | Background jobs (export, TTL cleanup) | `id` | yes | `tenant_id` | `(status, run_after)` |
| `exports` | Export requests + artifacts | `id` | yes | `job_id`, `requested_by_user_id` | `(tenant_id, requested_by_user_id, created_at)` |
| `audit_events` | Security-relevant audit trail (no PII) | `id` | yes | `actor_user_id` | `(tenant_id, created_at)`, `(tenant_id, action)` |
| `work_items` | Worker planner (tasks/appointments/notes) | `id` | yes | optional `client_id`, `assignee_user_id` | `(tenant_id, due_at)`, `(tenant_id, client_id)` |

Notes:

- Some entities can be split/merged during implementation, but the constraints and access paths should remain consistent with this blueprint.

## 2) Table specs (detailed)

Types below are illustrative. Final DDL is authored during Sprint 00.

### 2.1 `tenants`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `status` | text | no | `active` | CHECK in (`active`,`expired`,`disabled`,`deleted`) |
| `trial_starts_at` | timestamptz | yes | | set at worker verification |
| `trial_ends_at` | timestamptz | yes | | 30 days from verification |
| `subscription_status` | text | no | `trial` | CHECK in (`trial`,`active`,`expired`) |
| `manual_unlock_at` | timestamptz | yes | | support action |
| `created_at` | timestamptz | no | now() | |
| `updated_at` | timestamptz | yes | | |

Indexes:

- `IDX tenants(status)`
- `IDX tenants(trial_ends_at)`

### 2.2 `users`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | FK -> `tenants(id)` |
| `role` | text | no | | CHECK in (`worker`,`client`) |
| `email` | text | no | | case-insensitive uniqueness via indexes |
| `email_verified_at` | timestamptz | yes | | required for worker login |
| `password_hash` | text | no | | store strong hash (argon2id/bcrypt) |
| `is_active` | boolean | no | true | |
| `locale` | text | no | `es-ES` | ES-first, neutral copy |
| `timezone` | text | no | `Europe/Madrid` | default; configurable |
| `created_at` | timestamptz | no | now() | |
| `updated_at` | timestamptz | yes | | |

Constraints:

- `UNIQUE (tenant_id, id)`

Indexes:

- Worker email uniqueness (global): `UNIQUE (lower(email)) WHERE role = 'worker'`
- Client email uniqueness (per tenant): `UNIQUE (tenant_id, lower(email)) WHERE role = 'client'`
- `IDX (tenant_id, role)`

### 2.3 `email_verification_tokens`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | FK -> `tenants` |
| `user_id` | uuid | no | | FK -> `users` (composite recommended) |
| `token_hash` | bytea | no | | store hash, not raw token |
| `expires_at` | timestamptz | no | | |
| `consumed_at` | timestamptz | yes | | |
| `created_at` | timestamptz | no | now() | |

Indexes:

- `UNIQUE (token_hash)`
- `IDX (tenant_id, user_id, created_at)`
- `IDX (expires_at)`

### 2.4 `password_reset_tokens`

Same structure as `email_verification_tokens`.

### 2.5 `clients`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | FK -> `tenants` |
| `user_id` | uuid | yes | | FK -> `users` (client login identity) |
| `full_name` | text | no | | |
| `notes` | text | yes | | |
| `is_active` | boolean | no | true | worker can deactivate |
| `created_at` | timestamptz | no | now() | |
| `updated_at` | timestamptz | yes | | |

Constraints:

- `UNIQUE (tenant_id, id)`
- optional: `UNIQUE (tenant_id, user_id)` (one login identity per client record)

Indexes:

- `IDX (tenant_id, is_active, full_name)`
- Optional search: `GIN (full_name gin_trgm_ops)` if `pg_trgm` enabled

### 2.6 `client_invites`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|:---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | FK -> `tenants` |
| `client_id` | uuid | no | | FK -> `clients` (composite recommended) |
| `email` | text | no | | invite target |
| `token_hash` | bytea | no | | |
| `expires_at` | timestamptz | no | | fixed 24h |
| `consumed_at` | timestamptz | yes | | |
| `created_by_user_id` | uuid | no | | FK -> `users` |
| `created_at` | timestamptz | no | now() | |

Indexes:

- `UNIQUE (token_hash)`
- `IDX (tenant_id, client_id, created_at)`
- `IDX (expires_at)`

### 2.7 `client_custom_fields`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | |
| `client_id` | uuid | no | | |
| `key` | text | no | | |
| `value` | text | yes | | |
| `created_at` | timestamptz | no | now() | |

Constraints:

- `UNIQUE (tenant_id, client_id, key)`

Note:

- Enforce max 10 fields per client at application level (and optionally with a constraint trigger).

### 2.8 `client_nutrition_profiles`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `tenant_id` | uuid | no | | |
| `client_id` | uuid | no | | PK/FK to `clients` |
| `sex` | text | no | | CHECK in (`male`,`female`) (extend later if needed) |
| `birth_date` | date | no | | used for age |
| `height_cm` | integer | no | | |
| `weight_kg` | numeric(6,2) | no | | |
| `activity_factor` | numeric(4,3) | no | | e.g. 1.55 |
| `notes` | text | yes | | allergies/diseases/preferences can start here |
| `updated_at` | timestamptz | yes | | |
| `created_at` | timestamptz | no | now() | |

Constraints:

- `PRIMARY KEY (client_id)`
- `UNIQUE (tenant_id, client_id)`

### 2.9 `client_calorie_targets`

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | |
| `client_id` | uuid | no | | |
| `phase` | text | no | | CHECK in (`cut`,`maintenance`,`bulk`) |
| `formula` | text | no | | CHECK in (`mifflin`,`harris`,`katch`) |
| `computed_bmr` | integer | no | | |
| `computed_tdee` | integer | no | | |
| `adjustment_percent` | integer | no | | e.g. -15, +10 |
| `suggested_kcal_per_day` | integer | no | | |
| `final_kcal_per_day` | integer | no | | editable |
| `final_kcal_per_week` | integer | yes | | optional override |
| `macro_target_mode` | text | no | `pct` | CHECK in (`pct`,`grams`) |
| `protein_pct` | numeric(5,2) | yes | | when pct mode |
| `carbs_pct` | numeric(5,2) | yes | | |
| `fat_pct` | numeric(5,2) | yes | | |
| `protein_g` | numeric(6,2) | yes | | when grams mode |
| `carbs_g` | numeric(6,2) | yes | | |
| `fat_g` | numeric(6,2) | yes | | |
| `effective_from` | date | no | | |
| `effective_to` | date | yes | | |
| `created_by_user_id` | uuid | no | | |
| `created_at` | timestamptz | no | now() | |

Indexes:

- `IDX (tenant_id, client_id, effective_from DESC)`

### 2.10 Food library (`ingredients`, `dish_templates`, `dish_template_items`)

`ingredients` (per 100g):

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | |
| `name` | text | no | | |
| `kcal_per_100g` | integer | no | | |
| `protein_g_per_100g` | numeric(6,2) | no | | |
| `carbs_g_per_100g` | numeric(6,2) | no | | |
| `fat_g_per_100g` | numeric(6,2) | no | | |
| `archived_at` | timestamptz | yes | | |
| `created_by_user_id` | uuid | no | | |
| `created_at` | timestamptz | no | now() | |
| `updated_at` | timestamptz | yes | | |

Indexes:

- `IDX (tenant_id, archived_at)`
- Optional search: `GIN (name gin_trgm_ops)`

`dish_templates`:

- holds dish name, notes, optional tags
- items in `dish_template_items` reference ingredients with grams

`dish_template_items`:

- `(tenant_id, dish_template_id)` index
- composite FKs to enforce tenant match

### 2.11 Weekly planning (`week_plans`, `week_plan_meals`, `dish_instances`, `dish_instance_items`)

`week_plans`:

| Column | Type | Null | Default | Notes |
|---|---:|:---:|---:|---|
| `id` | uuid | no | gen | PK |
| `tenant_id` | uuid | no | | |
| `client_id` | uuid | no | | |
| `week_start` | date | no | | Monday in worker timezone |
| `created_at` | timestamptz | no | now() | |
| `updated_at` | timestamptz | yes | | |

Constraints:

- `UNIQUE (tenant_id, client_id, week_start)`

`tenant_meal_slots`:

- defaults per tenant, ordered

`week_plan_meals`:

- `(week_plan_id, meal_date, meal_slot_id)` unique recommended
- references either a `dish_template_id` (no edits) OR a `dish_instance_id` (edited copy)
- enforce XOR via CHECK constraint

`dish_instances`:

- created when worker edits within a plan
- includes scaling mode and macro targets

`dish_instance_items`:

- includes `is_locked` and optional `macro_role` (protein/carb/fat/neutral)
- supports both proportional scaling and macro-optimized mode

### 2.12 Training (`routine_templates`, `routine_assignments`, logs)

We support common activities with a flexible schema:

- `routine_template_items.activity_type`: `strength` | `cardio` | `other`
- store parameters in a small set of columns + optional JSONB for uncommon fields

`workout_entries` stores common metrics:

- `reps`, `sets`, `weight_kg`
- `duration_sec`, `distance_km`
- `notes`

### 2.13 Messaging + media

Media storage:

- `media_objects` represent MinIO/S3 objects under `tenant/{tenant_id}/...`
- download/upload via signed URLs

MVP limits:

- photos <= 5MB
- PDF <= 2MB
- audio TTL 7 days (worker 120s, client 60s)

### 2.14 Progress tracking + photos TTL

Progress photos:

- stored as `media_objects` with `expires_at = created_at + interval '90 days'`
- reminders are created as `in_app_notifications` at 30/15/7/1 days before `expires_at`

### 2.15 Jobs, exports, audits

`jobs`:

- used for export ZIP generation, TTL cleanup (audio/photos/exports), reminder creation
- runner should claim jobs with `FOR UPDATE SKIP LOCKED`

`exports`:

- references a `media_object_id` for the generated ZIP artifact
- export ZIP TTL is short (24-72 hours)

`audit_events`:

- stores security-relevant actions without PII
- includes `action`, `entity_type`, `entity_id`, `metadata` (JSONB) with careful redaction

## 3) Open items to finalize during Sprint 00

- Do we enforce RLS in Postgres for tenant isolation (recommended as defense-in-depth)?
- Exact split between structured columns vs JSONB for routine items.
- Exact list of CHECK constraints for statuses and enums.
