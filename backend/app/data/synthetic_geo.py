"""Génère des zones et bâtiments synthétiques autour du centre d'une wilaya.

Utilisé pour les wilayas sans données seedées (toutes sauf Alger/Oran/Constantine),
afin que les couches de la carte (bâti, énergie, risques, mobilité) s'affichent
partout. Les géométries sont réalistes (grille urbaine autour du centre).
"""
import hashlib

CLASSES = ["A", "B", "C", "D", "E", "F", "G"]
LAND_USES = ["résidentiel", "commercial", "industriel", "équipement", "espace vert"]


def _rng(seed: str) -> int:
    return int(hashlib.md5(seed.encode()).hexdigest(), 16)


def synthetic_features(wilaya_code: str, name: str, lon: float, lat: float):
    """Retourne (zones, buildings) en dictionnaires GeoJSON autour de (lon, lat)."""
    if lon is None or lat is None:
        lon, lat = 3.0, 36.7
    r = _rng(wilaya_code or name)
    zones, buildings = [], []
    # grille 2x2 de zones autour du centre
    d = 0.012  # ~1.3 km
    positions = [(-d, d), (d, d), (-d, -d), (d, -d)]
    zid = 0
    for i, (dx, dy) in enumerate(positions):
        cx, cy = lon + dx, lat + dy
        zid += 1
        lu = LAND_USES[(r >> (i * 3)) % len(LAND_USES)]
        # polygone carré de la zone
        h = 0.008
        ring = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h], [cx - h, cy - h]]
        zones.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [ring]},
            "properties": {"kind": "zone", "id": 10000 + zid, "name": f"{name} — secteur {zid}",
                           "land_use": lu, "priority": ["Haute", "Moyenne", "Basse"][(r >> i) % 3],
                           "actions": [], "avg_energy_score": None, "synthetic": True},
        })
        # quelques bâtiments dans la zone
        nb = 3 + ((r >> (i * 2)) % 4)
        for j in range(nb):
            bx = cx + (((r >> (j * 3 + i)) % 100) / 100 - 0.5) * 0.012
            by = cy + (((r >> (j * 3 + i + 1)) % 100) / 100 - 0.5) * 0.012
            bs = 0.0009
            bring = [[bx - bs, by - bs], [bx + bs, by - bs], [bx + bs, by + bs], [bx - bs, by + bs], [bx - bs, by - bs]]
            cls = CLASSES[(r >> (j + i * 5)) % 7]
            # bâti algérien : biais vers D-F
            if (r >> j) % 3 == 0:
                cls = CLASSES[3 + ((r >> j) % 3)]
            buildings.append({
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [bring]},
                "properties": {"kind": "building", "id": 20000 + zid * 100 + j,
                               "energy_class": cls, "construction_year": 1980 + ((r >> j) % 40),
                               "floors": 2 + ((r >> (j + 1)) % 8), "surface_m2": 200 + ((r >> j) % 800),
                               "annual_kwh_m2": None, "synthetic": True},
            })
    return zones, buildings
