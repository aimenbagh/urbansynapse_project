"""UrbanSynapse AI — FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import app.models  # charge tous les modèles ORM (FK résolues)
from app.api.v1.router import api_router

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

_origins = settings.BACKEND_CORS_ORIGINS
# Si "*" est présent, autoriser toutes les origines (sans credentials, requis par CORS)
_allow_all = "*" in _origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else _origins,
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"status": "ok", "app": settings.APP_NAME, "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
