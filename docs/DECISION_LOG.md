# Decision Log

This file captures decisions that must remain stable across sprints.

Format:

- YYYY-MM-DD: Decision (reason)

## Product and access

- 2026-02-07: Default branch is `main`.
- 2026-02-07: Work happens in sprint branches `sprint/NN-short-slug`.
- 2026-02-07: Worker must verify email before accessing the app.
- 2026-02-07: Trial starts at worker email verification and lasts 30 days.
- 2026-02-07: Trial expired: worker becomes read-only (view/export/delete only).
- 2026-02-07: Trial expired: clients cannot access (show calm explanation and next step).
- 2026-02-07: Payment automation is out of scope for MVP; use manual unlock.

## Data lifecycle

- 2026-02-07: Data export is always available (including during read-only).
- 2026-02-07: "Delete my data" is always available (tenant purge of active systems).
- 2026-02-07: Backups are encrypted with 30-day retention; backups are not rewritten on purge.

## Messaging media

- 2026-02-07: Attachments (MVP): photos <= 5MB and PDF <= 2MB.
- 2026-02-07: Audio messages (MVP): TTL 7 days.
- 2026-02-07: Audio max duration: worker 120s, client 60s.

## Progress photos

- 2026-02-07: Progress photos are optional and visible to worker+client when enabled.
- 2026-02-07: Progress photos TTL: 90 days.
- 2026-02-07: In-app reminders: 30/15/7/1 days before deletion.
- 2026-02-07: Backup UX: allow download ZIP export before deletion.

## Nutrition

- 2026-02-07: Calorie formulas (3): Mifflin, Harris, Katch.
- 2026-02-07: Age and sex are required in nutrition profile.
- 2026-02-07: Targets are both daily and weekly.

## Planning and meals

- 2026-02-07: Meal slots are configurable per tenant; default set has 5 slots.
- 2026-02-07: Editing dishes inside a weekly plan creates a plan instance (does not mutate template).
- 2026-02-07: Macro-optimized dish scaling is Phase 1 and a competitive advantage.
- 2026-02-07: Macro-optimized targets default to macro percentages; advanced mode supports grams.

## Tech

- 2026-02-07: Frontend v1 is React SPA (Vite + Tailwind + TypeScript).
- 2026-02-07: Backend v1 is FastAPI + PostgreSQL.
- 2026-02-07: IDs exposed in URLs use UUIDs.
- 2026-02-07: Email provider for MVP is SendGrid (portable across hosting).
- 2026-02-07: Object storage uses S3-compatible API (MinIO baseline).

## Infra

- 2026-02-07: Production target is OVH VPS with Docker Compose.
