from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_environment: str = Field(default="development", validation_alias="API_ENVIRONMENT")
    database_url: str = Field(default="", validation_alias="DATABASE_URL")
    api_cors_origins: str = Field(default="", validation_alias="API_CORS_ORIGINS")
    api_jwt_secret: str = Field(default="", validation_alias="API_JWT_SECRET")

    s3_endpoint_url: str = Field(default="", validation_alias="S3_ENDPOINT_URL")
    s3_access_key_id: str = Field(default="", validation_alias="S3_ACCESS_KEY_ID")
    s3_secret_access_key: str = Field(default="", validation_alias="S3_SECRET_ACCESS_KEY")
    s3_bucket_main: str = Field(default="", validation_alias="S3_BUCKET_MAIN")

    sendgrid_api_key: str = Field(default="", validation_alias="SENDGRID_API_KEY")
    sendgrid_from_email: str = Field(default="", validation_alias="SENDGRID_FROM_EMAIL")

    public_api_base_url: str = Field(default="http://localhost:8010/api", validation_alias="PUBLIC_API_BASE_URL")


settings = Settings()
