# Execution Plan (v1)

This document is the operational plan for building v1.

## 1) Ground rules

- Default branch: `main`.
- Work happens in sprint branches: `sprint/NN-short-slug`.
- One sprint branch == one focused PR.
- If behavior changes, update `docs/` in the same sprint.

Definition of Done (minimum):

- DB migration(s) included for any schema change.
- Indexes reviewed for new/changed query patterns.
- Tenant isolation and authorization enforced server-side.
- Security basics applied (rate limits where needed, upload restrictions, no secrets).
- Smoke test of the primary flows.

## 2) Epics (parts of the product)

1) Foundation & governance
2) Auth, verification, trial/subscription gate
3) Multi-tenancy + RBAC + security hardening
4) OVH VPS production baseline (Compose, TLS, backups)
5) Worker dashboard + work planner
6) Clients + client workspace
7) Nutrition (formulas + targets)
8) Food library (ingredients + dish templates)
9) Weekly planning (dish instances)
10) Macro-optimized scaling (competitive advantage)
11) Training (routines + logging)
12) Messaging + media (attachments + audio TTL)
13) Progress tracking (weight, goal %, photos TTL)
14) i18n + public demo (optional)

## 3) Sprint plan (proposed)

Sprint 00: Blueprint + scaffolding

- Specs: data model (tenant-first), permissions matrix, read-only definition.
- Repo layout decisions: `apps/api`, `apps/web`, `infra`, `scripts`.
- Ops strategy: jobs (exports/TTL/reminders), backups (encrypted, 30-day retention).

Sprint 01: Auth + verify + trial gate + export/delete

- Worker cannot access app until email is verified.
- Trial: 30 days from verification.
- Expired trial: worker becomes read-only; clients cannot access.
- Manual unlock for payment (no Stripe in MVP).
- Data export (ZIP) + "Delete my data" (tenant purge) are always available.
- Transactional emails via SendGrid.

Sprint 02: Tenancy enforcement + indexing + audit

- `tenant_id` everywhere.
- Authorization and tenant isolation enforced for every endpoint.
- Indexes for core query patterns.
- Audit events for critical actions (no PII).

Sprint 03: OVH VPS production baseline

- Compose production stack: API, Web, Postgres, MinIO, reverse proxy (TLS).
- Backups encrypted, 30-day retention, restore runbook.
- Hardening baseline (firewall, ssh, logs).

Sprint 04: Clients + client workspace shell

- Clients list optimized for speed (split pane on desktop).
- Client workspace tabs: Overview/Profile/Nutrition/Menu/Training/Progress/Messages.

Sprint 05: Nutrition targets

- Age and sex required.
- 3 formulas: Mifflin, Harris, Katch.
- Targets: daily + weekly.

Sprint 06: Food library

- Ingredients (kcal/protein/carbs/fat per 100g).
- Dish templates.

Sprint 07: Weekly planning

- Meal slots defaults per tenant.
- Week plan per client.
- Dish edits create plan instances (do not mutate templates).

Sprint 08: Macro-optimized scaling (Phase 1)

- Default target by macro percentages; advanced target by grams.
- Lock/unlock ingredients per dish instance.

Sprint 09: Training

- Common activities (gym + cardio) with fast logging and history.

Sprint 10: Messaging + media

- Inbox + per-client thread.
- Attachments (photos <= 5MB, PDF <= 2MB) and audio messages with TTL.

Sprint 11: Progress + photos TTL

- Weight chart + goal completion percentage.
- Optional progress photos with 90-day TTL + in-app reminders + ZIP export.

Sprint 12: i18n + demo (optional)

- ES default + EN toggle in profile.
- Public read-only demo.

## 4) Naming conventions

- Worker == tenant owner.
- Client == end user within a tenant.
- Platform admin == future role (not MVP).

## 5) Out of scope (MVP)

- Full billing automation (Stripe).
- Push notifications.
- Wearables integrations.
