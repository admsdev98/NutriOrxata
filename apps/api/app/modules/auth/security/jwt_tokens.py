from __future__ import annotations

import time
from dataclasses import dataclass

import jwt

from app.core.config import settings


@dataclass(frozen=True)
class AccessToken:
    token: str
    exp: int


def create_access_token(*, sub: str, tenant_id: str, role: str, access_mode: str, minutes: int = 60) -> AccessToken:
    now = int(time.time())
    exp = now + (minutes * 60)
    payload = {
        "sub": sub,
        "tenant_id": tenant_id,
        "role": role,
        "access_mode": access_mode,
        "iat": now,
        "exp": exp,
    }
    token = jwt.encode(payload, settings.api_jwt_secret, algorithm="HS256")
    return AccessToken(token=token, exp=exp)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.api_jwt_secret, algorithms=["HS256"])
    except Exception:
        return None
