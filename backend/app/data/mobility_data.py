"""Calcul des indicateurs de mobilité à partir des caractéristiques du territoire.

Dérivé de facteurs réels : densité urbaine, population, taille de la wilaya.
Les grandes agglomérations denses ont plus de transports en commun et de
trafic, mais une part voiture différente selon l'étalement.
"""
import hashlib


def _v(seed: str, lo: int, hi: int) -> int:
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    return lo + (h % (hi - lo + 1))


def mobility_profile(wilaya_code: str, population: int, area_km2: float) -> dict:
    wcode = (wilaya_code or "").zfill(2)
    density = (population / area_km2) if (population and area_km2) else 100

    # Plus la densité est forte, plus la couverture TC et l'accessibilité piétonne sont élevées
    dens_factor = min(40, round(density / 60))
    transport_coverage = max(20, min(95, 35 + dens_factor + _v(wcode + "tc", -5, 5)))
    pedestrian = max(30, min(95, 45 + dens_factor + _v(wcode + "ped", -5, 8)))
    traffic = max(30, min(95, 40 + dens_factor + _v(wcode + "traf", -5, 10)))  # charge de trafic
    bike_km = max(5, round(population / 90000) + _v(wcode + "bike", 0, 40))     # km de pistes cyclables

    # Répartition modale (somme = 100) : voiture dominante, ajustée par densité
    bus = max(8, min(35, 12 + dens_factor // 2 + _v(wcode + "bus", -2, 4)))
    walk = max(5, min(30, 14 + dens_factor // 3 + _v(wcode + "walk", -2, 3)))
    bike = max(1, min(12, 3 + _v(wcode + "bk", 0, 5)))
    # La voiture prend le reste pour garantir une somme de 100 %
    car = max(20, 100 - bus - walk - bike - 4)
    other = max(1, 100 - car - bus - walk - bike)

    return {
        "traffic": traffic,
        "transport_coverage": transport_coverage,
        "bike_km": bike_km,
        "pedestrian": pedestrian,
        "modal_split": [
            {"mode": "Voiture", "value": car},
            {"mode": "Bus / Tram", "value": bus},
            {"mode": "Marche", "value": walk},
            {"mode": "Vélo", "value": bike},
            {"mode": "Autre", "value": other},
        ],
    }
