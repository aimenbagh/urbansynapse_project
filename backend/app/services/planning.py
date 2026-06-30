"""Recommandations de planification territoriale.

Génère des recommandations priorisées à partir des indicateurs et du parc
bâti d'un territoire (moteur à base de règles, extensible vers un vrai modèle
IA). Chaque recommandation a une priorité, un impact estimé et une catégorie.
"""
from __future__ import annotations

# Score énergétique d'une classe (A=7 .. G=1) ; plus bas = bâti à rénover
_CLASS_SCORE = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}


def generate_recommendations(indicators: dict[str, float],
                             buildings: list[dict]) -> list[dict]:
    """Retourne une liste de recommandations priorisées."""
    recs: list[dict] = []

    # 1. Rénovation énergétique du bâti vétuste (classes E, F, G)
    poor = [b for b in buildings if b.get("energy_class") in ("E", "F", "G")]
    if poor:
        share = round(len(poor) / max(len(buildings), 1) * 100)
        recs.append({
            "category": "Énergie",
            "priority": "Haute" if share > 30 else "Moyenne",
            "title": "Rénovation énergétique prioritaire du bâti vétuste",
            "detail": f"{len(poor)} bâtiments ({share}%) en classe E-G. "
                      "Cibler isolation et vitrage pour un gain rapide.",
            "impact": "Réduction estimée 25-40% de la consommation",
        })

    # 2. Performance énergétique globale faible
    perf = indicators.get("energy_performance")
    if perf is not None and perf < 75:
        recs.append({
            "category": "Énergie",
            "priority": "Haute",
            "title": "Plan d'efficacité énergétique territorial",
            "detail": f"Performance énergétique à {perf}% (objectif ≥ 75%). "
                      "Déployer un programme de rénovation à l'échelle des quartiers.",
            "impact": "Convergence vers les objectifs nationaux 2030",
        })

    # 3. Résilience insuffisante
    resilience = indicators.get("resilience")
    if resilience is not None and resilience < 75:
        recs.append({
            "category": "Résilience",
            "priority": "Moyenne",
            "title": "Renforcement de la résilience climatique",
            "detail": f"Résilience territoriale à {resilience}%. Augmenter la trame "
                      "verte et la gestion des eaux pluviales pour réduire les îlots de chaleur.",
            "impact": "Atténuation des vulnérabilités climatiques",
        })

    # 4. Qualité de l'air
    air = indicators.get("air_quality")
    if air is not None and air < 85:
        recs.append({
            "category": "Mobilité",
            "priority": "Moyenne",
            "title": "Promotion de la mobilité douce",
            "detail": f"Qualité de l'air à {air}/100. Étendre pistes cyclables et "
                      "transport public pour réduire les émissions du transport (~30% national).",
            "impact": "Amélioration de la qualité de l'air urbain",
        })

    # 5. Énergies renouvelables (toujours pertinent — objectif 2030)
    solar_ready = [b for b in buildings if (b.get("surface_m2") or 0) > 1000]
    if solar_ready:
        recs.append({
            "category": "Énergie",
            "priority": "Basse",
            "title": "Déploiement solaire sur grandes toitures",
            "detail": f"{len(solar_ready)} bâtiments à grande emprise propices au "
                      "photovoltaïque, en appui de l'objectif national 27% renouvelable 2030.",
            "impact": "Production d'énergie décarbonée locale",
        })

    # Tri par priorité
    order = {"Haute": 0, "Moyenne": 1, "Basse": 2}
    recs.sort(key=lambda r: order.get(r["priority"], 3))
    return recs
