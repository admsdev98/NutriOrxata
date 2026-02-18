---
name: validation-session-orchestrator
description: Validation-only orchestrator that runs the plan's validation steps, checks invariants, and writes a reproducible validation record.
compatibility: opencode
metadata:
  recommended_agent: orchestration-validator
  recommended_model: openai/gpt-5.2
  recommended_effort: high
---

# Validation Session Orchestrator

This skill runs a validation-only session for an execution plan. It verifies the work matches the plan, runs the validations listed in the plan, and writes an evidence-based "Validation Record" back into the SAME plan document.

## Activation Triggers

- "Validate this execution plan"
- "Run verification / QA gate"
- "Sesion de validacion"
- "Validar cambios"

## Required Input

- Plan path under `docs/exec-plans/active/`.
- Validation level: `medium` (default) or `high`.

## Workflow

1. **Plan + Branch Lock (Mandatory)**
   - Read the plan and identify `Sprint`, `Block`, `Branch Continuity`, and `File Scope Contract`.
   - Verify current git branch matches the plan's execution branch; stop if it does not.

2. **Change Surface Snapshot (Mandatory, Read-Only to code)**
   - Capture: `git status`, `git diff`, and commit range since base (as described by the plan).
   - Confirm changes are inside the plan include list and not in the exclude list.
   - If out-of-scope changes exist, mark verdict as FAIL and explain.

3. **Run Validations (Mandatory)**
   - Run the exact validation commands defined in the plan.
   - If the plan is missing concrete commands, propose minimal defaults based on touched areas and write them into the plan's Validation Plan BEFORE executing.

4. **Invariant Checks (Mandatory)**
   - Tenant isolation and server-side authz if backend is touched.
   - DB migration safety if migrations exist (additive, indexes reviewed).
   - Frontend build and critical route render if web is touched.
   - Docs updated when behavior changed.

5. **Write Validation Record (Mandatory)**
   - Write/update `Validation Record` in the plan:
     - What was validated (scope)
     - Commands executed
     - Results (pass/fail)
     - Residual risks / follow-ups
     - Verdict: `PASS | PASS_WITH_NOTES | FAIL`

## Rules & Constraints

* ✅ DO treat `docs/exec-plans/active/<plan>.md` as the single source of truth.
* ✅ DO write reproducible evidence (commands + outputs summarized).
* ✅ DO keep code read-only during validation.
* ✅ DO edit the plan doc to add missing validation commands and to record results.
* ❌ DON'T implement feature fixes in code unless the plan explicitly grants "validation fixes" scope.
* ❌ DON'T change sprint/block/branch during validation.
