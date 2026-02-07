# NutriOrxata

El MVP actual esta encapsulado en `v1-beta/`.

- Desarrollo local (docker): `docker compose -f v1-beta/docker-compose.yml up --build`
- Produccion (docker): `docker compose -f v1-beta/docker-compose.prod.yml up --build -d`

Si ejecutas los comandos desde la raiz del repo y quieres evitar dudas con rutas relativas:
- `docker compose -f v1-beta/docker-compose.yml --project-directory v1-beta up --build`
- `docker compose -f v1-beta/docker-compose.prod.yml --project-directory v1-beta up --build -d`

Notas:
- `.opencode/`, `.gemini/` y `skills/` se mantienen en la raiz del repo.
