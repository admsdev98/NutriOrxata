from fastapi import FastAPI

from app.bootstrap.dev_seed import ensure_dev_worker_seed
from app.core.config import settings
from app.core.web.cors import register_cors
from app.core.web.health import router as health_router
from app.modules.auth.api import router as auth_router
from app.modules.food.api import router as food_router
from app.modules.nutrition.api import router as nutrition_router
from app.modules.planning.api import router as planning_router


def create_app() -> FastAPI:
    app = FastAPI(title="NutriOrxata API", version="0.1.0")

    register_cors(app, settings.api_cors_origins)

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(food_router)
    app.include_router(nutrition_router)
    app.include_router(planning_router)

    app.add_event_handler("startup", ensure_dev_worker_seed)

    return app
