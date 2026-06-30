"""Génération de plans de planification prospective.

Combine :
1. Les projections quantitatives du modèle ML (app.ml.forecasting)
2. Les recommandations à base de règles (app.services.planning)
3. Une rédaction narrative par IA générative (API Mistral)

Si la clé MISTRAL_API_KEY est absente ou l'appel échoue, un plan structuré
de repli est produit localement — la fonctionnalité reste toujours disponible.
"""
from __future__ import annotations
import os
import json
import httpx

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "mistral-small-latest"


def _build_prompt(territory: str, indicators: dict, forecast: dict,
                  recommendations: list[dict], horizon: int) -> str:
    recs_txt = "\n".join(
        f"- [{r['priority']}] {r['title']} : {r['detail']}" for r in recommendations
    )
    return (
        f"Tu es un expert en planification urbaine durable en Algérie. "
        f"Rédige un plan d'action prospectif pour le territoire de {territory}, "
        f"à horizon {horizon} ans (2025-{2025 + horizon}).\n\n"
        f"Indicateurs actuels : {json.dumps(indicators, ensure_ascii=False)}\n"
        f"Projection énergétique (modèle ML) : consommation passant de "
        f"{forecast['history'][-1]['value']} à {forecast['forecast'][-1]['value']} GWh "
        f"(croissance {forecast.get('historical_cagr_pct')}%/an).\n"
        f"Diagnostic :\n{recs_txt}\n\n"
        f"Structure le plan en 3 phases (court, moyen, long terme), avec pour "
        f"chaque phase des actions concrètes, des objectifs chiffrés et les "
        f"leviers (rénovation du bâti, renouvelables, mobilité). Sois concret "
        f"et adapté au contexte algérien. Réponds en français, en Markdown."
    )


def _fallback_plan(territory: str, indicators: dict, forecast: dict,
                   recommendations: list[dict], horizon: int) -> str:
    """Plan structuré généré localement (sans IA générative), rendu en Markdown riche."""
    end = 2025 + horizon
    perf = indicators.get("energy_performance", "—")
    resil = indicators.get("resilience", "—")
    air = indicators.get("air_quality", "—")
    co2 = indicators.get("co2_avoided", "—")
    from_gwh = forecast["history"][-1]["value"] if forecast.get("history") else "—"
    to_gwh = forecast["forecast"][-1]["value"] if forecast.get("forecast") else "—"
    cagr = forecast.get("historical_cagr_pct", "—")

    lines = [
        f"# Plan d'Action Prospectif — {territory} (2025-{end})",
        "*Vers un territoire durable, résilient et sobre en carbone*",
        "",
        "## Contexte",
        f"Ce plan combine **rénovation urbaine**, **transition énergétique** et "
        f"**mobilité durable**, en phase avec les objectifs nationaux (**27% ENR en 2030**). "
        f"La consommation électrique projetée passe de **{from_gwh} GWh** (2024) à "
        f"**{to_gwh} GWh** ({end}), soit une croissance de **{cagr}%/an**.",
        "",
        "## Indicateurs de référence",
        "| Indicateur | Valeur actuelle | Cible | Unité |",
        "|------------|-----------------|-------|-------|",
        f"| Performance énergétique | {perf} | ≥ 90 | Indice (0-100) |",
        f"| Résilience climatique | {resil} | ≥ 90 | Indice (0-100) |",
        f"| Qualité de l'air | {air} | ≥ 90 | Indice AQI |",
        f"| CO₂ évité | {co2} | ≥ 5 000 | t/an |",
        f"| Part ENR | ~12% | 27% | % |",
        "",
        "## Phase 1 — Court terme (0-3 ans) : fondations",
        "- Audit énergétique du bâti vétuste (classes E-G) et priorisation.",
        "- Rénovation des bâtiments publics (isolation, vitrage).",
        "- **Objectif** : +5 points de performance énergétique.",
        "",
        "## Phase 2 — Moyen terme (3-6 ans) : montée en charge",
        "- Déploiement du photovoltaïque sur les grandes toitures.",
        "- Extension des réseaux de mobilité douce et transport public.",
        "- **Objectif** : 27% d'énergie renouvelable (cible nationale 2030).",
        "",
        f"## Phase 3 — Long terme (6-{horizon} ans) : consolidation",
        "- Généralisation de la rénovation à l'échelle des quartiers.",
        "- Renforcement de la résilience climatique (trame verte, eaux pluviales).",
        "- **Objectif** : performance énergétique > 90%.",
        "",
        "## Recommandations prioritaires",
    ]
    for r in recommendations:
        lines.append(f"- **[{r['priority']}] {r['title']}** — {r['impact']}")
    lines += ["", "---",
              "*Plan généré localement. Sources : Bilans Énergétiques Nationaux algériens.*"]
    return chr(10).join(lines)


def generate_plan(territory: str, indicators: dict, forecast: dict,
                  recommendations: list[dict], horizon: int = 10) -> dict:
    """Retourne un plan prospectif (IA générative si dispo, sinon repli)."""
    try:
        from app.core.config import settings
        api_key = (settings.MISTRAL_API_KEY or os.getenv("MISTRAL_API_KEY", "")).strip()
    except Exception:
        api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    if not api_key:
        return {"source": "fallback",
                "plan": _fallback_plan(territory, indicators, forecast, recommendations, horizon)}

    try:
        prompt = _build_prompt(territory, indicators, forecast, recommendations, horizon)
        resp = httpx.post(
            MISTRAL_API_URL,
            headers={"Authorization": f"Bearer {api_key}",
                     "Content-Type": "application/json"},
            json={"model": MISTRAL_MODEL,
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0.4, "max_tokens": 1200},
            timeout=40,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return {"source": "mistral", "plan": content}
    except Exception as e:
        plan = _fallback_plan(territory, indicators, forecast, recommendations, horizon)
        return {"source": "fallback", "error": str(e)[:120], "plan": plan}
