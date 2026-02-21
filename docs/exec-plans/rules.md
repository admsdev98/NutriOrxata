# Execution Playbook (Technical)

Audience: subagents and engineers.

This file is the canonical execution guide: how to run a sprint, what "done" means, and what is currently active.

## Subagent workflow

1) Read this file.
2) Check branch + working tree.
3) Identify active sprint scope and acceptance checks.
4) Implement in small, reviewable slices.
5) Produce verification evidence (commands + expected outcomes).

```bash
git status --porcelain=v1
git branch --show-current
git log -10 --oneline --decorate
```

## Global product constraints (apply to every sprint)

- Mobile-first for all user journeys.
- Common actions in 2-3 clicks.
- Calm, task-focused surfaces over dashboard noise.
- Worker surfaces avoid excessive scrolling for primary actions.
- Tenant isolation and server-side authorization are non-negotiable.

## Reliability baseline (do not regress)

- Backups must be encrypted.
- Minimum retention target is 30 days.
- Restore path must remain documented and testable.
- Core API health endpoint must stay available.

## Active sprint: S06 - Weekly planning

Goal:

- Ship weekly planning templates and per-client plan instances with explicit tenant isolation, role boundaries, and deterministic access modes.

Non-negotiable invariants:

- Enforce tenant isolation server-side on every planning read/write path.
- Read-only mode blocks all mutations with `403` + `detail="read_only"`.
- Template edits never mutate previously created instances.

Risk closure:

- Identity contract: `client_ref` normalization and lookup semantics.
- Role boundary: worker/client access must be explicit before client auth expands.

Recommended decomposition:

- Slice A: DB + migration + constraints/index review.
- Slice B: API behavior + authz/tenant checks + error contract.
- Slice C: Web worker/client flows + loading/error/empty.
- Slice D: Verification evidence + docs update.

Minimum verification:

```bash
cd apps/api
pytest -q

npm --prefix apps/web install --no-audit --no-fund
npm --prefix apps/web run build

DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 \
  docker compose -p s06-migcheck -f infra/compose/dev.yml up -d db minio
DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 \
  docker compose -p s06-migcheck -f infra/compose/dev.yml run --rm api alembic upgrade head
DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 \
  docker compose -p s06-migcheck -f infra/compose/dev.yml down -v
```

Go/No-Go:

- No-Go: tenant leak, authz bypass, read-only bypass, migration corruption/failure.

## Tech debt (active)

- TD-003 Testing: tenant isolation coverage is uneven beyond Food; expand as S06-S09 land.
- TD-004 Ops: missing scripted smoke checks for critical flows (target S10).
- TD-006 Security: audit event baseline missing for auth and critical mutation paths (target S10-S11).
- TD-007 Docs/Tooling: schema snapshot generation automation missing (target S11).

Debt rule:

- Every sprint should close or re-scope at least one debt item.

## Skills routing

Skills live under `skills/`.

- Backend/API/data model: `skills/backend/SKILL.md` + `skills/postgresql-table-design/SKILL.md`
- Frontend/UI: `skills/frontend/SKILL.md` + `skills/react-best-practices/SKILL.md`
- UI design quality: `skills/frontend-design/SKILL.md` or `skills/web-design-guidelines/SKILL.md`
- Infra/deployment: `skills/devops/SKILL.md` + `skills/docker/SKILL.md`
- Planning: `skills/planning-orchestrator/SKILL.md`
- QA strategy: `skills/qa-test-planner/SKILL.md`
- Skill authoring: `skills/skill-generator/SKILL.md`

## Definition of done (per sprint)

- Docs updated in canonical paths.
- Security and tenant checks verified for touched flows.
- Migration and index review completed for schema changes.
- Smoke verification executed and recorded (commands + outcomes).
