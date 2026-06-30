"""Génération de rapports de synthèse territoriale au format Markdown."""
from __future__ import annotations
from datetime import datetime


def build_report(territory_name: str, stats: dict, indicators: dict,
                 recommendations: list[dict],
                 simulation: dict | None = None) -> str:
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    lines = [
        f"# Rapport de synthèse territoriale — {territory_name}",
        f"*Généré le {now} par UrbanSynapse AI*",
        "",
        "## 1. Profil du territoire",
        f"- Population : {stats.get('population', '—')}",
        f"- Densité : {stats.get('density', '—')} hab/km²",
        f"- Zones : {stats.get('zones_count', '—')}",
        f"- Bâtiments analysés : {stats.get('buildings_count', '—')}",
        f"- Âge moyen du bâti : {stats.get('avg_building_age', '—')} ans",
        "",
        "## 2. Indicateurs clés",
    ]
    for k, v in indicators.items():
        lines.append(f"- {k} : {v}")

    if simulation:
        lines += [
            "",
            "## 3. Simulation de rénovation (échelle territoire)",
            f"- Réduction de consommation : {simulation.get('reduction_pct')}%",
            f"- CO₂ évité : {simulation.get('total_co2_avoided_t')} t/an",
            f"- Économies : {simulation.get('total_annual_savings_da')} DA/an",
            f"- Retour sur investissement : {simulation.get('roi_years')} ans",
        ]

    lines += ["", "## 4. Recommandations de planification (IA)"]
    if not recommendations:
        lines.append("*Aucune recommandation : indicateurs satisfaisants.*")
    for i, r in enumerate(recommendations, 1):
        lines += [
            f"### {i}. [{r['priority']}] {r['title']}",
            f"*Catégorie : {r['category']}*",
            "",
            r["detail"],
            f"> Impact attendu : {r['impact']}",
            "",
        ]
    lines += ["---", "*Sources : Bilans Énergétiques Nationaux algériens 2019-2024.*"]
    return "\n".join(lines)
