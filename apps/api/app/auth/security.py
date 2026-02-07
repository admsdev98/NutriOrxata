from __future__ import annotations

import time
from dataclasses import dataclass
import hashlib

import bcrypt
import jwt

from app.settings import settings


def _normalize_password_bytes(password: str) -> bytes:
    b = password.encode("utf-8")
    # bcrypt truncates at 72 bytes; pre-hash for long passwords.
    if len(b) > 72:
        return hashlib.sha256(b).digest()
    return b


def hash_password(password: str) -> str:
    pw = _normalize_password_bytes(password)
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw, salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    pw = _normalize_password_bytes(password)
    try:
        return bcrypt.checkpw(pw, password_hash.encode("utf-8"))
    except Exception:
        return False


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
