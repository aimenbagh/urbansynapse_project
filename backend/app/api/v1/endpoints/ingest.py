"""Endpoints d'ajout de données : territoires, zones+bâtiments, indicateurs, bilans."""
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.ingest import (
    TerritoryCreateIn, ZoneCreateIn, IndicatorIn, EnergyBalanceIn,
)
from app.gis.generators import zone_polygon, building_polygon, to_text, CITY_CENTERS

router = APIRouter(prefix="/ingest", tags=["ingest"])

CLASSES = ["A", "B", "C", "D", "E", "F", "G"]


@router.post("/territories")
def add_territory(payload: TerritoryCreateIn, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = Territory(
        name=payload.name, wilaya_code=payload.wilaya_code,
        population=payload.population, area_km2=payload.area_km2,
    )
    db.add(t); db.commit(); db.refresh(t)
    # mémoriser le centre pour la carte (si fourni)
    if payload.center_lon is not None and payload.center_lat is not None:
        CITY_CENTERS[payload.name] = (payload.center_lon, payload.center_lat)
    return {"id": t.id, "name": t.name, "message": "Territoire ajouté"}


@router.post("/zones")
def add_zone(payload: ZoneCreateIn, db: Session = Depends(get_db)):
    from app.models.territory import Territory, Zone, Building

    territory = db.get(Territory, payload.territory_id)
    if not territory:
        raise HTTPException(404, "Territoire introuvable")

    # centre : fourni, sinon centre connu de la ville, sinon défaut Alger
    center = (
        (payload.center_lon, payload.center_lat)
        if payload.center_lon is not None and payload.center_lat is not None
        else CITY_CENTERS.get(territory.name, (3.0588, 36.7538))
    )
    # index = nombre de zones existantes (pour ne pas superposer)
    existing = db.query(Zone).filter(Zone.territory_id == territory.id).count()
    zgeom = zone_polygon(center, existing, existing + 1)

    z = Zone(territory_id=territory.id, name=payload.name,
             land_use=payload.land_use, geom=to_text(zgeom))
    db.add(z); db.flush()

    created = 0
    if payload.buildings:
        for i, b in enumerate(payload.buildings):
            bgeom = building_polygon(zgeom, seed=z.id * 100 + i)
            db.add(Building(
                zone_id=z.id, construction_year=b.construction_year,
                floors=b.floors, surface_m2=b.surface_m2,
                energy_class=b.energy_class, annual_kwh_m2=b.annual_kwh_m2,
                geom=to_text(bgeom),
            ))
            created += 1
    else:
        for i in range(payload.buildings_count):
            bgeom = building_polygon(zgeom, seed=z.id * 100 + i)
            db.add(Building(
                zone_id=z.id,
                construction_year=random.randint(1965, 2022),
                floors=random.randint(1, 12),
                surface_m2=round(random.uniform(90, 3500), 1),
                energy_class=random.choice(CLASSES),
                annual_kwh_m2=round(random.uniform(60, 550), 1),
                geom=to_text(bgeom),
            ))
            created += 1

    db.commit(); db.refresh(z)
    return {"zone_id": z.id, "buildings_created": created,
            "message": f"Zone '{z.name}' ajoutée avec {created} bâtiments"}


@router.post("/indicators")
def add_indicator(payload: IndicatorIn, db: Session = Depends(get_db)):
    from app.models.indicator import Indicator
    from app.models.territory import Territory
    if not db.get(Territory, payload.territory_id):
        raise HTTPException(404, "Territoire introuvable")
    # mise à jour si la clé existe déjà, sinon création
    existing = (db.query(Indicator)
                .filter(Indicator.territory_id == payload.territory_id,
                        Indicator.key == payload.key)
                .first())
    if existing:
        existing.value = payload.value
        existing.unit = payload.unit
    else:
        db.add(Indicator(territory_id=payload.territory_id, key=payload.key,
                         value=payload.value, unit=payload.unit))
    db.commit()
    return {"message": f"Indicateur '{payload.key}' enregistré"}


@router.post("/energy-balance")
def import_energy_balance(payload: EnergyBalanceIn, db: Session = Depends(get_db)):
    """Importe un bilan énergétique = lot d'indicateurs pour un territoire."""
    from app.models.indicator import Indicator
    from app.models.territory import Territory
    if not db.get(Territory, payload.territory_id):
        raise HTTPException(404, "Territoire introuvable")

    mapping = {
        "energy_performance": (payload.energy_performance, "%"),
        "resilience": (payload.resilience, "%"),
        "air_quality": (payload.air_quality, "/100"),
        "co2_avoided": (payload.co2_avoided, "t"),
        "renewable_share": (payload.renewable_share, "%"),
    }
    saved = []
    for key, (val, unit) in mapping.items():
        if val is None:
            continue
        existing = (db.query(Indicator)
                    .filter(Indicator.territory_id == payload.territory_id,
                            Indicator.key == key).first())
        if existing:
            existing.value = val; existing.unit = unit
        else:
            db.add(Indicator(territory_id=payload.territory_id, key=key,
                             value=val, unit=unit))
        saved.append(key)
    db.commit()
    return {"message": f"Bilan importé : {len(saved)} indicateurs",
            "indicators": saved}
