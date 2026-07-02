"""Analyse comparative de deux wilayas.

Fournit deux niveaux :
1. Analyse LOCALE (règles expertes sur les données) — toujours disponible.
2. Analyse IA via Mistral — si une clé API est configurée (sinon repli sur locale).
"""
from app.core.config import settings


def _fmt(w: dict) -> str:
    return (f"{w['territory_name']} : population {w['population']:,}, densité {w['density']} hab/km², "
            f"performance énergétique {w['energy_performance']}%, risque {w['risk_global']}/100 "
            f"(zone sismique {w['seismic_zone']}), résilience {w['resilience_global']}%, "
            f"couverture transports {w['transport_coverage']}%, trame verte {w['green_coverage']}%.")


def local_analysis(a: dict, b: dict) -> dict:
    """Analyse comparative déterministe basée sur les données (sans IA)."""
    solutions = []

    # Comparaison performance énergétique
    if abs(a["energy_performance"] - b["energy_performance"]) >= 5:
        weaker = a if a["energy_performance"] < b["energy_performance"] else b
        stronger = b if weaker is a else a
        solutions.append(
            f"{weaker['territory_name']} ({weaker['energy_performance']}%) est en retard sur "
            f"{stronger['territory_name']} ({stronger['energy_performance']}%) en performance énergétique. "
            f"Recommandation : lancer un programme de rénovation thermique du bâti (isolation, double vitrage) "
            f"prioritairement à {weaker['territory_name']}.")

    # Comparaison risque
    riskier = a if a["risk_global"] > b["risk_global"] else b
    if riskier["risk_global"] >= 60:
        solutions.append(
            f"{riskier['territory_name']} présente un risque élevé ({riskier['risk_global']}/100, "
            f"zone sismique {riskier['seismic_zone']}). Recommandation : renforcer les normes parasismiques "
            f"(RPA), les systèmes d'alerte et les plans d'évacuation.")

    # Comparaison résilience
    if abs(a["resilience_global"] - b["resilience_global"]) >= 8:
        weaker = a if a["resilience_global"] < b["resilience_global"] else b
        solutions.append(
            f"La résilience de {weaker['territory_name']} ({weaker['resilience_global']}%) est plus faible. "
            f"Recommandation : végétaliser l'espace urbain, développer la gestion des eaux pluviales et "
            f"les infrastructures vertes.")

    # Comparaison transports
    if abs(a["transport_coverage"] - b["transport_coverage"]) >= 10:
        weaker = a if a["transport_coverage"] < b["transport_coverage"] else b
        solutions.append(
            f"{weaker['territory_name']} a une couverture en transports en commun plus faible "
            f"({weaker['transport_coverage']}%). Recommandation : étendre les lignes de bus/tramway et "
            f"créer des pôles multimodaux.")

    # Densité
    denser = a if a["density"] > b["density"] else b
    if denser["density"] > 3000:
        solutions.append(
            f"{denser['territory_name']} est très dense ({denser['density']} hab/km²), ce qui accentue "
            f"les îlots de chaleur. Recommandation : multiplier les espaces verts et les toitures végétalisées.")

    # Synthèse
    score_a = a["energy_performance"] + a["resilience_global"] + (100 - a["risk_global"]) + a["transport_coverage"]
    score_b = b["energy_performance"] + b["resilience_global"] + (100 - b["risk_global"]) + b["transport_coverage"]
    if score_a > score_b:
        verdict = f"Globalement, {a['territory_name']} présente un profil territorial plus favorable que {b['territory_name']}."
    elif score_b > score_a:
        verdict = f"Globalement, {b['territory_name']} présente un profil territorial plus favorable que {a['territory_name']}."
    else:
        verdict = "Les deux wilayas présentent des profils territoriaux équivalents."

    return {
        "source": "analyse locale",
        "summary": verdict,
        "solutions": solutions or ["Les deux territoires ont des profils proches ; poursuivre les efforts équilibrés sur l'énergie, les risques et la mobilité."],
    }


def mistral_analysis(a: dict, b: dict) -> dict | None:
    """Analyse via Mistral. Renvoie None si indisponible (pas de clé, erreur réseau)."""
    key = (settings.MISTRAL_API_KEY or "").strip()
    if not key:
        return None
    try:
        import requests
    except ImportError:
        print("[Mistral] Le module 'requests' n'est pas installé. Lance : pip install requests")
        return None
    try:
        prompt = (
            "Tu es un expert en urbanisme et aménagement territorial en Algérie. "
            "Compare ces deux wilayas et propose des solutions concrètes et hiérarchisées.\n\n"
            f"Wilaya A — {_fmt(a)}\n"
            f"Wilaya B — {_fmt(b)}\n\n"
            "Donne : 1) une synthèse comparative en 2-3 phrases, "
            "2) une liste de 4 à 6 solutions concrètes et priorisées. "
            "Réponds en français, de façon professionnelle et concise."
        )
        r = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}",
                     "Content-Type": "application/json"},
            json={"model": "mistral-small-latest",
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0.4, "max_tokens": 800},
            timeout=30,
        )
        if r.status_code != 200:
            print(f"[Mistral] Erreur API {r.status_code}: {r.text[:200]}")
            return None
        content = r.json()["choices"][0]["message"]["content"]
        return {"source": "IA Mistral", "text": content}
    except Exception as e:
        print(f"[Mistral] Erreur lors de l'appel: {e}")
        return None


def compare_analysis(a: dict, b: dict) -> dict:
    """Renvoie l'analyse locale + (si dispo) l'analyse IA Mistral."""
    local = local_analysis(a, b)
    ai = mistral_analysis(a, b)
    return {
        "local": local,
        "ai": ai,               # None si Mistral non configuré
        "ai_available": ai is not None,
    }
