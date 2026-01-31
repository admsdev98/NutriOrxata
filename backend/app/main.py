from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import ingredientes_router, platos_router, familiares_router, planificacion_router
from app.routers.auth import router as auth_router

settings = get_settings()

app = FastAPI(
    title="NutriOrxata API",
    description="API para gestión de planificación semanal de comidas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ingredientes_router)
app.include_router(platos_router)
app.include_router(familiares_router)
app.include_router(planificacion_router)


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
