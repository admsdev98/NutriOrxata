# Frontend Architecture

## Stack

- React SPA
- TypeScript
- React Router
- Vite
- Tailwind CSS

## Source Layout

```text
apps/web/src/
├── app/                 # app shell and route composition
├── modules/             # domain modules
└── shared/              # cross-domain reusable assets
```

## Constraints

- Keep components small and focused.
- Keep domain behavior in `modules/<domain>`.
- Keep `shared` free from domain-specific business rules.
- Keep route structures predictable and shallow.

## Data and State

- URL is source of truth where it models user intent.
- Encapsulate API calls in module-level adapters.
- Always render loading, error, and empty states.

## Performance Baseline

- Avoid unnecessary re-renders.
- Keep payloads and bundle composition lean.
- Follow rules from `skills/frontend/react-best-practices`.
