from __future__ import annotations

import hashlib

import bcrypt


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
