---
name: planning-session-orchestrator
description: Planning-only orchestrator that analyzes objectives, latest shipped changes, and current behavior before defining the next execution block.
trigger: implicit
---

# Planning Session Orchestrator

This skill runs a planning-only session. It must lock objective context, inspect recent delivered changes, and understand current behavior before proposing the next block.

## Activation Triggers
- "Plan the next roadmap block"
- "Analyze current state and propose next block"
- "Create roadmap from current progress"
- "Sesion de planning"

## Required Inputs
- Objective statement (required).
- Base branch (default: `main`).
- Scope hint (optional): backend, frontend, database, infra, full-stack.

## Workflow

1. **Objective Lock (Mandatory)**
   - Restate objective in one sentence.
   - Define in-scope and out-of-scope.
   - Define measurable success criteria.

2. **Recent Changes Intelligence (Mandatory, Read-Only)**
   - Inspect branch state and divergence from base.
   - Review latest committed and pushed changes.
   - Summarize delivered behavior and pending gaps.
   - Collect evidence snapshot:
     - current branch
     - commits since base
     - changed file summary
     - related docs or active plan updates
   - Confirm branch continuity requirement for executor:
     - execution must happen in the same branch used for planning
     - branch name must be written in the plan handoff

3. **Current Behavior Understanding (Mandatory)**
   - Read `AGENTS.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, and active execution plans.
   - Inspect affected modules and tests to infer real runtime behavior.
   - Record unknowns and blockers explicitly.

4. **Next Block Design**
   - Produce one atomic, reversible block.
   - Include dependencies, risks, and acceptance criteria.
   - Include tenant isolation and authz checks when backend is touched.

5. **Executor Handoff Contract**
   - Specify expected files or modules.
   - Specify explicit file scope:
     - include list: files or directories executor should touch
     - exclude list: files or directories executor must not touch
   - Provide ordered implementation steps.
   - Define required validations.
   - Define escalation and stop conditions.

## Hard Rules
* ✅ DO complete Objective Lock + Recent Changes Intelligence + Current Behavior Understanding before planning.
* ✅ DO provide evidence-based planning, not assumptions.
* ✅ DO keep output in executable, atomic blocks.
* ✅ DO define branch continuity and file include/exclude scope for executor.
* ❌ DON'T generate implementation code.
* ❌ DON'T skip analysis of latest shipped changes.
* ❌ DON'T produce a block when the objective is ambiguous.

## Required Output Sections
1. Objective Lock
2. Recent Changes Snapshot
3. Current Behavior Summary
4. Proposed Next Block
5. Validation Plan
6. Branch Continuity
7. File Scope Contract (Include/Exclude)
8. Executor Handoff
9. Open Questions
