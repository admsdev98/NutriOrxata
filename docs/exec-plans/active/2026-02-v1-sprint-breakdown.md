# 🗺️ v1 Sprint Breakdown Plan

**Status:** Active
**Context:** `docs/PLANS.md`
**Objective:** Deliver v1 through small-medium, reversible sprint increments.

---

## 1. Context and Analysis

- **Current State:** v1 code exists in `apps/` and `infra/`; documentation and code paths had duplicated structures.
- **Goal:** converge to one canonical docs architecture and one canonical runtime path per layer.
- **References:**
  - `AGENTS.md` invariants and documentation contract
  - `ARCHITECTURE.md` layering and boundaries

## 2. Sprint Queue (Small-Medium Tasks)

### S00 - Docs Harness and Architecture Map

1. [ ] Create canonical docs structure and indexes.
2. [ ] Rewrite AGENTS map-first and add architecture map.
3. [ ] Remove conflicting documentation paths.
4. [ ] Publish Spanish human summary (`docs/HUMAN_OVERVIEW.es.md`).

### S01 - Auth and Access Gate Hardening

1. [ ] Consolidate auth route handlers into modular path.
2. [ ] Standardize access mode evaluation.
3. [ ] Add deterministic error contracts for auth flows.
4. [ ] Add auth unit tests for verification/login/access mode.

### S02 - Tenant Enforcement and Indexing Baseline

1. [ ] Audit endpoint tenant filters.
2. [ ] Add missing tenant-oriented indexes.
3. [ ] Add audit event baseline for critical actions.
4. [ ] Add integration tests for tenant isolation.

### S03 - Worker Workspace Shell

1. [ ] Build worker shell route skeleton and navigation.
2. [ ] Add client list and workspace shell tabs.
3. [ ] Add loading/error/empty baseline for worker flows.
4. [ ] Verify <=3-click common paths.

### S04 - Nutrition Inputs and Targets

1. [ ] Define nutrition profile schema and API contracts.
2. [ ] Implement target calculators and overrides.
3. [ ] Add daily and weekly target outputs.
4. [ ] Add formula-level unit tests.

### S05 - Food Library and Dish Templates

1. [x] Implement ingredients CRUD with macro fields.
2. [x] Implement dish template CRUD.
3. [x] Add tenant scoping and indexing checks.
4. [x] Add API and UI smoke tests.

### S06 - Weekly Planning and Plan Instances

1. [ ] Implement week plan aggregate model.
2. [ ] Implement template-to-instance flow.
3. [ ] Ensure edits on instances do not mutate templates.
4. [ ] Add planning integration tests.

### S07 - Training Flows and Logs

1. [ ] Implement routine templates and assignment.
2. [ ] Implement workout log data model.
3. [ ] Add quick logging UI flow.
4. [ ] Add history retrieval tests.

### S08 - Messaging and Media Constraints

1. [ ] Implement inbox/thread skeleton.
2. [ ] Implement attachment validation by type/size.
3. [ ] Implement audio TTL policy.
4. [ ] Add retention and authorization tests.

### S09 - Progress Tracking and Retention Flows

1. [ ] Implement weight and adherence tracking models.
2. [ ] Implement goal completion calculations.
3. [ ] Implement progress photo retention policy.
4. [ ] Add reminder and export path checks.

### S10 - Reliability and Deployment Hardening

1. [ ] Harden prod compose defaults and secret handling.
2. [ ] Add backup and restore run scripts.
3. [ ] Add smoke script for critical flows.
4. [ ] Document recovery procedures.

### S11 - Continuous Quality and Tech Debt

1. [ ] Add architecture boundary checks in CI.
2. [ ] Add docs consistency checks in CI.
3. [ ] Execute refactor passes for redundancy removal.
4. [ ] Re-score `docs/QUALITY_SCORE.md` and update debt tracker.

## 3. Definition of Done Per Sprint

- Docs updated in canonical paths.
- Security and tenant checks verified for touched flows.
- Migration and index review completed for schema changes.
- Smoke verification executed and recorded.

## 4. Verification Strategy

- Unit tests for pure business rules.
- Integration tests for auth/tenant boundaries.
- Manual QA checklist for key worker and client flows.
