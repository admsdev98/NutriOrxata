# NutriOrxata (temporary name) - Agent Guide

This file is the entry point for any coding agent (OpenAI / Claude / Gemini / local models).
Goal: keep work consistent, fast, and aligned with product constraints.

## 1) What is this project?

NutriOrxata is a platform for early-stage nutritionists and/or personal trainers with low budget.
It replaces per-client spreadsheets with a single app:

- Professional (worker) app: manage clients, build reusable libraries (ingredients, dishes, routines), plan weeks, and communicate.
- Client app: follow the plan, log progress, and communicate.

We do not reinvent the wheel. We package common workflows into a simple, modern, mobile-first product.

## 2) Product principles (non-negotiable)

- Mobile-first ALWAYS (clients are mostly on phone).
- Professionals work mainly on laptop/tablet, but mobile-first still applies.
- 2-3 clicks max to reach the needed action.
- Avoid scroll, especially for professional workflows. Prefer dense, well-structured layouts.
- Avoid UI noise: no dashboards full of irrelevant metrics. Show only what helps decide the next action.
- Light + dark mode.

## 3) Roles

- Worker: nutritionist/trainer who manages clients and creates content.
- Client: end user invited/created by a worker.
- Admin (future): platform owner controls billing, templates, branding, and moderation.

## 4) Repo layout (current)

- `v1-beta/`: current functional MVP (legacy reference / baseline UI patterns).
- `skills/`: skill library used by agents in this repo.
- `docs/`: product + engineering documentation (source of truth).

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

## 8) UX implementation rules

- Prefer single-page flows with panels/tabs over many nested pages.
- Prefer inline editing and contextual drawers over modal chains.
- Empty states must be helpful (what to do next + 1 primary action).
- Always design for offline-ish behavior: loading, retry, stale views.

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
