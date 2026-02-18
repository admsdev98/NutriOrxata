---
name: execution-plan-closer
description: Closes an execution plan by fixing missing doc sections, updating indexes, and moving validated plans from active to completed.
compatibility: opencode
metadata:
  recommended_agent: orchestration-closer
  recommended_model: openai/gpt-5.2
  recommended_effort: medium
---

# Execution Plan Closer

This skill manages the lifecycle of execution plans. It only operates on plan documents and their indexes.

If a plan is truly done (completed + validated), it moves it from `docs/exec-plans/active/` to `docs/exec-plans/completed/` and updates index files.

If a plan is NOT ready, it edits the plan doc to make the gap explicit (missing sections, missing validation record, pending blocks) and escalates back to planning/execution without touching product code.

## Activation Triggers

- "Close this execution plan"
- "Move active plan to completed"
- "Sesion de cierre"
- "Cerrar plan"

## Required Input

- Plan path under `docs/exec-plans/active/`.

## Closeout Preconditions (must all be true)

- Plan `Status:` is `Completed`.
- Plan contains a `Validation Record` with verdict `PASS` or `PASS_WITH_NOTES`.
- No blocks are marked `blocked` or `pending`.
- Plan branch continuity fields are present.

## Workflow

1. **Read + Normalize Plan Doc**
   - Ensure required sections exist; add missing headings from the template (without changing meaning).
   - Ensure `Status:` and key fields are consistent.

2. **Verify Closeout Preconditions**
   - If any precondition fails, write a short "Closeout Blockers" note into the plan and stop.

3. **Move + Index Update**
   - Move plan to `docs/exec-plans/completed/` (keep filename).
   - Update `docs/exec-plans/active/index.md` to remove it.
   - Update `docs/exec-plans/completed/index.md` to add it.
   - If other docs reference the active path, update references.

4. **Post-close Consistency**
   - Ensure the moved plan still reads correctly (links, canonical source plan, references).

## Rules & Constraints

* ✅ DO modify only docs (plan doc + indexes + references).
* ✅ DO keep sprint/block/branch fields consistent; never invent.
* ❌ DON'T modify product code.
* ❌ DON'T close a plan without a validation record.
