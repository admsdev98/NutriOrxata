# Execution Session Plan Template

Use this template for the handoff between `planning-session-orchestrator` and `execution-session-orchestrator`.

**Status:** Draft
**Context:** `docs/PLANS.md`
**Objective:** <one-sentence objective>

---

## 1. Roadmap Position (Mandatory)

- **Sprint:** `SXX`
- **Block:** `BXX` or `BXX-BYY`
- **Task(s):** `<task-id-or-title-list>`
- **Canonical Source Plan:** `docs/exec-plans/active/<active-plan>.md`

## 2. Objective Lock

- **Objective (One Sentence):**
- **In Scope:**
- **Out of Scope:**
- **Success Criteria:**

## 3. Recent Changes Snapshot

- **Planning Branch:** `<branch-name>`
- **Base Branch:** `main`
- **Commits Reviewed:**
- **Files Recently Changed:**
- **Delivered Behavior:**
- **Remaining Gaps:**

## 4. Current Behavior Summary

- **Current Runtime Flow:**
- **Relevant Modules/Files:**
- **Existing Tests/Checks:**
- **Known Limitations or Risks:**

## 5. Proposed Next Block

- **Block ID:** `BXX`
- **Goal:**
- **Why Now:**
- **Dependencies:**
- **Risks:**
- **Acceptance Criteria:**

## 6. Validation Plan

- **Unit Tests:**
- **Integration/Smoke Checks:**
- **Manual QA Steps:**
- **Regression Focus:**

## 7. Branch Continuity (Mandatory)

- **Execution Branch:** `<must match planning branch>`
- **Rule:** Execution must run in the same branch used during planning.

## 8. File Scope Contract (Mandatory)

### Include (Allowed to Modify)

- `apps/api/...`
- `apps/web/...`
- `docs/...`

### Exclude (Must Not Modify)

- `infra/...` (unless explicitly approved)
- `<unrelated modules>`
- `<sensitive paths>`

## 9. Executor Handoff

- **Execution Mode:** `stepwise` (default) or `autonomous` (explicit only)
- **Ordered Steps:**
  1. ...
  2. ...
- **Block Grouping (Optional):** `<none | list approved grouped blocks>`
- **Stop Conditions (Escalate Back to Planning):**
  - Scope drift
  - Architecture changes required
  - Required file outside include list

## 10. Progress Checkpoints (Executor Reporting)

- **Checkpoint Rule:** stop after each block in `stepwise` mode and wait for explicit validation.
- **Checkpoint Record:**
  - Sprint/Block/Task:
  - Files Changed:
  - Validation Run:
  - Result: `done | blocked | pending`
  - Notes:

## 11. Open Questions

- Q1:
- Q2:

---

## 12. Validation Record (Validator Output)

- **Validation Level:** `medium | high`
- **Validated By:** `<agent/name>`
- **Date:** `<yyyy-mm-dd>`
- **Scope:** `<what blocks/changes were validated>`
- **Commands Executed:**
  - `<command 1>`
  - `<command 2>`
- **Results:**
  - `<pass/fail summary>`
- **Invariant Checks:**
  - Tenant isolation/authz: `<pass/fail/notes>`
  - Migrations/indexes: `<pass/fail/notes>`
  - Docs updated: `<pass/fail/notes>`
- **Verdict:** `PASS | PASS_WITH_NOTES | FAIL`
- **Residual Risks / Follow-ups:**
  - `<risk or note>`

## 13. Closeout Checklist (Closer Output)

- **Ready To Close:** `yes | no`
- **Closeout Blockers (if any):**
  - `<blocker>`
- **Moved Plan Path:** `docs/exec-plans/completed/<same-filename>.md`
- **Indexes Updated:**
  - `docs/exec-plans/active/index.md`: `<yes/no>`
  - `docs/exec-plans/completed/index.md`: `<yes/no>`
