# Execution Session Plan - S06X Worker/Client Planning Follow-up

**Status:** Completed
**Context:** `docs/PLANS.md`
**Objective:** Close remaining S06 planning gaps so workers can manage weekly templates and fast assignment patterns, and clients get a minimum read-only weekly plan surface.

---

## 1. Roadmap Position (Mandatory)

- **Sprint:** `S06`
- **Block:** `B06X-01`
- **Task(s):** `worker-template-crud-ui`, `bulk-assignment-actions`, `dish-suggestions-by-meal-type`, `client-read-only-plan-view`
- **Canonical Source Plan:** `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`

## 2. Objective Lock

- **Objective (One Sentence):** Deliver one reversible follow-up block inside S06 that completes practical worker planning actions and introduces minimum client plan consumption.
- **In Scope:**
  - Worker UI CRUD for week plan templates.
  - Worker bulk dish assignment actions (one day, selected days, whole week).
  - Meal-type suggestions using dish tags/grouping.
  - Client read-only weekly plan page with per-slot dish detail view.
  - Documentation and tests for the above behavior.
- **Out of Scope:**
  - Training, messaging, progress, adherence logging.
  - Macro auto-optimization across week plans.
  - Advanced recurring generation rules.
  - Client-side write access to plan data.
- **Success Criteria:**
  - Worker can create, edit, delete week templates directly from weekly planning surface.
  - Worker can apply one dish to one day, selected days, or whole week in <=3 interactions.
  - Worker receives dish suggestions by meal type without breaking tenant isolation.
  - Client can view assigned week and open a slot to inspect assigned dish details.
  - All new backend writes remain blocked in read-only mode.

## 3. Recent Changes Snapshot

- **Planning Branch:** `sprint/05-food-library`
- **Base Branch:** `main`
- **Commits Reviewed:**
  - `848663b feat(api): seed persistent dev worker and close S05`
  - `b6c49ab feat(web): add worker food library route and CRUD UI`
  - `a015532 feat(api): add food library ingredients and dish templates`
- **Files Recently Changed:**
  - `apps/api/app/modules/food/**`
  - `apps/api/app/modules/planning/**` (working tree, not yet committed)
  - `apps/web/src/modules/food/**`
  - `apps/web/src/modules/planning/**` (working tree, not yet committed)
  - `docs/product-specs/weekly-planning.md`
- **Delivered Behavior:**
  - Worker can CRUD ingredients/dish templates.
  - Worker can create week instances from templates and edit instance slots.
  - Snapshot rule enforced: instance edits do not mutate template.
- **Remaining Gaps:**
  - Weekly template CRUD missing in worker planning UI.
  - No bulk assignment action for many days/week.
  - No meal-type suggestion model.
  - No client read-only weekly plan route/surface.

## 4. Current Behavior Summary

- **Current Runtime Flow:**
  - Worker food library CRUD is available in `/worker/library/food`.
  - Worker weekly plan tab supports template selection, create-from-template, and instance update.
  - Client runtime surface is not implemented in current routes.
- **Relevant Modules/Files:**
  - `apps/web/src/modules/food/pages/FoodLibraryPage.tsx`
  - `apps/web/src/modules/planning/components/WeeklyPlanTabPanel.tsx`
  - `apps/api/app/modules/food/api/router.py`
  - `apps/api/app/modules/planning/api/router.py`
  - `apps/api/app/modules/planning/api/schemas.py`
  - `apps/web/src/app/routes.tsx`
- **Existing Tests/Checks:**
  - `apps/api/tests/test_food_endpoints.py`
  - `apps/api/tests/test_planning_endpoints.py`
  - Build checks: `docker exec compose-api-1 python -m unittest ...`, `docker exec compose-web-1 npm run build`
- **Known Limitations or Risks:**
  - Working tree contains unrelated changes; execution must isolate scope strictly.
  - Current client model uses `client_ref` and mock worker clients; no full client domain.

## 5. Proposed Next Block

