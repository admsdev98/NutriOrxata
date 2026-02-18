# OpenCode Orchestration Workflow

This repo supports an orchestration workflow designed for OpenCode CLI usage.

## Goal

- Keep planning, execution, validation, and closeout in sync (same sprint, block, branch, and plan document).
- Prevent scope drift by enforcing a single source of truth: one plan in `docs/exec-plans/active/`.

## Source of Truth

- Execution plans live in `docs/exec-plans/active/` while in-flight.
- A plan is moved to `docs/exec-plans/completed/` only after validation.
- Each plan must include `Branch Continuity` and `File Scope Contract`.

## OpenCode Skills

OpenCode discovers project skills from `.agents/skills/<name>/SKILL.md`.

This workflow uses four orchestration skills:

- `planning-session-orchestrator` (planning only)
- `execution-session-orchestrator` (implementation only)
- `validation-session-orchestrator` (validation only)
- `execution-plan-closer` (docs closeout only)

## Model Discipline (Enforced via Agents)

Skills do not enforce model selection; OpenCode agents do.

This repo provides project agents in `opencode.json`:

- `@orchestration-planner`: uses GPT-5.2 with high reasoning effort; can only load `planning-session-orchestrator`.
- `@orchestration-executor`: uses GPT-5.3 Codex; can only load `execution-session-orchestrator`.
- `@orchestration-validator`: uses GPT-5.2 with high reasoning effort; can only load `validation-session-orchestrator`.
- `@orchestration-closer`: uses GPT-5.2 medium effort; can only load `execution-plan-closer`.

This makes "skill -> agent -> model" deterministic and prevents accidental model drift.

## Using Skills Directly

You can still load a skill manually in any agent. In that case, the skill runs under the currently selected model.

If you want strict model discipline, use the dedicated agents above.
