# DB Rules

## Multi-tenant pattern

- Domain tables include `tenant_id` by default.
- Tenant filtering is explicit in queries.

## Migrations (Alembic)

- One logical change per migration.
- Use explicit names for indexes and constraints.
- Validate upgrades on a fresh DB.

```bash
DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 \
  docker compose -p db-migcheck -f infra/compose/dev.yml up -d db minio
DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 \
  docker compose -p db-migcheck -f infra/compose/dev.yml run --rm api alembic upgrade head
DEV_DB_PORT=15434 DEV_MINIO_PORT=19110 DEV_MINIO_CONSOLE_PORT=19111 DEV_API_PORT=18020 DEV_WEB_PORT=15183 \
  docker compose -p db-migcheck -f infra/compose/dev.yml down -v
```

## Indexing

- Index `tenant_id` for tenant lists.
- Add composite indexes for tenant + search patterns (e.g. `tenant_id, name`).
