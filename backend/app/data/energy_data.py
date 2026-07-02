"""Distribution des classes énergétiques (A-G) par territoire.

Génère une distribution réaliste du parc bâti selon les caractéristiques
de la wilaya. Le bâti algérien est majoritairement ancien et peu performant
(classes D-F dominantes), avec variation selon la densité et la région.
"""
import hashlib

CLASSES = ["A", "B", "C", "D", "E", "F", "G"]
# Consommation moyenne par classe (kWh/m²/an)
CLASS_KWH = {"A": 45, "B": 85, "C": 130, "D": 190, "E": 280, "F": 380, "G": 470}


def _seed(text: str) -> int:
    return int(hashlib.md5(text.encode()).hexdigest(), 16)


def energy_distribution(seed_key: str, total_buildings: int) -> dict:
    """Renvoie la répartition des bâtiments par classe A-G + indicateurs."""
    rng = _seed(seed_key)
    # Profil type du bâti algérien : centré sur D-E, peu de A-B
    weights = [4, 8, 14, 22, 24, 18, 10]  # A..G
    # légère variation déterministe par territoire
    weights = [max(1, w + ((rng >> (i * 3)) % 7 - 3)) for i, w in enumerate(weights)]
    tot_w = sum(weights)

    counts = [round(total_buildings * w / tot_w) for w in weights]
    # ajuster pour retomber sur total_buildings
    diff = total_buildings - sum(counts)
    counts[3] += diff  # ajuste sur la classe D

    distribution = [{"classe": CLASSES[i], "count": max(0, counts[i])} for i in range(7)]

    # Consommation moyenne pondérée
    total = sum(d["count"] for d in distribution) or 1
    avg_kwh = round(sum(CLASS_KWH[d["classe"]] * d["count"] for d in distribution) / total, 1)
    # Performance (100 = très bon, décroît avec la conso)
    perf = max(15, min(95, round(100 - (avg_kwh - 45) / 4.25)))

    return {
        "distribution": distribution,
        "total_buildings": total,
        "avg_kwh_m2": avg_kwh,
        "performance": perf,
    }


def estimate_buildings(population: int) -> int:
    """Estime le nombre de bâtiments d'un territoire d'après sa population."""
    if not population:
        return 40
    # ~ 1 bâtiment (immeuble/maison) pour 25 habitants
    return max(15, min(2000, round(population / 25)))
