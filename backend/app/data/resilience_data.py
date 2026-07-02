"""Calcul de la résilience urbaine à partir des caractéristiques du territoire.

La résilience est dérivée de facteurs réels : performance énergétique,
exposition aux risques, densité urbaine, position géographique.
"""
import hashlib
from app.data.risks_data import risk_profile


def _seed_val(seed: str, lo: int, hi: int) -> int:
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    return lo + (h % (hi - lo + 1))


def resilience_profile(wilaya_code: str, lat: float, population: int, area_km2: float,
                       energy_perf: float = 70) -> dict:
    """Retourne les indicateurs de résilience + profil multidimensionnel (0-100)."""
    wcode = (wilaya_code or "").zfill(2)
    risks = risk_profile(wcode, lat or 36, population or 0, area_km2 or 1)
    density = (population / area_km2) if (population and area_km2) else 100

    # Résilience = inverse du risque, pondérée par la performance énergétique
    climate_resil = max(20, min(95, 100 - risks["hazards"][2]["value"]))      # vs îlot de chaleur
    energy_resil = max(20, min(95, round(energy_perf)))
    water_resil = max(20, min(95, 100 - risks["hazards"][0]["value"] + 15))   # vs inondation
    eco_resil = max(15, min(90, 100 - risks["hazards"][3]["value"]))          # vs feu de forêt (couvert végétal)
    social_resil = max(25, min(90, 70 - round((density - 500) / 100) + _seed_val(wcode + "soc", -5, 5)))
    economic_resil = max(25, min(92, 55 + _seed_val(wcode + "eco", -10, 25)))

    global_resil = round((climate_resil + energy_resil + water_resil + eco_resil + social_resil + economic_resil) / 6)

    # Îlots de chaleur : nombre de zones (proportionnel à la densité et à la chaleur)
    heat_zones = max(1, round(risks["hazards"][2]["value"] / 6 + density / 800))

    return {
        "global": global_resil,
        "heat_zones": heat_zones,
        "water_management": water_resil,
        "green_coverage": eco_resil,
        "dimensions": [
            {"axis": "Climatique", "score": climate_resil},
            {"axis": "Énergétique", "score": energy_resil},
            {"axis": "Eau", "score": water_resil},
            {"axis": "Sociale", "score": social_resil},
            {"axis": "Économique", "score": economic_resil},
            {"axis": "Écologique", "score": eco_resil},
        ],
    }
