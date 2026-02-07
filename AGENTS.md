# NutriOrxata (temporary name) - Agent Guide

This file is the entry point for any coding agent (OpenAI / Claude / Gemini / local models).
Goal: keep work consistent, fast, and aligned with product constraints.

## 0) Quick start (before you do anything)

1) Read `docs/README.md` (documentation index).
2) Treat `v1-beta/` as the UX/UI baseline reference for v1 (temporary; will be removed once v1 reaches parity).
3) Check the current branch and working tree (this repo uses `main` as default branch).
4) If a change affects behavior, update the relevant `docs/*.md` in the same change.

Also:

- Keep `skills/`, `.opencode/`, and `.gemini/` available in the repo (they are part of the agent/tooling setup).

## 1) What is this project?

NutriOrxata is a client-management and planning platform for early-stage nutritionists and/or personal trainers with low budget.
It replaces per-client spreadsheets with a single app:

- Professional (worker) app: manage clients, build reusable libraries (ingredients, dishes, routines), plan weeks, and communicate.
- Client app: follow the plan, log progress, and communicate.

We do not reinvent the wheel. We package common workflows into a simple, modern, mobile-first product.

## 2) Product principles (non-negotiable)

- Mobile-first ALWAYS (clients are mostly on phone).
- Professionals work mainly on laptop/tablet, but mobile-first still applies.
- 2-3 clicks max to reach a common action.
- Avoid scroll, especially for professional workflows. Prefer dense, well-structured layouts.
- Avoid UI noise: no dashboards full of irrelevant metrics. Show only what helps decide the next action.
- Light + dark mode.

## 3) Roles and boundaries

- Worker: nutritionist/trainer who manages clients and creates reusable content.
- Client: end user invited/created by a worker.
- Admin (future): platform owner controls billing, templates, branding, moderation.

Core boundary rule:

- Every worker is a "tenant". Client data and libraries must be scoped to the worker (unless we explicitly introduce shared/global catalogs).

## 4) Repo layout (current)

- `v1-beta/`: current functional MVP (legacy reference / baseline UI patterns).
- `skills/`: skill library used by agents in this repo.
- `docs/`: product + engineering documentation (source of truth).

Target v1 structure (to be implemented; `v1-beta/` will be deleted later):

- `apps/api/`: FastAPI backend.
- `apps/web/`: React SPA (Vite + Tailwind + TypeScript).
- `infra/`: VPS/OVH deployment assets (Compose, reverse proxy, backups).
- `scripts/`: operational scripts (backup/restore/purge/smoke).

When implementing new work, keep `v1-beta/` as reference for desired visual language and UX constraints.

## 5) Tech stack (target)

- Backend: Python + FastAPI
- Frontend: React
- Database: PostgreSQL
- Infra: Docker / Docker Compose
- Automation: n8n (FAQ bot, basic automations)
- AI: used selectively for pro features (content generation, assistant workflows)

## 6) Local development (v1-beta)

- Dev: `docker compose -f v1-beta/docker-compose.yml up --build`
- Prod-like: `docker compose -f v1-beta/docker-compose.prod.yml up --build -d`

If running from repo root and you want to avoid relative path confusion:

- `docker compose -f v1-beta/docker-compose.yml --project-directory v1-beta up --build`
- `docker compose -f v1-beta/docker-compose.prod.yml --project-directory v1-beta up --build -d`

## 7) Engineering rules

- Do not commit secrets: `.env`, credentials, API keys.
- Prefer small, incremental PRs/commits with clear intent.
- Keep naming consistent across backend and frontend (same entity names).
- Prefer explicit schemas and validation over implicit magic.
- Keep performance in mind on mobile (payloads, list rendering, charts).
- Indexes and security are first-class: tenant isolation, authz checks, and query indexing are part of the Definition of Done.

Data safety (treat as sensitive by default):

- Minimize collection: store only what we need to deliver the workflow.
- Prefer explicit retention choices for attachments/audio.
- Never auto-message clients without worker opt-in.

## 8) UX implementation rules

- Prefer single-page flows with panels/tabs over many nested pages.
- Prefer inline editing and contextual drawers over modal chains.
- Empty states must be helpful (what to do next + 1 primary action).
- Always design for offline-ish behavior: loading, retry, stale views.
- Workers: dense UI is OK, but must stay calm and readable.

## 9) Skills available in this repo

See `docs/SKILLS_CATALOG.md`.

Quick guidance:

- Backend design / FastAPI: use `skills/backend`.
- Frontend (React): use `skills/frontend` and `skills/react-best-practices`.
- UI audits: use `skills/web-design-guidelines`.
- Production-ready UI building: use `skills/frontend-design`.
- DevOps / Docker: use `skills/devops` and `skills/docker`.
- Planning / RFCs / data models: use `skills/planning-orchestrator`.
- QA planning: use `skills/qa-test-planner`.

## 10) Documentation discipline

- If you change behavior, update `docs/` in the same change.
- If you add a new domain concept, update `docs/PRODUCT_SPEC.md` and `docs/TECHNICAL_BASELINE.md`.
- Prefer adding new docs over bloating a single file when a topic becomes "its own surface" (e.g. security/privacy, formulas).

## 11) Sprint workflow (mandatory)

- Work happens in sprint branches: `sprint/NN-short-slug` (branched from `main`).
- Every sprint must include:
  - updated/added specs in `docs/`
  - DB migrations and index review for any DB changes
  - server-side authorization and tenant isolation checks
  - a focused PR back to `main`
