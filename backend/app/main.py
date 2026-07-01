"""UrbanSynapse AI — FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import app.models  # charge tous les modèles ORM (FK résolues)
from app.db.session import Base, get_engine
from app.api.v1.router import api_router

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# Crée les tables au démarrage si elles n'existent pas (évite "no such table")
try:
    Base.metadata.create_all(bind=get_engine())
except Exception as _e:
    print(f"[warn] création des tables au démarrage: {_e}")


def _seed_default_users():
    """Crée les comptes admin/user par défaut s'ils n'existent pas."""
    try:
        from app.db.session import get_sessionmaker
        from app.models.user import User
        from app.core.security import hash_password
        db = get_sessionmaker()()
        try:
            if not db.query(User).filter(User.email == "admin@urbansynapse.ai").first():
                db.add(User(email="admin@urbansynapse.ai", full_name="Administrateur",
                            hashed_password=hash_password("admin123"), role="admin"))
            if not db.query(User).filter(User.email == "user@urbansynapse.ai").first():
                db.add(User(email="user@urbansynapse.ai", full_name="Utilisateur Démo",
                            hashed_password=hash_password("user123"), role="user"))
            db.commit()
        finally:
            db.close()
    except Exception as _e:
        print(f"[warn] seed comptes par défaut: {_e}")


_seed_default_users()

# Normaliser les origines : retirer les slashs finaux et espaces
_origins = [o.strip().rstrip("/") for o in settings.BACKEND_CORS_ORIGINS]
_allow_all = "*" in _origins

# Autoriser aussi tous les sous-domaines Vercel (preview deployments) via regex
_origin_regex = r"https://.*\.vercel\.app" if not _allow_all else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else _origins,
    allow_origin_regex=_origin_regex,
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
