# Frontend (Objetivo / Objective)

## ES

Por que existe:

- Worker necesita velocidad (muchas acciones diarias).
- Client necesita claridad (que hago hoy) y mobile-first real.

Objetivo:

- SPA (React + TS) con flujos comunes en 2-3 clics.
- Estados siempre visibles: loading/error/empty/read_only/blocked.

Estructura:

```text
apps/web/src/
  app/      # shell y routing
  modules/  # dominios
  shared/   # UI/types/utils compartidos
```

## EN

Why it exists:

- Worker needs speed for daily operations.
- Client needs clarity (today's actions) and true mobile-first flows.

Objective:

- SPA (React + TS) with common flows in 2-3 clicks.
- Explicit states everywhere: loading/error/empty/read_only/blocked.

Layout:

```text
apps/web/src/
  app/      # shell and routing
  modules/  # domains
  shared/   # shared UI/types/utils
```
