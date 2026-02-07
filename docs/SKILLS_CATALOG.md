# Skills Catalog

This repo tracks reusable agent skills under `skills/`.

## Available skills

- `skills/backend/SKILL.md`: FastAPI patterns, services, schemas, API design.
- `skills/frontend/SKILL.md`: React patterns, routing, state, UI structure.
- `skills/react-best-practices/SKILL.md`: performance rules and patterns.
- `skills/frontend-design/SKILL.md`: high-quality UI implementation guidance.
- `skills/web-design-guidelines/SKILL.md`: UI/UX and accessibility audit checklist.
- `skills/devops/SKILL.md`: deployment, environments, reliability.
- `skills/docker/SKILL.md`: Docker/Compose workflows.
- `skills/planning-orchestrator/SKILL.md`: RFCs, plans, data models (docs-only).
- `skills/qa-test-planner/SKILL.md`: test plans, regression suites, bug reports.
- `skills/postgresql-table-design/SKILL.md`: table design and Postgres modeling.
- `skills/skill-generator/SKILL.md`: create new skills consistently.

Tooling note:

- Brainstorming helpers can be found under `.opencode/superpowers/commands/`.

Workflow skills (optional):

- Additional workflow-oriented skills live under `.opencode/superpowers/skills/` (TDD, debugging, writing plans).
- They are reference/process docs; use them to guide how you work.

## How to choose

- If you are adding or changing API endpoints: backend + postgresql-table-design.
- If you are building screens/components: frontend + frontend-design + react-best-practices.
- If you are touching Docker/infra: docker + devops.
- If you are planning a multi-sprint feature: planning-orchestrator.
