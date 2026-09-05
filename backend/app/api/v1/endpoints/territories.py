from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.territory import (
    TerritoryRead, TerritoryStats, ZoneRead, BuildingRead,
)
from app.schemas.fire import FireSummary

router = APIRouter(prefix="/territories", tags=["territories"])

# Score numérique d'une classe énergétique (A=7 best .. G=1)
_CLASS_SCORE = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}


@router.get("/", response_model=list[TerritoryRead])
def list_territories(db: Session = Depends(get_db)):
    from app.models.territory import Territory
    return db.query(Territory).all()


@router.get("/{territory_id}", response_model=TerritoryRead)
def get_territory(territory_id: int, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    return t


@router.get("/{territory_id}/stats", response_model=TerritoryStats)
def territory_stats(territory_id: int, db: Session = Depends(get_db)):
    from app.models.territory import Territory, Zone, Building
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")

    zones = db.query(Zone).filter(Zone.territory_id == territory_id).all()
    zone_ids = [z.id for z in zones]
    buildings = (
        db.query(Building).filter(Building.zone_id.in_(zone_ids)).all()
        if zone_ids else []
    )

    year = datetime.now().year
    ages = [year - b.construction_year for b in buildings if b.construction_year]
    scores = [_CLASS_SCORE.get(b.energy_class, 0) for b in buildings if b.energy_class]

    density = round(t.population / t.area_km2, 1) if t.population and t.area_km2 else None

    return TerritoryStats(
        territory_id=t.id, name=t.name, population=t.population,
        area_km2=t.area_km2, density=density,
        zones_count=len(zones), buildings_count=len(buildings),
        avg_building_age=round(sum(ages) / len(ages), 1) if ages else None,
        avg_energy_class_score=round(sum(scores) / len(scores), 2) if scores else None,
    )


@router.get("/{territory_id}/fires", response_model=FireSummary)
def territory_fires(
    territory_id: int,
    db: Session = Depends(get_db),
    refresh: bool = Query(False, description="Ignore le cache et interroge FIRMS immédiatement"),
):
    """Risque d'incendie en temps (quasi) réel via NASA FIRMS (VIIRS NRT),
    sur une zone tampon autour du centre du territoire — mêmes détections
    actives que la carte officielle https://firms.modaps.eosdis.nasa.gov/map/
    """
    from app.models.territory import Territory
    from app.services.firms_service import fetch_active_fires

    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    if t.center_lat is None or t.center_lon is None:
        raise HTTPException(422, "Coordonnées du territoire non définies")

    return fetch_active_fires(
        lat=t.center_lat, lon=t.center_lon,
        territory_id=t.id, territory_name=t.name,
        force_refresh=refresh,
    )


@router.get("/{territory_id}/zones", response_model=list[ZoneRead])
def territory_zones(territory_id: int, db: Session = Depends(get_db)):
    from app.models.territory import Zone
    return db.query(Zone).filter(Zone.territory_id == territory_id).all()


@router.get("/{territory_id}/buildings", response_model=list[BuildingRead])
def territory_buildings(territory_id: int, db: Session = Depends(get_db)):
    from app.models.territory import Zone, Building
    zone_ids = [z.id for z in db.query(Zone).filter(Zone.territory_id == territory_id).all()]
    if not zone_ids:
        return []
    return db.query(Building).filter(Building.zone_id.in_(zone_ids)).all()
