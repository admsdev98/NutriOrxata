# Visual Language (Anchored to v1-beta)

This project already has an MVP under `v1-beta/`. Treat it as the baseline reference.

## 1) Direction

- Calm, dense, and readable for workers.
- Clear, minimal, and mobile-first for clients.
- Both light and dark modes are first-class.

## 2) Layout patterns

- Worker surfaces prefer split panes on desktop/tablet (list on left, detail on right).
- Prefer tabs/panels inside client detail to avoid long scroll.
- Use sticky headers/toolbars for primary actions.

## 3) Interaction patterns

- Inline edit where possible.
- Drawers for medium edits; modals only for confirmations and atomic edits.
- Empty states always provide the next best action.

## 4) Do / Don't

Do:

- Keep dashboards action-oriented (alerts, tasks, quick actions).
- Keep forms short; show optional fields behind "Add more".

Don't:

- Add charts/widgets "because dashboards have them".
- Build multi-step modal chains for common actions.
