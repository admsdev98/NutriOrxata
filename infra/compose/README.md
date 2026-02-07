# Docker Compose

This directory contains Docker Compose files for local development and production (OVH VPS).

## Local development

Run:

```bash
docker compose -p nutriorxata-v1 -f infra/compose/dev.yml up --build
```

Stop:

```bash
docker compose -p nutriorxata-v1 -f infra/compose/dev.yml down -v
```

Services:

- Postgres on `localhost:5433`
- MinIO on `localhost:9100` (API) and `localhost:9101` (console)
- API on `localhost:8010`
- Web on `localhost:5173`

Notes:

- These ports avoid conflicts with the legacy `v1-beta/` containers.

## Production (OVH VPS)

1) Copy `infra/compose/.env.example` to `infra/compose/.env` on the server and fill values.
2) Run:

```bash
docker compose -p nutriorxata -f infra/compose/prod.yml --env-file infra/compose/.env up --build -d
```

Notes:

- Only the reverse proxy is exposed publicly.
- Postgres and MinIO are private.
