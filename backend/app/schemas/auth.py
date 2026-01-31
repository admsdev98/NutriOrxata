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
    email: str
    rol: str
    familiar_id: Optional[int] = None
    activo: bool

    class Config:
        from_attributes = True


class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "usuario"
    familiar_id: Optional[int] = None


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    familiar_id: Optional[int] = None
    activo: Optional[bool] = None


TokenResponse.model_rebuild()
