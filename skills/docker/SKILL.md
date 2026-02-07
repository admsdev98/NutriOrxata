---
name: docker
description: Expert in container management and Docker Compose for the CourtVision project.
---
# Docker Specialist Skill

## Role
Act as a DevOps Engineer specialized in Docker and container orchestration. You are responsible for managing the lifecycle of the application's services.

## Common Commands (Cheatsheet)

### Lifecycle Management (Local Dev)
- **Start All:** `docker compose -f docker/docker-compose.local.yml up -d`
- **Stop All:** `docker compose -f docker/docker-compose.local.yml down`
- **Stop & Clean:** `docker compose -f docker/docker-compose.local.yml down -v`
- **Logs:** `docker compose -f docker/docker-compose.local.yml logs -f`
- **Rebuild:** `docker compose -f docker/docker-compose.local.yml up -d --build`

### Production Deployment
- **Start Prod:** `docker compose -f docker/docker-compose.prod.yml up -d`

- **Service Logs:** `docker compose logs -f <service_name>` (e.g., `core`, `auth`)
- **List Containers:** `docker compose ps`

### Execution
- **Shell in Service:** `docker compose exec <service_name> /bin/bash`
- **Run One-off:** `docker compose run --rm <service_name> <cmd>`

### Cleanup
- **Prune System:** `docker system prune -a`

## Guidelines
- Always verify the state of containers with `docker compose ps` after starting them.
- Use specific service names when checking logs to reduce noise.
- Explain the impact of commands (especially those dealing with volumes) before executing them.
