from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class PlanificacionBase(BaseModel):
    semana_inicio: date
    dia: str
    momento: str
    plato_id: Optional[int] = None
    familiar_id: int
    notas: Optional[str] = None


class PlanificacionCreate(PlanificacionBase):
    pass


class PlanificacionUpdate(BaseModel):
    plato_id: Optional[int] = None
    notas: Optional[str] = None


class PlanificacionResponse(PlanificacionBase):
    id: int
    plato_nombre: Optional[str] = None
    familiar_nombre: str
    calorias: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumenDiario(BaseModel):
    dia: str
    calorias_totales: float
    proteinas_totales: float
    carbohidratos_totales: float
    grasas_totales: float
    comidas: List[dict]


class ResumenSemanal(BaseModel):
    semana_inicio: date
    familiar_id: int
    familiar_nombre: str
    objetivo_calorias: int
    dias: List[ResumenDiario]
