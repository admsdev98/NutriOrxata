# Roadmap (Draft)

This roadmap is a working document.

For the sprint-by-sprint plan and branch naming, see `docs/EXECUTION_PLAN.md`.

## Phase 0 - Foundation (now)

- Establish documentation and agent rules (AGENTS + docs).
- Keep `v1-beta/` as reference while planning the next iteration.

Also:

- Build v1 in `apps/` and `infra/` (do not extend `v1-beta/`).

## Phase 1 - Core worker workflows

- Client workspace improvements (profile/nutrition/weekly plan/training).
- Weekly planning speed (templates, batch assign).
- Messaging UX improvements.

## Phase 2 - Client tracking + analytics

- Weekly progress charts (weight, adherence, calories/macros).
- Goal completion percentage (e.g. 80kg -> 60kg).
- Check-in flow (weekly questionnaire).

## Phase 3 - Theming + engagement

- Basic theming for client app (fonts, colors).
- News / challenges board (opt-in, simple).

## Phase 4 - Pro / AI

- AI-assisted content generation with guardrails.
- Automation workflows via n8n.

## Suggestions (impact/effort ideas)

- Push notifications (meal reminder, workout reminder).
- Export/share: PDF weekly plan.
- Integrations: Google Calendar for appointments (worker), wearable imports (later).
- Offline-friendly caching for client app.

Secondary:

- Marketing site/blog can live separately from the app (SEO does not block MVP).
