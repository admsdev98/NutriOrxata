from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class GeneroFamiliar(str, Enum):
    M = "M"
    F = "F"


class ActividadFisica(str, Enum):
    sedentario = "sedentario"
    ligero = "ligero"
    moderado = "moderado"
    activo = "activo"
    muy_activo = "muy_activo"


class FamiliarBase(BaseModel):
    nombre: str
    edad: Optional[int] = None
    peso: Optional[float] = None
    altura: Optional[int] = None
    genero: Optional[GeneroFamiliar] = None
    actividad_fisica: Optional[ActividadFisica] = ActividadFisica.moderado
    objetivo_calorias: int = 2000
    notas: Optional[str] = None
    activo: bool = True


class FamiliarCreate(FamiliarBase):
    pass


class FamiliarUpdate(BaseModel):
    nombre: Optional[str] = None
    edad: Optional[int] = None
    peso: Optional[float] = None
    altura: Optional[int] = None
    genero: Optional[GeneroFamiliar] = None
    actividad_fisica: Optional[ActividadFisica] = None
    objetivo_calorias: Optional[int] = None
    notas: Optional[str] = None
    activo: Optional[bool] = None


class FamiliarResponse(FamiliarBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
