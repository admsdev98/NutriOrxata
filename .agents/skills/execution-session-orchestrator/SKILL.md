---
name: execution-session-orchestrator
description: Execution-only orchestrator that implements an approved plan block-by-block and escalates any scope or architecture drift.
compatibility: opencode
metadata:
  recommended_agent: orchestration-executor
  recommended_model: openai/gpt-5.3-codex
  recommended_effort: high
---

# Execution Session Orchestrator

This skill runs an implementation-only session. It executes a plan from `docs/exec-plans/active/` and reports progress block by block.

## Activation Triggers

- "Execute approved roadmap block"
- "Implement this active execution plan"
- "Run execution session"
- "Sesion de ejecucion"

## Required Input

- Approved plan path under `docs/exec-plans/active/`.
- Execution mode:
  - `stepwise` (default): stop after each block (or approved block group) for user validation.
  - `autonomous` (explicit only): run all blocks without intermediate stop.

## Workflow

1. **Plan Lock-In**
   - Read the plan and restate all execution blocks.
   - Verify required sections exist (Objective Lock, Recent Changes Snapshot, Current Behavior Summary, Proposed Next Block, Validation Plan, Branch Continuity, File Scope Contract).
   - Refuse execution if these sections are missing.
   - Verify current git branch matches the plan's branch continuity; refuse if it does not.

2. **Bounded Execution**
   - Implement one block at a time.
   - Only touch files in the plan include list.
   - Never modify files in the plan exclude list.
   - If a required file is outside scope, stop and escalate to planning.

3. **Validation Per Block**
   - Run required checks defined in the plan.
   - Record results in the plan's execution record.
   - In `stepwise` mode, stop after each block and wait for explicit user confirmation.

4. **Escalation Protocol**
   - Stop and escalate to planning if objective changes, architecture changes are required, or unknown dependencies alter scope.

5. **Completion Report**
   - Report block status: done | blocked | pending.
   - Report changed files, validations run, and remaining risks.
   - Ensure docs are updated when behavior changed.

## Rules & Constraints

* ✅ DO execute only approved blocks from the plan.
* ✅ DO enforce tenant isolation and server-side authorization when backend is touched.
* ✅ DO keep progress traceable by block.
* ✅ DO enforce same-branch execution and include/exclude file scope.
* ❌ DON'T redefine architecture during execution.
* ❌ DON'T expand scope silently.
* ❌ DON'T continue when a planning-level decision is required.
