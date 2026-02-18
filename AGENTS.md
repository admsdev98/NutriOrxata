# NutriOrxata Agent Guide

This file is the entry point for coding agents working in this repository.
Treat it as a map, not an encyclopedia.

## 0) 60-Second Startup

1) Read `docs/README.md`.
2) Read `ARCHITECTURE.md`.
3) Read `docs/PLANS.md` and `docs/exec-plans/active/`.
4) Check git branch and working tree.
5) If behavior changes, update canonical docs in the same change.

Keep `skills/` in the repository and prefer canonical docs entry points.

## 1) Product Scope

NutriOrxata is a client planning platform for nutritionists and trainers.

- Worker app: client management, reusable libraries, weekly planning, messaging.
- Client app: follow plan, log activity and progress, communicate.

## 2) Non-Negotiable Product Rules

- Mobile-first always.
- Common actions in 2-3 clicks.
- Avoid heavy scroll on worker surfaces.
- Calm UI over noisy dashboards.
- Light and dark mode support.

## 3) Role and Data Boundaries

- Worker: tenant owner.
- Client: end user under exactly one worker tenant.
- Admin: future scope only.

Core invariant: all domain data is tenant-scoped unless explicitly documented otherwise.

## 4) Repository Layout

- `apps/api/`: FastAPI backend.
- `apps/web/`: React SPA (Vite + Tailwind + TypeScript).
- `infra/`: Compose and deployment assets.
- `docs/`: source of truth.
- `v1-beta/`: legacy MVP reference, not active implementation target.

## 5) Architecture Entry Points

- `ARCHITECTURE.md`: domain and layer boundaries.
- `docs/DESIGN.md`: UX principles and product beliefs.
- `docs/FRONTEND.md`: frontend architecture and constraints.
- `docs/SECURITY.md`: security and data lifecycle controls.
- `docs/RELIABILITY.md`: ops and resilience baseline.

## 6) Tooling and Skill Routing

Use repository skills before implementation.

- Backend/API: `skills/backend/SKILL.md`.
- Database/data model: `skills/database/postgresql-table-design/SKILL.md`.
- Frontend/UI: `skills/frontend/SKILL.md` + `skills/frontend/react-best-practices/SKILL.md`.
- UI design quality: `skills/frontend/frontend-design/SKILL.md` or `skills/frontend/web-design-guidelines/SKILL.md`.
- Infra/deployment: `skills/infra/devops/SKILL.md` + `skills/infra/docker/SKILL.md`.
- Planning and roadmap decomposition: `skills/orchestration/planning-session-orchestrator/SKILL.md`.
- Execution from approved plan: `skills/orchestration/execution-session-orchestrator/SKILL.md`.
- QA strategy: `skills/qa/qa-test-planner/SKILL.md`.
- Skill scaffolding utility: `skills/utils/skill-generator/SKILL.md`.

## 7) Documentation Contract

- Canonical documentation is in English.
- Human summary in Spanish is allowed only in `docs/HUMAN_OVERVIEW.es.md`.
- One topic must have one canonical file.
- Do not keep parallel conflicting docs.
- Update docs and code together in the same change.

## 8) Engineering Invariants

- No secrets in git (`.env`, credentials, keys).
- Enforce authorization and tenant isolation server-side.
- Include migration and index review for schema changes.
- Keep modules cohesive and functions focused.
- Eliminate redundant implementations when introducing a canonical path.

## 9) Sprint Workflow

- Branch naming: `sprint/NN-short-slug` from `main`.
- Keep PRs focused and reversible.
- Required DoD:
  - docs updated
  - authz + tenant checks verified
  - migration/index review completed when needed
  - smoke verification run

## 10) Legacy Reference Policy

`v1-beta/` is a visual and workflow reference only.
Do not implement new v1 behavior there.
