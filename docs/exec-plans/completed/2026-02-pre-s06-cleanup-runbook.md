# 2026-02 Pre-S06 Cleanup Runbook

**Status:** Completed (Executed 2026-02-21)
**Context:** `docs/PLANS.md`, `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`
**Objective:** Make roadmap tracking and docs consistent (no contradictions) before starting S06.

---

## 1) Why this runbook exists

The repo has completed work for S00-S05, but the active breakdown checklist is not aligned (S00-S04 still show unchecked). Also, a few canonical docs are stale (schema snapshot, quality score, debt tracker).

This runbook is a single, step-by-step checklist that a coding agent can follow to:

- Align the sprint tracking with reality.
- Create missing sprint completion notes (S00-S02).
- Update tech debt to reflect real remaining gaps.
- Refresh generated schema snapshot.
- Record verification so S06 can start from a reliable baseline.

Non-goal: implement S06 planning functionality.

---

## 2) Preconditions

- Working directory: repository root.
- Branch: `main` (or a dedicated cleanup branch if preferred).
- No secrets committed.

---

## 3) Baseline checks (must do first)

1) Confirm clean working tree

```bash
git status --porcelain=v1
```

Expected: empty output.

2) Confirm current branch

```bash
git branch --show-current
```

3) Identify recent context

```bash
git log -10 --oneline --decorate
```

Expected: recent commits include S05 closure notes.

---

## 4) Step A - Fix the active breakdown tracking

File to edit:

- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`

Goal: S00-S05 checkboxes match completed work.

Do:

1) Mark S00 items as complete (`[x]`) if these exist:
   - `docs/README.md`
   - `ARCHITECTURE.md`
   - `AGENTS.md`
   - `docs/HUMAN_OVERVIEW.es.md`
   - No parallel conflicting docs trees.

2) Mark S01 items as complete (`[x]`) if these exist:
   - `apps/api/app/modules/auth/` exists and is the canonical auth module.
   - Deterministic auth error contracts are covered by `apps/api/tests/test_auth_endpoints.py`.
   - Access mode evaluation is covered by `apps/api/tests/test_access_mode_service.py`.

3) Mark S03 and S04 items as complete (`[x]`) because they have recorded verification:
   - `docs/exec-plans/completed/2026-02-s03-s04-verification.md`
   - `docs/exec-plans/completed/2026-02-s03-worker-visual-checklist.md`

4) Keep S05 as complete (`[x]`) (already closed):
   - `docs/exec-plans/completed/2026-02-s05-food-library.md`

5) For S02: eliminate ambiguity.
   - If audit events are NOT implemented as part of this cleanup (recommended), keep the audit item unchecked and explicitly mark it as deferred to tech debt.
   - Ensure the breakdown text points to:
     - Tenant isolation baseline tests already present for Food: `apps/api/tests/test_food_endpoints.py`.
     - Index reviews already present in migrations for Nutrition/Food.

Validation:

- Read the edited `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md` and confirm it does not contradict the completed notes.

---

## 5) Step B - Add missing completion notes (S00-S02)

Create three new files:

- `docs/exec-plans/completed/2026-02-s00-docs-harness.md`
- `docs/exec-plans/completed/2026-02-s01-auth-hardening.md`
- `docs/exec-plans/completed/2026-02-s02-tenant-indexing-baseline.md`

Each file MUST include these sections:

1) Header:
   - Title
   - `Status: Completed`
   - References (at minimum):
     - `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`
     - Any relevant product specs (if applicable)

2) Goals (1-4 bullets)

3) Checklist (with `[x]` items), describing what is delivered

4) Verification checklist
   - Include commands and expected outcomes.
   - Keep it reproducible.

5) Notes / Known gaps
   - If S02 audit events are deferred, state it explicitly and reference the tech debt ID.

Template you can copy:

```md
# SXX <Title>

**Status:** Completed

References:

- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`

## Goals

- ...

## Delivery Checklist

- [x] ...

## Verification Checklist

Backend:

- [x] `...`

Frontend:

- [x] `...`

## Notes / Known gaps

- ...
```

Update completed index:

- Edit `docs/exec-plans/completed/index.md` and add the new three files to the list.

Validation:

- `docs/exec-plans/completed/index.md` lists S00, S01, S02, S03/S04 verification, and S05.

---

## 6) Step C - Update tech debt tracker to reflect reality

File to edit:

