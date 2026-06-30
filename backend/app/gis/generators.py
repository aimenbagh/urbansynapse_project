"""Génération de géométries GeoJSON de démonstration (zones + bâtiments).

Crée des polygones réalistes répartis autour du centre de chaque ville,
stockés en GeoJSON texte (compatible SQLite et PostGIS). Permet d'afficher
une vraie cartographie tant que les données SIG officielles ne sont pas
intégrées.
"""
from __future__ import annotations
import json
import math
import random


# Centres approximatifs (lon, lat) des wilayas
CITY_CENTERS = {
    "Alger": (3.0588, 36.7538),
    "Oran": (-0.6331, 35.6987),
    "Constantine": (6.6147, 36.3650),
}


def _rect(lon: float, lat: float, w: float, h: float) -> list:
    """Polygone rectangulaire (anneau fermé) en degrés."""
    return [[
        [lon, lat], [lon + w, lat], [lon + w, lat + h],
        [lon, lat + h], [lon, lat],
    ]]


def zone_polygon(center, index: int, total: int) -> dict:
    """Grand polygone de zone, disposé en grille autour du centre."""
    clon, clat = center
    cols = math.ceil(math.sqrt(total))
    size = 0.018  # ~2 km
    gx = index % cols
    gy = index // cols
    lon = clon - (cols * size) / 2 + gx * size
    lat = clat - (cols * size) / 2 + gy * size
    return {"type": "Polygon", "coordinates": _rect(lon, lat, size * 0.92, size * 0.92)}


def building_polygon(zone_geom: dict, seed: int) -> dict:
    """Petit polygone de bâtiment placé à l'intérieur d'une zone."""
    ring = zone_geom["coordinates"][0]
    lon0, lat0 = ring[0]
    lon1, lat1 = ring[2]
    rnd = random.Random(seed)
    bw, bh = 0.0011, 0.0011
    lon = rnd.uniform(lon0 + 0.001, lon1 - bw - 0.001)
    lat = rnd.uniform(lat0 + 0.001, lat1 - bh - 0.001)
    return {"type": "Polygon", "coordinates": _rect(lon, lat, bw, bh)}


def to_text(geom: dict) -> str:
    return json.dumps(geom)


def centroid(geom: dict) -> tuple[float, float]:
    ring = geom["coordinates"][0]
    xs = [p[0] for p in ring[:-1]]
    ys = [p[1] for p in ring[:-1]]
    return (sum(xs) / len(xs), sum(ys) / len(ys))
