# QA / Testing (Objetivo / Objective)

## ES

Por que existe:

- La mayor regresion en v1 suele venir de authz/tenancy/read_only.
- Necesitamos verificacion repetible para mover sprints sin miedo.

Objetivo:

- Tener un baseline de tests y smoke checks por sprint.
- Priorizar invariantes (tenant isolation, read_only, migraciones en DB vacia).

## EN

Why it exists:

- v1 regressions often come from authz/tenancy/read_only.
- We need repeatable verification to move sprints safely.

Objective:

- Maintain a per-sprint baseline of tests and smoke checks.
- Prioritize invariants (tenant isolation, read_only, fresh DB migrations).