- `docs/exec-plans/tech-debt-tracker.md`

Do:

1) Re-evaluate stale items:
   - TD-001: "Duplicate legacy auth/core paths".
   - TD-005: "Legacy duplicated docs trees".

If the duplicates no longer exist, mark them as closed (move them out of the Open Items table) and record closure in a note section at the bottom of the file, or create a "Closed Items" table.

2) Add a new tech debt item if needed:
   - "Audit event baseline missing" (if deferred).
   - "Generated schema snapshot is stale / lacks generator".

3) Keep TD-003 and TD-004, but ensure they are actionable:
   - TD-003 should name which domains lack tenant isolation/integration coverage.
   - TD-004 should point to `scripts/README.md` and target S10.

Validation:

- Every open item has: clear problem, impact, priority, and target sprint.

---

## 7) Step D - Refresh the DB schema snapshot (docs/generated)

File to edit:

- `docs/generated/db-schema.md`

Problem:

- The snapshot currently lists only auth tables and indexes. It does not include S04/S05 schema.

Do:

1) Update the snapshot to include at least these tables, constraints, and indexes:
   - `nutrition_profiles`
     - unique: `uq_nutrition_profiles_tenant_user`
     - indexes: `ix_nutrition_profiles_tenant_id`, `ix_nutrition_profiles_user_id`
   - `ingredients`
     - indexes: `ix_ingredients_tenant_id`, `ix_ingredients_tenant_name`
   - `dish_templates`
     - indexes: `ix_dish_templates_tenant_id`, `ix_dish_templates_tenant_name`
   - `dish_template_items`
     - indexes: `ix_dish_template_items_tenant_id`, `ix_dish_template_items_template_id`, `ix_dish_template_items_ingredient_id`, `ix_dish_template_items_tenant_ingredient_id`

2) Source-of-truth for exact names:
   - `apps/api/alembic/versions/0002_nutrition_profiles.py`
   - `apps/api/alembic/versions/0003_food_library.py`

Optional improvement (do not over-scope):

- Add a short note in `docs/generated/db-schema.md` explaining how it is generated/maintained (manual snapshot vs script), and ensure tech debt reflects any missing automation.

Validation:

- Names match migrations exactly.

---

## 8) Step E - Update quality score snapshot

File to edit:

- `docs/QUALITY_SCORE.md`

Do:

1) Update the "Last updated" date.
2) Adjust scores only if justified.
3) Ensure "Priority gaps" align with `docs/exec-plans/tech-debt-tracker.md`.
4) If you defer audit events, mention it as a priority gap (or ensure it is covered by an item in tech debt).

Validation:

- Quality score does not contradict tech debt or completed notes.

---

## 9) Step F - Final verification (pre-S06 readiness)

### 9.1 Backend tests

From `apps/api/`:

```bash
pytest -q
```

Expected: pass.

### 9.2 Migrations on a fresh DB

Preferred approach: use a fresh compose project name to avoid conflicts, following the pattern documented in `docs/exec-plans/completed/2026-02-s05-food-library.md`.

Minimum required check:

- `alembic upgrade head` succeeds on an empty DB.

### 9.3 Frontend build

From `apps/web/`:

```bash
npm run build
```

Expected: build succeeds locally.

Note: If building inside container fails due to optional Rollup native deps, document it as a known limitation (do not block cleanup).

### 9.4 Manual smoke (very short)

- Login with the seeded dev worker (see `docs/exec-plans/completed/2026-02-s05-food-library.md`).
- Open `/worker/library/food`.
- Confirm you can list and create at least one ingredient.

### 9.5 Git state

```bash
git status --porcelain=v1
```

Expected: only the intended doc edits.

---

## 10) Acceptance criteria (must all be true)

- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md` accurately reflects S00-S05 completion status.
- `docs/exec-plans/completed/index.md` includes S00-S02 completion notes.
- `docs/exec-plans/tech-debt-tracker.md` has no stale/phantom items; real gaps are tracked.
- `docs/generated/db-schema.md` includes Nutrition + Food schema.
- `docs/QUALITY_SCORE.md` is updated and consistent with debt tracking.
- Backend tests pass; migrations are verified on a fresh DB; frontend build is verified locally.

---

## 11) Default decisions (to avoid blocking)

- Default: defer "audit event baseline" as tech debt (do not implement during cleanup).
- Default: treat containerized web build issues as known limitations if local build passes.
