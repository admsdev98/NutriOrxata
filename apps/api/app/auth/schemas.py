from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterWorkerIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class RegisterWorkerOut(BaseModel):
    status: str
    dev_verify_token: str | None = None


class VerifyEmailIn(BaseModel):
    token: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    access_mode: str


class MeOut(BaseModel):
    id: str
    tenant_id: str
    role: str
    email: str
    access_mode: str
