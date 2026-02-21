# Frontend Rules

## Product interaction constraints

- Mobile-first for all user journeys.
- Common actions in 2-3 clicks.
- Calm, task-focused surfaces over dashboard noise.
- Worker surfaces may be dense, but avoid excessive scrolling.
- Support light and dark mode on key views.

## Layering

- `app` composes routes and layout.
- `modules/<domain>` owns domain UI + data adapters.
- `shared` never depends on `modules` or `app`.

## State and Data

- URL is source of truth when it represents user intent.
- Encapsulate API calls in module-level adapters.
- Always render loading/error/empty states.

## UX Invariants

- Every empty state includes a clear next action.
- Make state transitions explicit (active, read-only, blocked).
- Prefer inline edits over modal chains.
- Keep critical routes shallow and predictable (avoid deep nesting).

Worker UX direction:

- Prefer split panes, tabs, and sticky contextual actions.
- Keep routes predictable and shallow.

Client UX direction:

- Keep the daily experience simple and action-first.
- Hide worker-only complexity.

- UI disables mutating actions in read-only, but backend is the source of truth.
- Blocked/read-only messaging is calm and actionable.

## Performance

- Avoid unnecessary re-renders.
- Keep bundles lean.
- Follow `skills/react-best-practices`.

```bash
npm --prefix apps/web install --no-audit --no-fund
npm --prefix apps/web run build
```

## Governance

- If a change alters core interaction patterns, update `docs/frontend/objective.md`.
- If a change affects sprint acceptance criteria or verification, update `docs/exec-plans/rules.md`.
