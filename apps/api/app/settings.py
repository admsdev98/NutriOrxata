from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_environment: str = "development"
    database_url: str = ""
    api_cors_origins: str = ""
    api_jwt_secret: str = ""

    s3_endpoint_url: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket_main: str = ""

    sendgrid_api_key: str = ""
    sendgrid_from_email: str = ""


settings = Settings()
