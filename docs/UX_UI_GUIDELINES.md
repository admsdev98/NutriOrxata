# UX / UI Guidelines

These rules exist to avoid the classic "dashboard syndrome" and spreadsheet-like complexity.

## 1) Mobile-first

- Always design for phone first.
- Desktop/tablet for workers must not break mobile constraints.

## 2) Click budget

- Aim for <= 3 clicks to reach any common action.
- Prefer shortcuts and contextual actions.

## 3) Avoid scroll (especially worker)

- Prefer:
  - Tabs/panels
  - Accordions
  - Compact tables with sticky headers
  - Split panes (tablet/desktop)

## 4) Avoid modal chains

- Use modals only for:
  - Confirmations
  - Small, atomic edits
- For bigger edits use:
  - Side drawers
  - Inline forms

## 5) Calm UI

- Avoid too many widgets, charts, and colors.
- Use whitespace and clear hierarchy.

## 6) Empty states

- Every empty state answers:
  - What is this?
  - Why is it empty?
  - What is the next action?

## 7) Light/dark mode

- Both modes are first-class.
- Avoid designs that only work in one mode.

## 8) Accessibility baseline

- Keyboard navigation (worker surfaces).
- Contrast meets WCAG AA where possible.
- Touch targets >= 44px (client).
