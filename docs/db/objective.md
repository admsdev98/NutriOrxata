# DB (Objetivo / Objective)

## ES

Por que existe:

- Multi-tenant: el aislamiento por tenant es un requisito de confianza.
- Rendimiento: los list/search tenant-filtrados deben ser predecibles.

Objetivo:

- PostgreSQL con migraciones (Alembic) como fuente de verdad.
- Constraints e indexes que refuercen invariantes.

Fuente de verdad:

- `apps/api/alembic/versions/`

## EN

Why it exists:

- Multi-tenant isolation is a trust requirement.
- Tenant-filtered list/search paths must have predictable performance.

Objective:

- PostgreSQL with Alembic migrations as source of truth.
- Constraints and indexes that enforce invariants.

Source of truth:

- `apps/api/alembic/versions/`
