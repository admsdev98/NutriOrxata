# Instrucciones VPS para agente

Este documento indica los pasos exactos que debe ejecutar un agente en la VPS para desplegar y dejar NutriOrxata accesible. Este archivo es temporal y se eliminara manualmente despues del despliegue.

## Objetivo
Publicar el proyecto en la VPS con acceso por ruta o subdominio, asegurando seguridad basica y evitando exposicion de scripts/archivos temporales. Incluir pruebas rapidas post-despliegue.

## Prerrequisitos
- Docker y Docker Compose instalados.
- Acceso SSH con permisos sudo.
- Dominio ya configurado en la VPS (si aplica) o acceso por IP.
- Puertos 80/443 disponibles para el reverse proxy.

## Estructura y limpieza previa
1) Clonar o actualizar repo en una ruta estable, ejemplo: /opt/nutriorxata
   - git clone <repo> /opt/nutriorxata
   - cd /opt/nutriorxata
2) Confirmar estructura actual:
   - backend/src/app
   - backend/scripts
   - frontend/src
    - database/init.sql
    - docker-compose.prod.yml
3) Eliminar archivos temporales o caches locales si existen:
    - rm -rf backend/src/app/**/__pycache__
    - rm -rf backend/.venv frontend/node_modules frontend/dist

## Fichero de despliegue
- Produccion (VPS): docker-compose.prod.yml
- Desarrollo local: docker-compose.yml

## Variables de entorno obligatorias
Crear un archivo .env en la raiz del repo o configurar variables en el servicio:

- POSTGRES_PASSWORD=<password fuerte>
- DATABASE_URL=postgresql://nutriorxata:<POSTGRES_PASSWORD>@db:5432/nutriorxata
- ENVIRONMENT=production
- SECRET_KEY=<clave fuerte y unica>
- CORS_ORIGINS=https://TU_DOMINIO
- ACCESS_TOKEN_EXPIRE_MINUTES=10080

Credenciales iniciales (NO commitear en Git):
- ADMIN_EMAIL=adam_admin@nutriorxata.com
- ADMIN_PASSWORD=<password del admin>

Opcionales utiles:
- POSTGRES_USER=nutriorxata
- POSTGRES_DB=nutriorxata
- BCRYPT_ROUNDS=12
- UVICORN_WORKERS=2

IMPORTANTE: en produccion el frontend se sirve con nginx dentro del contenedor, y el backend NO se expone publicamente.
- El contenedor frontend escucha en 127.0.0.1:3000 (nginx)
- El contenedor backend escucha en 127.0.0.1:8000
- El reverse proxy (Nginx/Caddy/Traefik) debe publicar 80/443 y reenviar a 127.0.0.1:3000

La API queda bajo /api en el mismo dominio del frontend.
- VITE_API_URL=/api (valor por defecto en docker-compose.prod.yml)

Ejemplo de .env:
POSTGRES_PASSWORD=pon_aqui_un_password_largo_y_unico
ENVIRONMENT=production
SECRET_KEY=pon_aqui_una_clave_larga_y_unica
DATABASE_URL=postgresql://nutriorxata:pon_aqui_un_password_largo_y_unico@db:5432/nutriorxata
CORS_ORIGINS=https://tu-dominio.com
ACCESS_TOKEN_EXPIRE_MINUTES=10080
VITE_API_URL=/api
ADMIN_EMAIL=adam_admin@nutriorxata.com
ADMIN_PASSWORD=pon_aqui_el_password_del_admin

## Seguridad basica recomendada
1) No exponer servicios internos fuera del reverse proxy.
2) Asegurar que SECRET_KEY no sea el valor por defecto.
3) Cambiar credenciales por defecto de base de datos (POSTGRES_PASSWORD) y NO usar las del repositorio.
4) Revisar seeds de base de datos:
   - database/init.sql inserta un usuario admin inicial. Cambiarlo o eliminarlo si no quieres una cuenta seed en produccion.
5) Reducir permisos de scripts y archivos temporales:
    - chmod 700 backend/scripts
    - chmod 600 .env
6) Asegurar que los scripts no sean accesibles por el servidor web:
    - No servir el repo completo como web root.
    - El web root debe apuntar solo al frontend (o al reverse proxy), nunca al repo.

## Despliegue con Docker Compose
1) Construir y levantar servicios:
    - docker compose -f docker-compose.prod.yml up -d --build
2) Ver logs:
    - docker compose -f docker-compose.prod.yml logs -f

## Inicializacion (datos y admin)
IMPORTANTE: database/init.sql solo se ejecuta la primera vez que se crea el volumen de Postgres.

1) Crear/asegurar usuario admin (idempotente):
   - docker compose -f docker-compose.prod.yml exec backend python scripts/ensure_admin_user.py \
     --email "$ADMIN_EMAIL" \
     --password "$ADMIN_PASSWORD" \
     --nombre "Adam Admin"

2) Insertar/actualizar ingredientes (idempotente):
   - docker compose -f docker-compose.prod.yml exec backend python scripts/insert_seed_ingredientes.py --update-existing

Sugerido (si ya estaba desplegado):
- docker compose -f docker-compose.prod.yml down
- git pull
- docker compose -f docker-compose.prod.yml up -d --build

## Reverse proxy y rutas
Recomendado: usar subdominio (mas simple) y mantener el frontend en la raiz (/).

Si se requiere acceso por ruta (ej: /nutriorxata):
- Requiere cambios adicionales en frontend (basename y base de Vite) y en el nginx interno (frontend/nginx.conf).
- En ese caso, tambien ajustar VITE_API_URL para que apunte a /nutriorxata/api.

Si se usa subdominio:
1) Frontend en https://nutriorxata.tu-dominio.com
2) Backend en https://nutriorxata.tu-dominio.com/api (proxy a backend)

## Build frontend para servir estatico (si no usas contenedor frontend)
1) Instalar deps y build:
    - cd frontend
    - npm install
    - npm run build
2) Servir el contenido de frontend/dist desde el reverse proxy.

Nota: con docker-compose.prod.yml NO hace falta este apartado.

## Tests y validacion final
1) Backend health:
    - curl -s https://TU_DOMINIO/api/health
2) Frontend carga:
    - curl -I https://TU_DOMINIO/
3) Login basico (admin):
    - curl -s -X POST https://TU_DOMINIO/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"adam_admin@nutriorxata.com","password":"<ADMIN_PASSWORD>"}'
4) Confirmar que scripts no son accesibles desde web:
    - curl -I https://TU_DOMINIO/backend/scripts
5) Revisar logs:
    - docker compose -f docker-compose.prod.yml logs --tail=200 backend

## Limpieza
Una vez validado el despliegue:
- Eliminar este archivo: VPS_AGENT_INSTRUCTIONS.md
