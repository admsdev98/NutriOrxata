# App Structure (v1)

`v1-beta/` is a temporary UX reference and will be removed.

This is the target layout for the real v1 codebase:

```text
.
├── apps/
│   ├── api/            # FastAPI backend
│   └── web/            # React SPA (Vite + Tailwind + TypeScript)
├── infra/
│   └── compose/        # dev/prod compose files, reverse proxy, backups
├── scripts/            # ops scripts (backup/restore/purge/smoke)
├── docs/               # source of truth
├── skills/             # agent skills used in this repo
├── .opencode/          # agent tooling (must remain accessible)
└── .gemini/            # agent tooling (must remain accessible)
```

## Principles

- The product app is a SPA served as static assets.
- The API is the only application server.
- Production runs on an OVH VPS using Docker Compose.
