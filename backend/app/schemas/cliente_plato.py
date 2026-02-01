from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ClientePlatoIngredienteBase(BaseModel):
    ingrediente_id: int
    cantidad_gramos: float


class ClientePlatoIngredienteCreate(ClientePlatoIngredienteBase):
    pass


class ClientePlatoIngredienteResponse(BaseModel):
    ingrediente_id: int
    ingrediente_nombre: str
    cantidad_gramos: float
    calorias_aportadas: float
    proteinas_aportadas: float
    carbohidratos_aportados: float
    grasas_aportadas: float

    class Config:
        from_attributes = True


class ClientePlatoBase(BaseModel):
    plato_id: int
    momentos_dia: Optional[List[str]] = None
    ingredientes: Optional[List[ClientePlatoIngredienteCreate]] = None


class ClientePlatoCreate(ClientePlatoBase):
    pass


class ClientePlatoUpdate(BaseModel):
    ingredientes: Optional[List[ClientePlatoIngredienteCreate]] = None
    momentos_dia: Optional[List[str]] = None


class ClientePlatoResponse(BaseModel):
    id: int
    client_id: int
    plato_id: int
    plato_nombre: str
    momentos_dia: List[str]
    calorias_totales: float
    proteinas_totales: float
    carbohidratos_totales: float
    grasas_totales: float
    peso_total_gramos: float
    ingredientes: List[ClientePlatoIngredienteResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
