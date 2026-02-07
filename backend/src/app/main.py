from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine
from app.routers import ingredientes_router, platos_router, planificacion_router, clientes_platos_router, work_planner_router
from app.routers.auth import router as auth_router
from app.utils.schema import ensure_planificacion_items_schema

settings = get_settings()

app = FastAPI(
    title="NutriOrxata API",
    description="API para gestión de planificación semanal de comidas",
    version="1.0.0",
)

cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
default_dev_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
for origin in default_dev_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)

allow_credentials = True
allow_origin_regex = None
if "*" in cors_origins:
    cors_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ingredientes_router)
app.include_router(platos_router)

app.include_router(planificacion_router)
app.include_router(clientes_platos_router)
app.include_router(work_planner_router)


@app.on_event("startup")
def ensure_optional_schemas() -> None:
    # Avoid runtime errors when new tables are introduced.
    ensure_planificacion_items_schema(engine)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "NutriOrxata"}


@app.get("/")
def root():
    return {
        "message": "NutriOrxata API",
        "docs": "/docs",
        "health": "/api/health",
    }