- **Block ID:** `B06X-01`
- **Goal:** Complete worker assignment ergonomics and add minimum client read-only consumption for assigned plans.
- **Why Now:** These are high-impact planning requirements requested for immediate use and should not wait for later sprints.
- **Dependencies:**
  - Existing S05 food CRUD behavior.
  - Existing S06 planning template/instance backend contracts.
  - Optional DB migration if tags/grouping are persisted.
- **Risks:**
  - Scope creep into client auth domain.
  - UX complexity in weekly planner if bulk actions are not constrained.
  - Regression risk in read-only/access guard paths.
- **Acceptance Criteria:**
  - Worker template CRUD works in weekly planning UI.
  - Bulk assignment actions are available and persisted correctly.
  - Suggestions are filtered by meal type and tenant-scoped.
  - Client read-only page displays assigned week and slot details.
  - No mutation endpoints are exposed to client flow in this block.

## 6. Validation Plan

- **Unit Tests:**
  - Meal-type mapping helper and bulk assignment transformation helpers.
- **Integration/Smoke Checks:**
  - API: planning + food tests include suggestion/filter paths and isolation checks.
  - Web: build succeeds and worker/client routes render.
- **Manual QA Steps:**
  1. Worker creates and edits a week template from planner UI.
  2. Worker applies one dish to entire week and verifies saved instance.
  3. Worker verifies suggestion list relevance per slot type.
  4. Client opens weekly page and inspects assigned dish details.
- **Regression Focus:**
  - Read-only mutation blocking.
  - Tenant isolation for template, instance, and suggestion queries.
  - Snapshot invariants between template and instance.

## 7. Branch Continuity (Mandatory)

- **Execution Branch:** `sprint/05-food-library`
- **Rule:** Execution must run in the same branch used during planning.

## 8. File Scope Contract (Mandatory)

### Include (Allowed to Modify)

- `apps/api/app/modules/food/**` (only if suggestion tags/grouping are added)
- `apps/api/app/modules/planning/**`
- `apps/api/alembic/versions/**` (only for additive migration)
- `apps/api/tests/test_food_endpoints.py`
- `apps/api/tests/test_planning_endpoints.py`
- `apps/web/src/modules/planning/**`
- `apps/web/src/modules/worker/pages/WorkerWorkspacePage.tsx`
- `apps/web/src/app/routes.tsx` (for client read-only route)
- `docs/product-specs/weekly-planning.md`
- `docs/product-specs/client-experience.md`
- `docs/exec-plans/active/**`

### Exclude (Must Not Modify)

- `infra/**` (unless explicitly approved)
- `skills/**` (outside this planning doc update)
- unrelated docs outside planning/client scope
- auth architecture beyond minimum route wiring for read-only client view

## 9. Executor Handoff

- **Execution Mode:** `autonomous` (user-requested for end-to-end execution)
- **Ordered Steps:**
  1. Add weekly template CRUD UI to worker planner.
  2. Add bulk assignment actions in instance editor and persist through existing update endpoint.
  3. Add suggestion grouping by meal type (data model + API + UI).
  4. Add minimum client read-only weekly plan route and API consumption.
  5. Extend tests and run API/web validations.
  6. Update canonical docs with shipped behavior.
- **Block Grouping (Optional):** `none`
- **Stop Conditions (Escalate Back to Planning):**
  - Scope drift into full client auth/domain model.
  - Required file outside include list.
  - Need for non-additive/destructive migration.

## 10. Progress Checkpoints (Executor Reporting)

- **Checkpoint Rule:** stop after each block in `stepwise` mode and wait for explicit validation.
- **Checkpoint Record:**
  - Sprint/Block/Task: `S06/B06X-01/<task>`
  - Files Changed: `<list>`
  - Validation Run: `<commands>`
  - Result: `done | blocked | pending`
  - Notes: `<key outcomes or blockers>`

### Execution Record

