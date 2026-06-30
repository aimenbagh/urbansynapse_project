"""Affecte à chaque zone une priorité d'intervention et des actions du plan.

Relie le plan d'action à la carte : selon l'usage du sol et l'état du bâti de
la zone, on déduit une priorité (Haute/Moyenne/Basse) et des actions concrètes.
"""
from __future__ import annotations

_CLASS_SCORE = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1}

# Actions types par usage du sol
_ACTIONS_BY_USE = {
    "residentiel": ["Rénovation énergétique du bâti", "Isolation thermique", "Photovoltaïque toitures"],
    "tertiaire": ["Efficacité énergétique des bureaux", "Smart building", "Mobilité douce"],
    "industrie": ["Décarbonation des process", "Récupération de chaleur", "Solaire industriel"],
    "mixte": ["Densification durable", "Mixité fonctionnelle", "Trame verte"],
}


def zone_plan(land_use: str, avg_class_score: float | None) -> dict:
    """Retourne la priorité et les actions pour une zone."""
    use = (land_use or "mixte").lower()
    score = avg_class_score if avg_class_score is not None else 4.0

    # Plus le score énergétique est bas (bâti vétuste), plus la priorité est haute
    if score <= 3.0:
        priority = "Haute"
    elif score <= 4.5:
        priority = "Moyenne"
    else:
        priority = "Basse"

    return {
        "priority": priority,
        "actions": _ACTIONS_BY_USE.get(use, _ACTIONS_BY_USE["mixte"]),
    }
