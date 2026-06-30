"""SQLAlchemy engine & session factory (PostGIS enabled).

The engine is created lazily so the application can be imported and the
compute-only endpoints (scoring, energy) can run even when no database
driver (psycopg2) is installed yet — useful for a quick local start on
Windows before the geospatial/DB stack is fully set up.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

Base = declarative_base()

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)
    return _engine


def get_sessionmaker():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def get_db():
    db = get_sessionmaker()()
    try:
        yield db
    finally:
        db.close()
