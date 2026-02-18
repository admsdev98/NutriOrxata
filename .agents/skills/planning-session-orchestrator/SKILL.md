---
name: planning-session-orchestrator
description: Planning-only orchestrator that inspects current behavior and recent changes, then writes one atomic next execution block plan.
compatibility: opencode
metadata:
  recommended_agent: orchestration-planner
  recommended_model: openai/gpt-5.2
  recommended_effort: high
---

# Planning Session Orchestrator

This skill runs a planning-only session. It must lock objective context, inspect recent delivered changes, understand current behavior, then propose ONE atomic, reversible execution block as a plan document under `docs/exec-plans/active/`.

## Activation Triggers

- "Plan the next roadmap block"
- "Analyze current state and propose next block"
- "Create roadmap from current progress"
- "Sesion de planning"
- "Crear plan de ejecucion"

## Required Inputs

- Objective statement (required).
- Base branch (default: `main`).
- Scope hint (optional): backend, frontend, database, infra, full-stack.
- Target plan path (recommended): `docs/exec-plans/active/<yyyy-mm>-<sprint>-<slug>.md`.

## Workflow

1. **Plan Source Of Truth (Mandatory)**
   - Use a single plan doc under `docs/exec-plans/active/` as the source of truth for `Sprint`, `Block`, `Branch Continuity`, and `File Scope Contract`.
   - If the plan does not exist yet, create it from `docs/exec-plans/templates/execution-session-template.md`.

2. **Objective Lock (Mandatory)**
   - Restate objective in one sentence.
   - Define in-scope and out-of-scope.
   - Define measurable success criteria.

3. **Recent Changes Intelligence (Mandatory, Read-Only)**
   - Inspect current branch state and divergence from base.
   - Review latest committed changes that matter for the objective.
   - Summarize delivered behavior and remaining gaps.
   - Capture evidence snapshot (branch, commits, changed files).

4. **Current Behavior Understanding (Mandatory)**
   - Read `AGENTS.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, and relevant active exec plans.
   - Inspect affected modules and existing tests to infer runtime behavior.
   - Record unknowns and blockers explicitly.

5. **Design One Next Block**
   - Produce one atomic, reversible execution block.
   - Include dependencies, risks, and acceptance criteria.
   - Include tenant isolation and authz checks when backend is touched.

6. **Executor Handoff Contract (Mandatory)**
   - Set `Branch Continuity` (planning and execution MUST run on the same branch).
   - Define strict file scope: include/exclude lists.
   - Provide ordered implementation steps and required validations.
   - Define stop conditions that force escalation back to planning.

## Rules & Constraints

* ✅ DO write/update the plan doc in `docs/exec-plans/active/`.
* ✅ DO base the plan on evidence (git + code), not assumptions.
* ✅ DO keep output as ONE cohesive, reversible block.
* ✅ DO include `Branch Continuity` and `File Scope Contract`.
* ❌ DON'T implement code changes.
* ❌ DON'T expand scope silently.

## Required Output Sections (in the plan)

- Objective Lock
- Recent Changes Snapshot
- Current Behavior Summary
- Proposed Next Block
- Validation Plan
- Branch Continuity
- File Scope Contract (Include/Exclude)
- Executor Handoff
- Open Questions
