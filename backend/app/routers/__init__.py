from app.routers.ingredientes import router as ingredientes_router
from app.routers.platos import router as platos_router
from app.routers.familiares import router as familiares_router
from app.routers.planificacion import router as planificacion_router

__all__ = [
    "ingredientes_router",
    "platos_router",
    "familiares_router",
    "planificacion_router",
]
