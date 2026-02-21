# Backend (Objetivo / Objective)

## ES

Por que existe:

- Queremos una base solida para v1 que no rompa aislamiento por tenant ni autorizacion al crecer.
- Necesitamos comportamiento determinista (active/read_only/blocked) para que el producto sea confiable.

Objetivo:

- Exponer APIs seguras (tenant + rol) para Worker y Client.
- Mantener limites claros por modulo para evolucionar sprint a sprint.

Puntos de entrada:

- Codigo: `apps/api/`
- Compose: `infra/compose/dev.yml`, `infra/compose/prod.yml`

Invariantes:

- Autorizacion siempre server-side.
- `read_only` bloquea mutaciones con `403` y `detail="read_only"`.
- Cross-tenant siempre falla.

## EN

Why it exists:

- v1 must scale without breaking tenant isolation or authorization.
- Access modes must be deterministic (active/read_only/blocked) to keep trust.

Objective:

- Provide secure (tenant + role) APIs for Worker and Client.
- Keep clear module boundaries for sprint-by-sprint evolution.

Entry points:

- Code: `apps/api/`
- Compose: `infra/compose/dev.yml`, `infra/compose/prod.yml`

Invariants:

- Authorization is enforced server-side.
- `read_only` blocks mutations with `403` and `detail="read_only"`.
- Cross-tenant access must fail consistently.
