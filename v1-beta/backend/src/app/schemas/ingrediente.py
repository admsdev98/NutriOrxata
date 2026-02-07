from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IngredienteBase(BaseModel):
    nombre: str
    categoria: str = "Otros"
    supermercado: str = "Mercadona"
    calorias_por_100g: float
    proteinas_por_100g: float = 0
    carbohidratos_por_100g: float = 0
    grasas_por_100g: float = 0
    fibra_por_100g: float = 0
    sal_por_100g: float = 0
    notas: Optional[str] = None


class IngredienteCreate(IngredienteBase):
    pass


class IngredienteUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    supermercado: Optional[str] = None
    calorias_por_100g: Optional[float] = None
    proteinas_por_100g: Optional[float] = None
    carbohidratos_por_100g: Optional[float] = None
    grasas_por_100g: Optional[float] = None
    fibra_por_100g: Optional[float] = None
    sal_por_100g: Optional[float] = None
    notas: Optional[str] = None


class IngredienteResponse(IngredienteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