- Sprint/Block/Task: `S06/B06X-01/worker-template-crud-ui`
  - Files Changed:
    - `apps/web/src/modules/planning/components/WeeklyPlanTabPanel.tsx`
    - `apps/web/src/modules/planning/api/weekPlanning.ts`
    - `apps/web/src/modules/planning/types.ts`
  - Validation Run:
    - `docker exec compose-web-1 npm run build`
  - Result: `done`
  - Notes: Worker can now create, update, delete templates directly in planner UI.

- Sprint/Block/Task: `S06/B06X-01/bulk-assignment-actions`
  - Files Changed:
    - `apps/web/src/modules/planning/components/WeeklyPlanTabPanel.tsx`
  - Validation Run:
    - `docker exec compose-web-1 npm run build`
  - Result: `done`
  - Notes: Bulk assignment supports one day, selected days, and full-week application.

- Sprint/Block/Task: `S06/B06X-01/dish-suggestions-by-meal-type`
  - Files Changed:
    - `apps/api/app/modules/planning/api/router.py`
    - `apps/api/app/modules/planning/api/schemas.py`
    - `apps/api/tests/test_planning_endpoints.py`
    - `apps/web/src/modules/planning/components/WeeklyPlanTabPanel.tsx`
    - `apps/web/src/modules/planning/api/weekPlanning.ts`
    - `apps/web/src/modules/planning/types.ts`
  - Validation Run:
    - `docker exec compose-api-1 python -m unittest tests.test_planning_endpoints -v`
    - `docker exec compose-api-1 python -m unittest discover -s tests -p 'test_*.py' -v`
    - `docker exec compose-web-1 npm run build`
  - Result: `done`
  - Notes: Suggestions are tenant-scoped and ranked by slot-derived meal type history/keywords.

- Sprint/Block/Task: `S06/B06X-01/client-read-only-plan-view`
  - Files Changed:
    - `apps/web/src/modules/planning/pages/ClientWeeklyPlanPage.tsx`
    - `apps/web/src/app/routes.tsx`
    - `apps/web/src/modules/worker/pages/WorkerWorkspacePage.tsx`
  - Validation Run:
    - `docker exec compose-web-1 npm run build`
  - Result: `done`
  - Notes: Added `/client/weekly-plan` read-only route with per-slot detail panel.

## 11. Open Questions

- Q1: Client "select dish" remains read-only slot-detail navigation in this block; option-based client choice stays deferred.
- Q2: Meal-type grouping shipped as deterministic slot-key + historical/keyword ranking with no schema change.

## 12. Closeout Notes

### Summary

S06X delivers worker template CRUD directly in the weekly planner, bulk assignment actions, meal-type-based dish suggestions, and a minimum client read-only weekly plan surface.

### Scope (As Shipped)

- Worker: template CRUD in weekly planning UI.
- Worker: bulk dish assignment actions (single day, selected days, full week).
- Worker: dish suggestions filtered/ranked by slot-derived meal type.
- Client: read-only weekly plan page with per-slot dish detail.

### Key Decisions

- No schema change for meal-type suggestions; implemented as deterministic slot key + ranking heuristics.
- Client surface remains read-only; no plan mutation endpoints exposed for client flow.

### Risks and Notes

- Client domain/auth remains minimal; avoid expanding into full client identity/auth until S07+.
- Suggestion ranking is heuristic; keep an eye on relevance and ensure tenant scoping stays enforced.

### Validation Evidence

- Web build: `docker exec compose-web-1 npm run build` (recorded per task).
- API tests: `docker exec compose-api-1 python -m unittest tests.test_planning_endpoints -v` and full discovery (recorded in execution record).

### Rollback Notes

- No destructive migrations recorded in this block.
- Roll back by reverting the commits that introduced the planner UI changes, planning suggestion endpoint, and the `/client/weekly-plan` route.

## 13. Validation Record

- **Verdict:** PASS_WITH_NOTES
- **Notes:** Build + automated tests are recorded; manual QA steps are defined in the plan but not explicitly recorded as executed in the execution record.
