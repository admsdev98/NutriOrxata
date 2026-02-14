from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db.session import get_session
from app.modules.auth.domain.models import User
from app.modules.auth.security.jwt_tokens import decode_access_token


def db_session():
    session = get_session()
    try:
        yield session
    finally:
        session.close()


DbSession = Annotated[Session, Depends(db_session)]


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    prefix = "bearer "
    if authorization.lower().startswith(prefix):
        return authorization[len(prefix) :].strip()
    return None


def current_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    token = _bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="missing_token")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="invalid_token")

    user_id_raw = payload.get("sub")
    try:
        user_id = uuid.UUID(str(user_id_raw))
    except Exception:
        raise HTTPException(status_code=401, detail="invalid_token")

    user = session.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="user_not_found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="user_inactive")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require_write_access(
    authorization: Annotated[str | None, Header()] = None,
) -> bool:
    token = _bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="missing_token")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="invalid_token")

    if payload.get("access_mode") == "read_only":
        raise HTTPException(status_code=403, detail="read_only")

    return True


WriteAccess = Annotated[bool, Depends(require_write_access)]
