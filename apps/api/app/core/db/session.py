from __future__ import annotations

from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.core.config import settings


def get_sqlalchemy_url() -> str:
    # Alembic uses this.
    return settings.database_url


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    return create_engine(settings.database_url, pool_pre_ping=True)


def get_session() -> Session:
    return Session(get_engine())
