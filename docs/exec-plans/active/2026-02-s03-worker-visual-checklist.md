# S03 Worker Workspace Visual Validation Checklist

Use this checklist before closing Sprint S03 tasks.

## 1) Environment readiness

- [ ] Dev stack is running with `infra/compose/dev.yml`.
- [ ] API health returns `{"status":"ok"}` from `http://localhost:8010/api/health`.
- [ ] Web app is reachable at `http://localhost:5173`.

## 2) Route and navigation checks

- [ ] Opening `http://localhost:5173/worker` redirects to `/worker/clients/:clientId`.
- [ ] Top navigation highlights current section (`Worker` or `Health`).
- [ ] Switching clients keeps route shape `/worker/clients/:clientId`.
- [ ] Invalid client route shows fallback state with recovery action.

## 3) Worker layout checks

- [ ] Worker page shows two clear zones: client list + client workspace panel.
- [ ] Selected client is visually distinct in the list.
- [ ] Client detail panel updates when a different client is selected.
- [ ] No layout breaks on desktop and mobile widths.

## 4) UI state checks (loading, error, empty)

- [ ] Default mode (`demo` unset) loads and displays clients.
- [ ] `?demo=empty` shows clear empty state copy.
- [ ] `?demo=error` shows clear error state and retry action.
- [ ] Retry from error state recovers when returning to default mode.
- [ ] Demo controls are visible only with `debug=1`.

## 5) Access mode checks

- [ ] `?mode=active` shows active access banner.
- [ ] `?mode=read_only` shows read-only banner and disables mutating buttons.
- [ ] `?mode=blocked` shows blocked view and prevents workspace actions.
- [ ] Access mode changes are visible and explicit to the user.

## 6) Tabs and URL state checks

- [ ] Tab click updates URL query `tab=<id>`.
- [ ] Refresh keeps selected tab state from URL.
- [ ] Tab switch does not lose selected client context.
- [ ] Placeholder text remains clear about scope (S03 shell only).

## 7) Product rule checks (S03)

- [ ] Common flow (open worker, select client, open tab) stays within 2-3 clicks.
- [ ] UI remains calm and task-focused (no noisy dashboard patterns).
- [ ] Worker surface avoids heavy scroll for primary actions.

## 8) Suggested URLs for manual QA

- `http://localhost:5173/worker`
- `http://localhost:5173/worker/clients/c-001?tab=nutrition&mode=active`
- `http://localhost:5173/worker/clients/c-002?tab=weekly-plan&mode=read_only`
- `http://localhost:5173/worker/clients/c-003?tab=messaging&mode=blocked`
- `http://localhost:5173/worker/clients/c-001?tab=nutrition&demo=empty&debug=1`
- `http://localhost:5173/worker/clients/c-001?tab=nutrition&demo=error&debug=1`
