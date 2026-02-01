from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: "UsuarioResponse"


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellidos: Optional[str] = None
    email: str
    rol: str
    activo: bool
    trabajador_id: Optional[int] = None
    edad: Optional[int] = None
    altura: Optional[int] = None
    peso: Optional[float] = None
    nivel_actividad: Optional[str] = None
    sexo: Optional[str] = None
    grasa_corporal: Optional[float] = None
    objetivo: Optional[str] = None
    calorias_mantenimiento: Optional[float] = None
    calorias_objetivo: Optional[float] = None
    distribucion_desayuno: Optional[float] = None
    distribucion_almuerzo: Optional[float] = None
    distribucion_comida: Optional[float] = None
    distribucion_merienda: Optional[float] = None
    distribucion_cena: Optional[float] = None

    class Config:
        from_attributes = True


class UsuarioCreate(BaseModel):
    nombre: str
    apellidos: Optional[str] = None
    email: str
    password: str
    rol: str = "cliente"
    trabajador_id: Optional[int] = None
    edad: Optional[int] = None
    altura: Optional[int] = None
    peso: Optional[float] = None
    distribucion_desayuno: Optional[float] = None
    distribucion_almuerzo: Optional[float] = None
    distribucion_comida: Optional[float] = None
    distribucion_merienda: Optional[float] = None
    distribucion_cena: Optional[float] = None
    grasa_corporal: Optional[float] = None


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    activo: Optional[bool] = None
    rol: Optional[str] = None
    trabajador_id: Optional[int] = None
    edad: Optional[int] = None
    altura: Optional[int] = None
    peso: Optional[float] = None
    nivel_actividad: Optional[str] = None
    sexo: Optional[str] = None
    grasa_corporal: Optional[float] = None
    objetivo: Optional[str] = None
    calorias_mantenimiento: Optional[float] = None
    calorias_objetivo: Optional[float] = None
    distribucion_desayuno: Optional[float] = None
    distribucion_almuerzo: Optional[float] = None
    distribucion_comida: Optional[float] = None
    distribucion_merienda: Optional[float] = None
    distribucion_cena: Optional[float] = None


TokenResponse.model_rebuild()
