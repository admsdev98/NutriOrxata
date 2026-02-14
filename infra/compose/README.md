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

- Postgres on `localhost:${DEV_DB_PORT:-5433}`
- MinIO on `localhost:${DEV_MINIO_PORT:-9100}` (API) and `localhost:${DEV_MINIO_CONSOLE_PORT:-9101}` (console)
- API on `localhost:${DEV_API_PORT:-8010}`
- Web on `localhost:${DEV_WEB_PORT:-5173}`

Avoiding port conflicts:

```bash
# Option A: override ports for a second local stack
DEV_DB_PORT=5434 DEV_API_PORT=8011 DEV_WEB_PORT=5174 DEV_MINIO_PORT=9200 DEV_MINIO_CONSOLE_PORT=9201 \
  docker compose -p nutriorxata-v1-alt -f infra/compose/dev.yml up -d --build

# Option B: stop the existing stack
docker compose -p nutriorxata-v1 -f infra/compose/dev.yml down -v
```

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
