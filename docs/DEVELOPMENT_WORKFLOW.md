# Development Workflow

This repo is designed for iterative work with humans and coding agents.

## 1) Branching

- Default branch is `main`.
- Prefer sprint branches for non-trivial work: `sprint/NN-short-slug`.
- Keep PRs small and focused.

## 2) Documentation discipline

- Any behavior change must update relevant `docs/*.md` in the same change.
- If you introduce a new concept/term, update `docs/GLOSSARY.md`.
- If you change core entities, update `docs/DOMAIN_MODEL.md`.

Sprint Definition of Done (minimum):

- DB migration(s) + index review.
- Server-side authorization + tenant isolation checks.
- Docs updated.

## 3) Local dev (v1-beta)

- Dev: `docker compose -f v1-beta/docker-compose.yml up --build`
- Prod-like: `docker compose -f v1-beta/docker-compose.prod.yml up --build -d`

## 4) v1 structure (target)

- `apps/api/` (FastAPI)
- `apps/web/` (React SPA)
- `infra/` (Compose + OVH assets)
- `scripts/` (ops scripts)

See `docs/APP_STRUCTURE.md`.

## 5) Working with a dirty git tree

- Do not revert unrelated changes unless explicitly requested.
- Avoid mixing unrelated edits in the same commit/PR.

## 6) Tooling directories

- Do not delete `skills/`, `.opencode/`, or `.gemini/`.
