# Roadmap (Objetivo / Objective)

## ES

Por que trabajamos por sprints:

- Reducir riesgo: cambios pequenos y reversibles.
- Mantener invariantes: tenancy/authz/read_only no se negocian.
- Acelerar decisiones: cada sprint deja evidencia verificable.

Sprint activo: S06 - planificacion semanal

- Objetivo: plantillas de semana + instancias por cliente, sin fugas entre tenants y con limites de rol claros.
- Por que ahora: desbloquea el flujo central del producto (asignar y ejecutar una semana).

Indicadores de exito (v1):

- Onboarding de un nuevo cliente: < 10 minutos.
- Asignar un plan semanal usando plantillas: < 5 minutos.
- El client identifica que hacer hoy al abrir la app.

Proximos sprints (resumen):

- S07: entrenos (plantillas, asignacion, logs).
- S08: mensajeria + adjuntos (limites, retencion, authz).
- S09: progreso (peso/adherencia/fotos con retencion).
- S10: operaciones (backup/restore, smoke scripts, recovery).
- S11: calidad continua (checks, deuda tecnica).

Sprints completados (resumen):

- S00: baseline de docs y mapa de arquitectura.
- S01: auth + modos de acceso deterministas.
- S02: tenant isolation baseline + indexes (audit events pendiente).
- S03/S04: worker shell + nutrition targets (verificacion registrada).
- S05: food library (ingredientes + dish templates) + UI worker.

No objetivos (por ahora):

- Automatizacion completa de cobros.
- Social feed.
- Integraciones con wearables.
- Historia clinica avanzada (EHR).

## EN

Why we run sprints:

- Reduce risk with small, reversible increments.
- Protect invariants (tenancy/authz/read_only).
- Ship with verifiable evidence each sprint.

Active sprint: S06 - weekly planning

- Objective: weekly templates + per-client instances, with strict tenant isolation and explicit role boundaries.
- Why now: it unlocks the core product loop (assign and execute a week).

Success indicators (v1):

- New client onboarding: < 10 minutes.
- Assign a weekly plan using templates: < 5 minutes.
- Client can identify today's actions immediately on app open.

Next sprints (high level):

- S07: training flows.
- S08: messaging + attachments.
- S09: progress tracking.
- S10: reliability/ops.
- S11: continuous quality.

Completed sprints (high level):

- S00: docs baseline and architecture map.
- S01: auth hardening + deterministic access modes.
- S02: tenant isolation baseline + indexes (audit events pending).
- S03/S04: worker shell + nutrition targets (verification recorded).
- S05: food library (ingredients + dish templates) + worker UI.

Non-goals (for now):

- Full billing automation.
- Social feed behavior.
- Wearable integrations.
- Advanced medical EHR behavior.
