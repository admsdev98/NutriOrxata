from pydantic import field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://nutriorxata:nutriorxata123@db:5432/nutriorxata"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    environment: str = "development"
    secret_key: str = "nutriorxata-secret-key-change-in-production-2024"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    jwt_issuer: str | None = None
    jwt_audience: str | None = None
    bcrypt_rounds: int = 12

    class Config:
        env_file = ".env"

    @field_validator("jwt_issuer", "jwt_audience", mode="before")
    @classmethod
    def empty_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value


@lru_cache()
def get_settings():
    return Settings()
