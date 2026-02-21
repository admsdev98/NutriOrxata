# Architecture Map

This file defines the top-level architecture and dependency boundaries for v1.

## 1) System Topology

- `apps/api`: modular monolith backend (FastAPI + SQLAlchemy + Alembic).
- `apps/web`: SPA frontend (React + TypeScript + Vite + Tailwind).
- `infra/compose`: local and production container orchestration.
- `docs`: repository system of record.

## 2) Domain Model Scope

Primary domains:

- Auth and Access (registration, verification, login, access mode)
- Tenancy and Identity (worker/client scope)
- Client Workspace (profile, nutrition, planning, training, messaging, progress)
- Operations and Reliability (deploy, backup, restore, monitoring)

All domain entities are tenant-scoped unless explicitly documented otherwise.

## 3) Backend Layering

The backend follows strict modular layering per domain:

1. `domain` (entities, enums)
2. `service` (pure business rules)
3. `infrastructure` (external services)
4. `api` (schemas + routers)

Shared foundations live in `app/core`:

- `core/config`
- `core/db`
- `core/dependencies`
- `core/web`

Allowed dependency direction:

- `api -> service -> domain`
- `api -> infrastructure`
- `core` can be used by domain modules.

Disallowed:

- `domain` importing from `api`, `service`, or `infrastructure`.
- Cross-domain imports that bypass module boundaries.

## 4) Frontend Layering

- `src/app`: application shell and route composition.
- `src/modules/<domain>`: domain-specific UI and data adapters.
- `src/shared`: cross-domain reusable UI/types/utilities.

Allowed dependency direction:

- `app -> modules -> shared`
- `modules -> shared`

Disallowed:

- `shared` importing from `modules` or `app`.

## 5) Security and Isolation Invariants

- Authorization is enforced server-side.
- Tenant isolation is validated in every backend access path.
- Security and indexing reviews are required for schema changes.
- Data lifecycle rules (retention/export/deletion) are enforced from backend.

## 6) Delivery and Documentation Rules

- Every behavior change updates canonical docs in the same change.
- One topic has one canonical documentation file.
- Sprint execution playbook and tech debt are tracked in `docs/exec-plans/rules.md`.
