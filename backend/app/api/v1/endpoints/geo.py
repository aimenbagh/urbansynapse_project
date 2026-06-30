"""Endpoints géospatiaux : export GeoJSON des couches d'un territoire."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.services.zone_planning import zone_plan

router = APIRouter(prefix="/geo", tags=["geo"])

_IS_PG = settings.DATABASE_URL.startswith("postgresql")


def _geom_to_dict(value) -> dict | None:
    """Convertit la valeur stockée en dict GeoJSON.

    SQLite : la colonne contient déjà du texte GeoJSON.
    PostGIS : on lit via ST_AsGeoJSON dans la requête (voir plus bas),
    donc ici value est aussi du texte JSON.
    """
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None


@router.get("/territories/{territory_id}/geojson")
def territory_geojson(territory_id: int, db: Session = Depends(get_db)):
    """Retourne zones et bâtiments du territoire en FeatureCollection GeoJSON."""
    from app.models.territory import Territory, Zone, Building

    territory = db.get(Territory, territory_id)
    if not territory:
        raise HTTPException(404, "Territoire introuvable")

    zones = db.query(Zone).filter(Zone.territory_id == territory_id).all()
    zone_ids = [z.id for z in zones]
    buildings = (
        db.query(Building).filter(Building.zone_id.in_(zone_ids)).all()
        if zone_ids else []
    )

    _CLASS_SCORE = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}
    features = []
    for z in zones:
        geom = _geom_to_dict(z.geom)
        if geom:
            # score énergétique moyen du bâti de la zone
            zbuildings = [b for b in buildings if b.zone_id == z.id]
            scores = [_CLASS_SCORE.get(b.energy_class, 0) for b in zbuildings if b.energy_class]
            avg_score = sum(scores) / len(scores) if scores else None
            zp = zone_plan(z.land_use, avg_score)
            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "kind": "zone", "id": z.id, "name": z.name,
                    "land_use": z.land_use,
                    "priority": zp["priority"],
                    "actions": zp["actions"],
                    "avg_energy_score": round(avg_score, 2) if avg_score else None,
                },
            })
    for b in buildings:
        geom = _geom_to_dict(b.geom)
        if geom:
            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "kind": "building", "id": b.id,
                    "energy_class": b.energy_class,
                    "construction_year": b.construction_year,
                    "floors": b.floors,
                    "surface_m2": b.surface_m2,
                    "annual_kwh_m2": b.annual_kwh_m2,
                },
            })

    # Centre = moyenne des centroïdes des zones (pour recentrer la carte)
    center = None
    zone_geoms = [_geom_to_dict(z.geom) for z in zones if z.geom]
    pts = []
    for g in zone_geoms:
        if g and g.get("coordinates"):
            ring = g["coordinates"][0]
            xs = [p[0] for p in ring[:-1]]; ys = [p[1] for p in ring[:-1]]
            if xs and ys:
                pts.append((sum(xs)/len(xs), sum(ys)/len(ys)))
    if pts:
        center = [sum(p[0] for p in pts)/len(pts), sum(p[1] for p in pts)/len(pts)]
    elif territory.center_lon is not None and territory.center_lat is not None:
        center = [territory.center_lon, territory.center_lat]

    return {
        "type": "FeatureCollection",
        "territory": {"id": territory.id, "name": territory.name, "center": center},
        "features": features,
    }


@router.get("/territories/{territory_id}/export")
def export_territory_geojson(territory_id: int, db: Session = Depends(get_db),
                             zone_id: int | None = None):
    """Export GeoJSON téléchargeable : tout le territoire ou une zone précise."""
    from fastapi.responses import JSONResponse
    from app.models.territory import Territory, Zone, Building

    territory = db.get(Territory, territory_id)
    if not territory:
        raise HTTPException(404, "Territoire introuvable")

    zones_q = db.query(Zone).filter(Zone.territory_id == territory_id)
    if zone_id is not None:
        zones_q = zones_q.filter(Zone.id == zone_id)
    zones = zones_q.all()
    zone_ids = [z.id for z in zones]
    buildings = db.query(Building).filter(Building.zone_id.in_(zone_ids)).all() if zone_ids else []

    features = []
    for z in zones:
        geom = _geom_to_dict(z.geom)
        if geom:
            features.append({"type": "Feature", "geometry": geom,
                             "properties": {"kind": "zone", "id": z.id,
                                            "name": z.name, "land_use": z.land_use}})
    for b in buildings:
        geom = _geom_to_dict(b.geom)
        if geom:
            features.append({"type": "Feature", "geometry": geom,
                             "properties": {"kind": "building", "id": b.id,
                                            "energy_class": b.energy_class,
                                            "surface_m2": b.surface_m2}})

    fc = {"type": "FeatureCollection",
          "name": territory.name + (f"_zone{zone_id}" if zone_id else ""),
          "features": features}
    fname = f"{territory.name}{'_zone'+str(zone_id) if zone_id else ''}.geojson"
    return JSONResponse(fc, headers={
        "Content-Disposition": f'attachment; filename="{fname}"'})
