# NutriOrxata

NutriOrxata is a multi-tenant planning platform for nutritionists/trainers (worker app) and clients (client app).

## v1 Runtime

The active v1 codebase lives in:

- `apps/api`
- `apps/web`
- `infra/compose`

Run local development:

```bash
docker compose -p nutriorxata-v1 -f infra/compose/dev.yml up --build
```

Run production-like stack:

```bash
docker compose -p nutriorxata -f infra/compose/prod.yml --env-file infra/compose/.env up --build -d
```

## Documentation Entry Points

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/README.md`
- `docs/PLANS.md`

## Legacy

`v1-beta/` remains as legacy reference only.

## Tooling Directories

Keep `.opencode/`, `.gemini/`, and `skills/` in repository root.
