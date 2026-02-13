from fastapi import FastAPI

from app.core.config import settings
from app.core.web.cors import register_cors
from app.core.web.health import router as health_router
from app.modules.auth.api import router as auth_router


def create_app() -> FastAPI:
    app = FastAPI(title="NutriOrxata API", version="0.1.0")

    register_cors(app, settings.api_cors_origins)

    app.include_router(health_router)
    app.include_router(auth_router)

    return app
