"""Application configuration loaded from environment variables."""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "UrbanSynapse AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    DEFAULT_SRID: int = 4326
    PROJECTED_SRID: int = 30729
    ML_MODEL_DIR: str = "app/ml/models"
    MISTRAL_API_KEY: str = ""


settings = Settings()
