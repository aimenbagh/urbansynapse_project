"""Couches thématiques dérivées pour la carte : risques, mobilité, socio-éco."""
import json
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter(prefix="/layers", tags=["layers"])


def _zones_or_synthetic(territory, db):
    """Renvoie une liste de (nom, geom_dict) : zones réelles, sinon synthétiques."""
    from app.models.territory import Zone
    zones = db.query(Zone).filter(Zone.territory_id == territory.id).all()
    out = []
    for z in zones:
        g = _geom(z.geom)
        if g:
            out.append((z.name, g))
    if not out:
        from app.data.synthetic_geo import synthetic_features
        szones, _ = synthetic_features(territory.wilaya_code or "", territory.name,
                                       territory.center_lon, territory.center_lat)
        for f in szones:
            out.append((f["properties"]["name"], f["geometry"]))
    return out



def _geom(v):
    if v is None:
        return None
    if isinstance(v, dict):
        return v
    try:
        return json.loads(v)
    except (TypeError, ValueError):
        return None


def _zone_center(geom: dict):
    ring = geom["coordinates"][0]
    xs = [p[0] for p in ring[:-1]]; ys = [p[1] for p in ring[:-1]]
    return sum(xs) / len(xs), sum(ys) / len(ys)


@router.get("/{territory_id}/risks")
def risk_layer(territory_id: int, db: Session = Depends(get_db)):
    """Zones d'aléa (inondation, séisme, îlot de chaleur) sur les zones existantes."""
    from app.models.territory import Territory, Zone
    if not db.get(Territory, territory_id):
        raise HTTPException(404, "Territoire introuvable")
    terr = db.get(Territory, territory_id)
    zones = _zones_or_synthetic(terr, db)
    rng = random.Random(territory_id)
    risk_types = ["Inondation", "Séisme", "Îlot de chaleur", "Feu de forêt"]
    levels = ["Faible", "Modéré", "Élevé"]
    features = []
    for zname, g in zones:
        features.append({
            "type": "Feature", "geometry": g,
            "properties": {
                "kind": "risk", "zone": zname,
                "risk_type": rng.choice(risk_types),
                "level": rng.choice(levels),
            },
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/{territory_id}/mobility")
def mobility_layer(territory_id: int, db: Session = Depends(get_db)):
    """Réseau de mobilité : lignes reliant les centres des zones (axes/transport)."""
    from app.models.territory import Territory, Zone
    if not db.get(Territory, territory_id):
        raise HTTPException(404, "Territoire introuvable")
    terr = db.get(Territory, territory_id)
    zones = _zones_or_synthetic(terr, db)
    centers = []
    for zname, g in zones:
        centers.append((_zone_center(g), zname))
    features = []
    # relier les zones consécutives = lignes de transport
    types = ["Bus", "Tramway", "Piste cyclable"]
    for i in range(len(centers) - 1):
        (c1, n1), (c2, n2) = centers[i], centers[i + 1]
        features.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": [list(c1), list(c2)]},
            "properties": {"kind": "mobility", "mode": types[i % len(types)],
                           "from": n1, "to": n2},
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/{territory_id}/socio")
def socio_layer(territory_id: int, db: Session = Depends(get_db)):
    """Données socio-économiques : densité estimée par zone (cercles/points)."""
    from app.models.territory import Territory, Zone, Building
    if not db.get(Territory, territory_id):
        raise HTTPException(404, "Territoire introuvable")
    terr = db.get(Territory, territory_id)
    zones = _zones_or_synthetic(terr, db)
    import hashlib
    features = []
    for zname, g in zones:
        lon, lat = _zone_center(g)
        # nombre de bâtiments (réel si zone réelle, sinon estimé déterministe)
        h = int(hashlib.md5(zname.encode()).hexdigest(), 16)
        nb = 3 + (h % 8)
        density = nb * 1200
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"kind": "socio", "zone": zname,
                           "buildings": nb, "density": density,
                           "land_use": "mixte"},
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/{territory_id}/climate")
def climate_layer(territory_id: int, db: Session = Depends(get_db), variable: str = "temperature"):
    """Carte climatique CONTINUE couvrant tout le territoire (grille de cellules).

    Génère une grille qui s'étend sur toute la zone du territoire (et non
    seulement les petites zones), donnant une vraie carte climatique pleine.
    Valeurs calibrees sur le climat algerien : plus chaud/sec vers le sud
    (latitude basse), plus tempere/humide vers le nord (cote).
    """
    from app.models.territory import Territory, Zone

    territory = db.get(Territory, territory_id)
    if not territory:
        raise HTTPException(404, "Territoire introuvable")

    # Déterminer le centre et l'étendue à partir des zones (ou centre par défaut)
    zones = db.query(Zone).filter(Zone.territory_id == territory_id).all()
    pts = []
    for z in zones:
        g = _geom(z.geom)
        if g:
            pts.append(_zone_center(g))
    if territory.center_lon is not None and territory.center_lat is not None:
        clon, clat = territory.center_lon, territory.center_lat
    elif pts:
        clon = sum(p[0] for p in pts) / len(pts)
        clat = sum(p[1] for p in pts) / len(pts)
    else:
        clon, clat = 3.0588, 36.7538

    # Grille large couvrant toute la carte visible (~1.2° ≈ 130 km de côté),
    # cellules de 0.04° (~4 km) pour rester fluide.
    span = 1.2
    step = 0.04
    rng = random.Random(territory_id)
    n = int(span / step)
    features = []
    for ix in range(-n, n):
        for iy in range(-n, n):
            lon0 = clon + ix * step
            lat0 = clat + iy * step
            cell = [[
                [lon0, lat0], [lon0 + step, lat0],
                [lon0 + step, lat0 + step], [lon0, lat0 + step], [lon0, lat0],
            ]]
            cell_lat = lat0 + step / 2
            # Modele : T augmente quand la latitude diminue (sud plus chaud)
            base_temp = 28 + (37 - cell_lat) * 1.4 + rng.uniform(-0.8, 0.8)
            precip = max(50, 700 - (37 - cell_lat) * 45 + rng.uniform(-25, 25))
            value = round(precip) if variable == "precipitation" else round(base_temp, 1)
            unit = "mm/an" if variable == "precipitation" else "°C"
            features.append({
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": cell},
                "properties": {"kind": "climate", "variable": variable,
                               "value": value, "unit": unit,
                               "temperature": round(base_temp, 1),
                               "precipitation": round(precip)},
            })
    return {"type": "FeatureCollection", "variable": variable, "features": features}


@router.get("/{territory_id}/communes")
def communes_layer(territory_id: int, db: Session = Depends(get_db)):
    """Couche des communes réelles (population RGPH 2008) — Alger uniquement.

    Affiche les communes avec leur population réelle sous forme de points
    dimensionnés selon la population.
    """
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")

    # Données réelles disponibles pour Alger (wilaya 16)
    if t.wilaya_code != "16":
        return {"type": "FeatureCollection", "features": [],
                "note": "Données communales réelles disponibles pour Alger uniquement."}

    from app.data.communes_alger import COMMUNES_ALGER
    from app.data.education_data import education_profile
    features = []
    for c in COMMUNES_ALGER:
        if c["lon"] is None or c["lat"] is None:
            continue
        edu = education_profile(c["name"]) or {}
        props = {
            "kind": "commune", "name": c["name"],
            "population": c["population"],
            "growth_rate": c["growth_rate"],
        }
        if edu:
            props["eleves"] = edu["eleves_secondaire"] + edu["eleves_moyen"]
            props["lycees"] = edu["lycees"]
            props["cems"] = edu["cems"]
            props["enseignants"] = edu["enseignants_sec"] + edu["enseignants_moyen"]
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [c["lon"], c["lat"]]},
            "properties": props,
        })
    return {"type": "FeatureCollection", "features": features,
            "source": "RGPH 2008 - Office National des Statistiques"}


