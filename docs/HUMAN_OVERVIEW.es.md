# Resumen Humano (No Canónico)

Este archivo es un resumen ejecutivo para humanos.
La documentación canónica del proyecto está en inglés.

## Objetivo

NutriOrxata es una plataforma multi-tenant para que profesionales (worker) gestionen clientes, planes, rutinas y mensajería, y para que clientes sigan su planificación y registren progreso.

## Estructura del Proyecto

- `apps/api`: backend FastAPI.
- `apps/web`: SPA React + TypeScript.
- `infra/compose`: orquestación local y producción.
- `docs`: sistema de registro de decisiones y planes.
- `v1-beta`: referencia legacy, no desarrollo activo.

## Stack y Lenguajes

- Backend: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL.
- Frontend: React, TypeScript, Vite, Tailwind.
- Infra: Docker Compose, Caddy, MinIO.

## Reglas Clave

- Mobile-first.
- Acciones comunes en 2-3 clics.
- Aislamiento por tenant obligatorio.
- Autorización siempre server-side.
- Sin secretos en git.

## Roadmap y Sprints

Plan principal en `docs/PLANS.md` y ejecución detallada en `docs/exec-plans/active/`.
Se trabaja con sprints pequeños/medianos y PRs enfocados.

## Documentación

- Canónica: `docs/*.md` en inglés.
- Resumen humano: este archivo.
