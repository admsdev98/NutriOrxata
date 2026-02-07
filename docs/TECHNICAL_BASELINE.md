# Technical Baseline

This is the engineering direction for v1.

## 1) Stack

- Backend: Python + FastAPI
- DB: PostgreSQL
- Frontend: React (SPA)
- Web tooling: Vite + Tailwind + TypeScript
- Containers: Docker / Compose
- Storage: S3-compatible object storage (MinIO)
- Email: SendGrid (transactional)
- Automation: n8n
- AI (future/pro): model integrations for assistant workflows

## 2) Current state in repo

- The existing MVP is under `v1-beta/`.
- Treat it as UX/UI reference only.

Target v1 structure:

- `apps/api/`
- `apps/web/`
- `infra/`
- `scripts/`

See `docs/APP_STRUCTURE.md`.

## 3) Main data domains (conceptual)

- Account / Auth:
  - Worker accounts
  - Client accounts (created/invited by worker)
  - Roles/permissions

- Client management:
  - Client profile
  - Nutrition profile (anthropometrics, activity, constraints)
  - Custom fields (guardrailed)

- Food:
  - Ingredient (per 100g macros)
  - Dish (composition of ingredients)
  - Dish variants per client (if needed)
  - Weekly plan (per client)

- Training:
  - Routine templates
  - Routine assignments
  - Workout logs (weights, times, etc.)

- Communication:
  - Conversations (worker <-> client)
  - Messages + attachments

- Analytics:
  - Weekly check-ins
  - Progress charts (weight, adherence, calories)

## 4) Integrations

- n8n:
  - FAQ bot
  - Basic automations (support, reminders)

- Object storage:
  - MinIO for local/prod baseline

- Email:
  - SendGrid for verification, reset password, and client invites

## 5) Security / privacy

- Treat all client data as sensitive.
- Avoid storing more than needed.
- Never commit secrets.

Operational constraints:

- Production runs on an OVH VPS via Docker Compose.
- Backups are encrypted with 30-day retention.
