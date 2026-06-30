"""Génération d'un plan de planification STRUCTURÉ (données, pas que du texte).

Produit un plan en phases, chaque phase contenant des actions concrètes avec
budget estimé, échéance, leviers et indicateurs cibles. Calibré sur le contexte
algérien et les objectifs nationaux (renouvelable 27% en 2030).
"""
from __future__ import annotations

# Coût indicatif des leviers (millions DA) — ordres de grandeur
_LEVER_COST = {
    "audit": 15, "renovation_publique": 120, "isolation_quartier": 350,
    "solaire_toitures": 280, "mobilite_douce": 200, "transport_public": 450,
    "trame_verte": 90, "eaux_pluviales": 160, "smart_grid": 220,
}


def _phase(title, period, focus, actions, target):
    budget = round(sum(a["budget_m_da"] for a in actions), 1)
    return {
        "title": title, "period": period, "focus": focus,
        "actions": actions, "target": target,
        "total_budget_m_da": budget,
    }


def build_structured_plan(territory: str, indicators: dict, forecast: dict,
                          recommendations: list[dict], horizon: int = 10) -> dict:
    perf = indicators.get("energy_performance", 75)
    resilience = indicators.get("resilience", 70)
    end_year = 2025 + horizon

    phase1 = _phase(
        "Phase 1 — Fondations", "2025-2027", "Diagnostic et bâtiments publics",
        [
            {"name": "Audit énergétique du bâti vétuste (classes E-G)",
             "lever": "audit", "budget_m_da": _LEVER_COST["audit"],
             "deadline": "2026", "priority": "Haute"},
            {"name": "Rénovation des bâtiments publics (isolation, vitrage)",
             "lever": "renovation_publique", "budget_m_da": _LEVER_COST["renovation_publique"],
             "deadline": "2027", "priority": "Haute"},
        ],
        {"indicator": "Performance énergétique", "from": perf, "to": round(perf + 5, 1)},
    )

    phase2 = _phase(
        "Phase 2 — Montée en charge", "2028-2030", "Renouvelables et mobilité",
        [
            {"name": "Déploiement solaire sur grandes toitures",
             "lever": "solaire_toitures", "budget_m_da": _LEVER_COST["solaire_toitures"],
             "deadline": "2029", "priority": "Haute"},
            {"name": "Extension des réseaux de mobilité douce",
             "lever": "mobilite_douce", "budget_m_da": _LEVER_COST["mobilite_douce"],
             "deadline": "2029", "priority": "Moyenne"},
            {"name": "Renforcement du transport public",
             "lever": "transport_public", "budget_m_da": _LEVER_COST["transport_public"],
             "deadline": "2030", "priority": "Moyenne"},
        ],
        {"indicator": "Part renouvelable", "from": 12, "to": 27},
    )

    phase3 = _phase(
        f"Phase 3 — Consolidation", f"2031-{end_year}", "Généralisation et résilience",
        [
            {"name": "Rénovation à l'échelle des quartiers",
             "lever": "isolation_quartier", "budget_m_da": _LEVER_COST["isolation_quartier"],
             "deadline": "2033", "priority": "Haute"},
            {"name": "Trame verte et gestion des eaux pluviales",
             "lever": "trame_verte", "budget_m_da": _LEVER_COST["trame_verte"] + _LEVER_COST["eaux_pluviales"],
             "deadline": f"{end_year}", "priority": "Moyenne"},
            {"name": "Réseau électrique intelligent (smart grid)",
             "lever": "smart_grid", "budget_m_da": _LEVER_COST["smart_grid"],
             "deadline": f"{end_year}", "priority": "Basse"},
        ],
        {"indicator": "Performance énergétique", "from": round(perf + 5, 1), "to": 92},
    )

    phases = [phase1, phase2, phase3]
    total_budget = round(sum(p["total_budget_m_da"] for p in phases), 1)

    return {
        "territory": territory,
        "horizon_years": horizon,
        "period": f"2025-{end_year}",
        "summary": {
            "current_performance": perf,
            "target_performance": 92,
            "current_resilience": resilience,
            "renewable_target": 27,
            "total_budget_m_da": total_budget,
            "energy_forecast_2035_gwh": forecast["forecast"][-1]["value"] if forecast.get("forecast") else None,
        },
        "phases": phases,
        "key_levers": list({a["lever"] for p in phases for a in p["actions"]}),
    }
