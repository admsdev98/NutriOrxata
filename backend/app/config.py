from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://nutriorxata:nutriorxata123@db:5432/nutriorxata"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
