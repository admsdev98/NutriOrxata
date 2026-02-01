from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PlatoIngredienteBase(BaseModel):
    ingrediente_id: int
    cantidad_gramos: float


class PlatoIngredienteCreate(PlatoIngredienteBase):
    pass


class PlatoIngredienteUpdate(BaseModel):
    cantidad_gramos: float


class PlatoIngredienteResponse(BaseModel):
    id: int
    ingrediente_id: int
    ingrediente_nombre: str
    cantidad_gramos: float
    calorias_aportadas: float
    proteinas_aportadas: float
    carbohidratos_aportados: float
    grasas_aportadas: float

    class Config:
        from_attributes = True


class PlatoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    momentos_dia: List[str]


class PlatoCreate(PlatoBase):
    ingredientes: Optional[List[PlatoIngredienteCreate]] = []


class PlatoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    momentos_dia: Optional[List[str]] = None


class PlatoResponse(PlatoBase):
    id: int
    calorias_totales: float
    proteinas_totales: float
    carbohidratos_totales: float
    grasas_totales: float
    peso_total_gramos: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlatoDetailResponse(PlatoResponse):
    ingredientes: List[PlatoIngredienteResponse] = []
