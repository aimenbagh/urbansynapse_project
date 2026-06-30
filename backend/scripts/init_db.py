"""Initialise la base et insère des données de démonstration AVEC géométries.

Usage (depuis backend/):  python -m scripts.init_db
Fonctionne avec SQLite (géom en GeoJSON texte) ou PostgreSQL/PostGIS.
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.config import settings
from app.db.session import Base, get_engine, get_sessionmaker
import app.models  # noqa
from app.models.territory import Territory, Zone, Building
from app.models.indicator import Indicator, Scenario
from app.models.user import User
from app.core.security import hash_password
from app.gis.generators import (
    CITY_CENTERS, zone_polygon, building_polygon, to_text,
)
from app.data.wilayas import WILAYAS

random.seed(42)
CLASSES = ["A", "B", "C", "D", "E", "F", "G"]
LAND_USES = ["residentiel", "tertiaire", "industrie", "mixte"]

_IS_PG = settings.DATABASE_URL.startswith("postgresql")


def _geom_value(geojson: dict):
    """En PostGIS : WKT via ST_GeomFromGeoJSON ; en SQLite : texte GeoJSON."""
    return to_text(geojson)  # stocké en texte; le PG mapping accepte aussi le GeoJSON ici


def _ensure_postgis(engine):
    if not _IS_PG:
        return
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            conn.commit()
        print("Extension PostGIS active.")
    except Exception as e:
        print(f"Avertissement PostGIS : {e}")


def _seed(db, territory, zone_names):
    center = CITY_CENTERS.get(territory.name, (3.0, 36.7))
    total = len(zone_names)
    for i, zn in enumerate(zone_names):
        zgeom = zone_polygon(center, i, total)
        z = Zone(territory_id=territory.id, name=zn,
                 land_use=random.choice(LAND_USES), geom=_geom_value(zgeom))
        db.add(z); db.flush()
        for k in range(random.randint(5, 9)):
            bgeom = building_polygon(zgeom, seed=z.id * 100 + k)
            db.add(Building(
                zone_id=z.id,
                construction_year=random.randint(1960, 2022),
                floors=random.randint(1, 15),
                surface_m2=round(random.uniform(80, 4000), 1),
                energy_class=random.choice(CLASSES),
                annual_kwh_m2=round(random.uniform(50, 600), 1),
                geom=_geom_value(bgeom),
            ))


def main():
    engine = get_engine()
    _ensure_postgis(engine)
    print("Creation des tables...")
    Base.metadata.create_all(bind=engine)

    db = get_sessionmaker()()
    try:
        if db.query(Territory).count() > 0:
            print("Donnees deja presentes - seed ignore.")
            return

        print("Insertion des donnees + geometries...")
        alger = Territory(name="Alger", wilaya_code="16", population=2400000, area_km2=363.0, center_lon=3.0588, center_lat=36.7538)
        oran = Territory(name="Oran", wilaya_code="31", population=1500000, area_km2=2114.0, center_lon=-0.6331, center_lat=35.6987)
        constantine = Territory(name="Constantine", wilaya_code="25", population=940000, area_km2=231.0, center_lon=6.6147, center_lat=36.3650)
        db.add_all([alger, oran, constantine]); db.flush()

        _seed(db, alger, ["Centre-ville", "Bab Ezzouar", "Hydra", "El Harrach"])
        _seed(db, oran, ["Sidi El Houari", "Es Senia", "Bir El Djir"])
        _seed(db, constantine, ["Vieille ville", "Ali Mendjeli"])

        kpis = {
            alger.id: {"energy_performance": 78, "resilience": 72, "air_quality": 87, "co2_avoided": 1245},
            oran.id: {"energy_performance": 71, "resilience": 68, "air_quality": 82, "co2_avoided": 890},
            constantine.id: {"energy_performance": 75, "resilience": 70, "air_quality": 79, "co2_avoided": 540},
        }
        for tid, kv in kpis.items():
            for k, v in kv.items():
                unit = "t" if k == "co2_avoided" else ("/100" if k == "air_quality" else "%")
                db.add(Indicator(territory_id=tid, key=k, value=v, unit=unit))

        db.add_all([
            Scenario(territory_id=alger.id, name="Scenario durable",
                     description="Transition energetique et biodiversite",
                     parameters={"energy_performance": 94, "resilience": 80, "air_quality": 88},
                     results={}, performance=94),
            Scenario(territory_id=alger.id, name="Compact urbain",
                     description="Densification et mixite fonctionnelle",
                     parameters={"energy_performance": 87, "density": 90, "mobility": 80},
                     results={}, performance=87),
        ])
        # Ajouter les autres wilayas (métadonnées + centre pour la carte)
        existing_codes = {"16", "31", "25"}  # déjà détaillées
        for w in WILAYAS:
            if w["code"] in existing_codes:
                # enregistrer quand même le centre
                CITY_CENTERS[w["name"]] = (w["lon"], w["lat"])
                continue
            t = Territory(name=w["name"], wilaya_code=w["code"],
                          population=w["population"], area_km2=w["area_km2"],
                          center_lon=w["lon"], center_lat=w["lat"])
            db.add(t)
            CITY_CENTERS[w["name"]] = (w["lon"], w["lat"])
        db.flush()

        db.add(User(email="admin@urbansynapse.ai", full_name="Administrateur",
                    hashed_password=hash_password("admin123"), role="admin"))
        db.commit()
        print("Base initialisee : 3 territoires, zones + batiments AVEC geometries.")
        print("  Utilisateur : admin@urbansynapse.ai / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
