from app.routers.ingredientes import router as ingredientes_router
from app.routers.platos import router as platos_router
from app.routers.planificacion import router as planificacion_router
from app.routers.clientes_platos import router as clientes_platos_router
from app.routers.work_planner import router as work_planner_router

__all__ = [
    "ingredientes_router",
    "platos_router",
    "planificacion_router",
    "clientes_platos_router",
    "work_planner_router",
]
