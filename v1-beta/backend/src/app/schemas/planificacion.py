from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, date


class PlanificacionBase(BaseModel):
    semana_inicio: date
    dia: str
    momento: str
    plato_id: Optional[int] = None
    cliente_plato_id: Optional[int] = None
    client_id: int
    notas: Optional[str] = None


class PlanificacionCreate(PlanificacionBase):
    pass


class PlanificacionUpdate(BaseModel):
    plato_id: Optional[int] = None
    cliente_plato_id: Optional[int] = None
    notas: Optional[str] = None


class PlanificacionResponse(PlanificacionBase):
    id: int
    plato_nombre: Optional[str] = None
    cliente_plato_id: Optional[int] = None
    client_nombre: str
    calorias: Optional[float] = None
    ingredientes: Optional[List[dict]] = None
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
    client_id: int
    client_nombre: str
    dias: List[ResumenDiario]


class PlanificacionBulkRequest(BaseModel):
    semana_inicio: date
    client_id: int
    momento: str
    dias: List[str]
    base_plato_ids: Optional[List[int]] = None
    cliente_plato_ids: Optional[List[int]] = None
    mode: Literal["replace", "add", "skip_if_filled"] = "replace"


class PlanificacionBulkResponse(BaseModel):
    applied: int
    skipped: int
