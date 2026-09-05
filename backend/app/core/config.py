"""Application configuration loaded from environment variables."""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "UrbanSynapse AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # SQLite par défaut → fonctionne même sans base configurée (utile au 1er déploiement)
    DATABASE_URL: str = "sqlite:///./urbansynapse.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Accepte une liste OU une chaîne séparée par des virgules (pratique sur Railway)
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173"]

    DEFAULT_SRID: int = 4326
    PROJECTED_SRID: int = 30729
    ML_MODEL_DIR: str = "app/ml/models"
    MISTRAL_API_KEY: str = ""

    # === NASA FIRMS (Fire Information for Resource Management System) ===
    # Clé API gratuite (obligatoire pour interroger les données temps réel) :
    # https://firms.modaps.eosdis.nasa.gov/api/area/  -> "Get MAP_KEY"
    FIRMS_MAP_KEY: str = ""
    # Capteur satellite utilisé : VIIRS_SNPP_NRT (résolution 375m, ~temps réel)
    FIRMS_SOURCE: str = "VIIRS_SNPP_NRT"
    # Fenêtre temporelle en jours (1 = dernières 24h, comme la carte FIRMS officielle)
    FIRMS_DAY_RANGE: int = 1
    # Rayon (en degrés) autour du centre du territoire pour la zone interrogée
    FIRMS_BBOX_BUFFER_DEG: float = 0.6
    # Durée de mise en cache des résultats (secondes) pour respecter le quota FIRMS
    FIRMS_CACHE_TTL_SECONDS: int = 600

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, v):
        # Permet BACKEND_CORS_ORIGINS="https://a.com,https://b.com" ou "*"
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return v  # JSON list, pydantic le parsera
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _fix_postgres_url(cls, v):
        # Railway fournit parfois "postgres://" — SQLAlchemy veut "postgresql://"
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v


settings = Settings()
