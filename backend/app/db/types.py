"""Type géométrie adaptatif : PostGIS si PostgreSQL, sinon texte (SQLite).

Permet de développer en local avec SQLite (sans PostGIS) tout en gardant
le vrai type Geometry quand on passe sur PostgreSQL/PostGIS en production.
"""
from app.core.config import settings

_IS_POSTGRES = settings.DATABASE_URL.startswith("postgresql")


def Geom(geometry_type: str, srid: int = 4326):
    """Retourne un type de colonne géométrique adapté au backend courant."""
    if _IS_POSTGRES:
        from geoalchemy2 import Geometry
        return Geometry(geometry_type, srid=srid)
    # Fallback SQLite : on stocke la géométrie en GeoJSON/WKT texte
    from sqlalchemy import Text
    return Text()
