---
name: execution-session-orchestrator
description: Execution-only orchestrator that implements an approved plan block by block and escalates any scope or architecture drift.
trigger: explicit
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
   - Verify required sections exist:
     - Objective Lock
     - Recent Changes Snapshot
     - Current Behavior Summary
     - Proposed Next Block
     - Branch Continuity
     - File Scope Contract (Include/Exclude)
   - Refuse execution if these sections are missing.
   - Verify current git branch matches plan branch continuity.
   - Refuse execution if branch does not match.

2. **Bounded Execution**
   - Implement one block at a time.
   - Keep each block cohesive and reversible.
   - Use domain skills when needed (backend, frontend, database, infra, qa).
   - Only touch files in the plan include list.
   - Never modify files in the plan exclude list.
   - If required file is outside scope, stop and escalate to planning session.

3. **Validation Per Block**
   - Run required checks defined in the plan.
   - Record result, residual risks, and follow-up notes.
   - In `stepwise` mode, stop after each block (or approved group) and wait for user validation.
   - Continue only after explicit user confirmation.

4. **Escalation Protocol**
   - Stop and escalate to planning session if:
     - objective changes
     - architecture changes are required
     - unknown dependencies alter scope

5. **Completion Report**
   - Report block status: done, blocked, pending.
   - Report changed files, validations run, and remaining risks.
   - Confirm docs updated when behavior changed.

## Hard Rules
* ✅ DO execute only approved blocks from the plan.
* ✅ DO enforce tenant isolation and server-side authorization when backend is touched.
* ✅ DO keep progress visible and traceable by block.
* ✅ DO stop per block by default unless user explicitly requests autonomous mode.
* ✅ DO enforce same-branch execution and include/exclude file scope.
* ❌ DON'T redefine architecture during execution.
* ❌ DON'T expand scope silently.
* ❌ DON'T continue when a planning-level decision is required.

## Reporting Format
- Block ID
- Changes made
- Validation run
- Status: done | blocked | pending
- Notes for planner