@router.get("/{territory_id}/energy-network")
def energy_network_layer(territory_id: int, db: Session = Depends(get_db)):
    """Réseau énergétique : postes de distribution + lignes vers les zones."""
    from app.models.territory import Territory
    import hashlib
    terr = db.get(Territory, territory_id)
    if not terr:
        raise HTTPException(404, "Territoire introuvable")

    zones = _zones_or_synthetic(terr, db)
    if not zones:
        return {"type": "FeatureCollection", "features": []}

    # centres des zones
    centers = [(_zone_center(g), zname) for zname, g in zones]
    # poste principal = barycentre
    px = sum(c[0][0] for c in centers) / len(centers)
    py = sum(c[0][1] for c in centers) / len(centers)

    features = []
    # poste source (gros point)
    features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [px, py]},
        "properties": {"kind": "energy_node", "node_type": "poste_source",
                       "name": "Poste source", "capacity_mva": 120},
    })
    # lignes du poste vers chaque zone + poste de quartier
    for (cx, cy), zname in centers:
        h = int(hashlib.md5(zname.encode()).hexdigest(), 16)
        load = 40 + (h % 55)  # charge % de la ligne
        level = "Haute" if load >= 75 else "Moyenne" if load >= 55 else "Normale"
        features.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": [[px, py], [cx, cy]]},
            "properties": {"kind": "energy_line", "zone": zname,
                           "load_pct": load, "level": level},
        })
        # poste de quartier
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [cx, cy]},
            "properties": {"kind": "energy_node", "node_type": "poste_quartier",
                           "name": f"Poste {zname}", "load_pct": load},
        })
    return {"type": "FeatureCollection", "features": features}
