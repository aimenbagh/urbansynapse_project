"""Génère des scénarios de risques, solutions et plans d'action par territoire.

Deux niveaux : analyse LOCALE (règles expertes, toujours dispo) + IA Mistral
(plan rédigé, si clé configurée). Couvre risques naturels et énergétiques.
"""
from app.core.config import settings
from app.data.risks_data import risk_profile, SEISMIC_ZONE
from app.data.admin_divisions import ADMIN_DIVISIONS
from app.data.wilayas import WILAYAS

# Plans d'intervention type par aléa (mesures préventives + réponse en cas de crise)
HAZARD_PLANS = {
    "flood": {
        "nom": "Inondation",
        "prevention": [
            "Curage et entretien régulier des oueds et réseaux d'assainissement.",
            "Interdiction de construire dans les lits d'oueds et zones inondables.",
            "Bassins de rétention et digues dans les zones basses.",
        ],
        "reponse": [
            "Système d'alerte précoce météo (ANRH) relié aux communes.",
            "Plan d'évacuation des quartiers bas vers des points hauts identifiés.",
            "Pré-positionnement de pompes, sacs de sable et abris temporaires.",
        ],
    },
    "seismic": {
        "nom": "Séisme",
        "prevention": [
            "Application stricte du Règlement Parasismique Algérien (RPA) aux constructions.",
            "Diagnostic et renforcement du bâti ancien vulnérable (écoles, hôpitaux).",
            "Micro-zonage sismique des zones urbaines à risque.",
        ],
        "reponse": [
            "Plan ORSEC séisme : points de rassemblement et secours pré-organisés.",
            "Exercices d'évacuation réguliers dans les établissements publics.",
            "Stocks d'urgence (tentes, eau, matériel médical) dans des dépôts sécurisés.",
        ],
    },
    "heat": {
        "nom": "Îlot de chaleur / canicule",
        "prevention": [
            "Végétalisation urbaine et création d'ombrières dans les espaces publics.",
            "Toitures et façades réfléchissantes ou végétalisées.",
            "Réduction de l'imperméabilisation des sols.",
        ],
        "reponse": [
            "Plan canicule : points d'eau et espaces climatisés pour les personnes fragiles.",
            "Alertes sanitaires et suivi des populations vulnérables.",
            "Adaptation des horaires de travail en extérieur.",
        ],
    },
    "forest": {
        "nom": "Feu de forêt",
        "prevention": [
            "Débroussaillement des interfaces forêt-habitat et pare-feux.",
            "Surveillance des massifs en période estivale (tours de guet, drones).",
            "Sensibilisation des populations riveraines.",
        ],
        "reponse": [
            "Plan de mobilisation rapide de la Protection Civile et moyens aériens.",
            "Points d'eau et pistes d'accès entretenus pour les secours.",
            "Plan d'évacuation des zones boisées habitées.",
        ],
    },
}

ENERGY_PLAN = {
    "nom": "Risque énergétique (précarité / surcharge réseau)",
    "prevention": [
        "Rénovation énergétique du bâti pour réduire la demande (isolation).",
        "Diversification vers le solaire (fort potentiel dans le Sud).",
        "Renforcement et maillage du réseau de distribution.",
    ],
    "reponse": [
        "Plan de délestage maîtrisé en cas de pic de demande.",
        "Groupes électrogènes de secours pour les sites critiques (hôpitaux).",
        "Tarification sociale pour les ménages vulnérables.",
    ],
}


def _territory_scenarios(wcode: str, name: str, lat: float, pop: int, area: float) -> dict:
    """Scénarios de risques + solutions pour un territoire (wilaya)."""
    risks = risk_profile(wcode, lat, pop, area)
    scenarios = []
    for hz in risks["hazards"]:
        key = hz["key"]
        plan = HAZARD_PLANS.get(key)
        if not plan:
            continue
        scenarios.append({
            "aléa": hz["name"], "niveau": hz["level"], "valeur": hz["value"],
            "scénario": _scenario_text(name, hz),
            "prévention": plan["prevention"],
            "réponse_crise": plan["reponse"],
        })
    # risque énergétique
    scenarios.append({
        "aléa": ENERGY_PLAN["nom"], "niveau": "Structurel", "valeur": None,
        "scénario": f"{name} doit sécuriser son approvisionnement énergétique face à la croissance de la demande.",
        "prévention": ENERGY_PLAN["prevention"],
        "réponse_crise": ENERGY_PLAN["reponse"],
    })
    return {
        "territoire": name, "wilaya_code": wcode,
        "zone_sismique": risks["seismic_zone"],
        "risque_global": risks["global"],
        "scénarios": scenarios,
    }


def _scenario_text(name: str, hz: dict) -> str:
    lvl = hz["level"].lower()
    if hz["value"] >= 65:
        return (f"Scénario critique : un événement {hz['name'].lower()} majeur touche {name}. "
                f"L'exposition est {lvl} ({hz['value']}/100), nécessitant des mesures prioritaires.")
    if hz["value"] >= 40:
        return (f"Scénario modéré : {name} présente une exposition {lvl} au risque "
                f"{hz['name'].lower()} ({hz['value']}/100). Vigilance et prévention recommandées.")
    return (f"Scénario faible : le risque {hz['name'].lower()} à {name} est limité "
            f"({hz['value']}/100), mais une surveillance de base reste utile.")


def local_plan_single(territory) -> dict:
    """Plan local pour une wilaya donnée (objet Territory)."""
    return _territory_scenarios(
        (territory.wilaya_code or "").zfill(2), territory.name,
        territory.center_lat or 36, territory.population or 0, territory.area_km2 or 1)


def local_plan_global(territories) -> dict:
    """Plan national : synthèse sur toutes les wilayas."""
    by_wilaya = []
    high_seismic, high_flood, high_forest = [], [], []
    for t in territories:
        wc = (t.wilaya_code or "").zfill(2)
        r = risk_profile(wc, t.center_lat or 36, t.population or 0, t.area_km2 or 1)
        by_wilaya.append({"nom": t.name, "risque_global": r["global"],
                          "zone_sismique": r["seismic_zone"]})
        haz = {h["key"]: h["value"] for h in r["hazards"]}
        if r["seismic_zone"] in ("III", "IIb"):
            high_seismic.append(t.name)
        if haz.get("flood", 0) >= 65:
            high_flood.append(t.name)
        if haz.get("forest", 0) >= 65:
            high_forest.append(t.name)
    by_wilaya.sort(key=lambda x: x["risque_global"], reverse=True)
    return {
        "périmètre": "Algérie (58 wilayas)",
        "wilayas_plus_risquées": by_wilaya[:10],
        "zones_sismiques_élevées": high_seismic,
        "zones_inondation_élevée": high_flood[:15],
        "zones_feu_forêt_élevé": high_forest[:15],
        "priorités_nationales": [
            "Renforcer l'application du RPA dans les wilayas en zone sismique III (Nord).",
            "Cartographier et protéger les zones inondables des grandes villes côtières.",
            "Renforcer les moyens de lutte contre les feux dans les wilayas boisées du Nord.",
            "Accélérer la transition énergétique et le solaire dans le Sud.",
        ],
    }


def mistral_risk_plan(context: str) -> str | None:
    """Plan rédigé par Mistral (None si indisponible)."""
    key = (settings.MISTRAL_API_KEY or "").strip()
    if not key:
        return None
    try:
        import requests
        prompt = (
            "Tu es un expert en gestion des risques et protection civile en Algérie. "
            "À partir des données suivantes, rédige un plan d'action structuré : "
            "1) synthèse des risques, 2) mesures de prévention prioritaires, "
            "3) plan d'intervention en cas de crise, 4) recommandations spécifiques au territoire. "
            "Sois concret, professionnel, en français.\n\n" + context
        )
        r = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": "mistral-small-latest",
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0.4, "max_tokens": 1200},
            timeout=40,
        )
        if r.status_code != 200:
            print(f"[Mistral risques] Erreur {r.status_code}: {r.text[:200]}")
            return None
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[Mistral risques] {e}")
        return None


def _subdivision_scenarios(base_wcode: str, base_name: str, sub_name: str,
                           level_label: str, lat: float) -> dict:
    """Scénarios de risques pour une daïra ou commune, dérivés de la wilaya
    avec une variation locale déterministe (le socle sismique reste celui de la wilaya)."""
    import hashlib
    h = int(hashlib.md5(sub_name.encode()).hexdigest(), 16)
    seismic = SEISMIC_ZONE.get(base_wcode, "IIa")
    # valeurs d'aléa dérivées avec variation locale +/-12
    def val(base, salt):
        return max(10, min(95, base + ((h >> salt) % 25 - 12)))
    # bases approximatives par aléa (mêmes familles que la wilaya)
    flood_b, heat_b, forest_b = 55, 50, 40
    seismic_map = {"III": 85, "IIb": 70, "IIa": 55, "I": 35, "0": 15}
    seis_b = seismic_map.get(seismic, 55)
    hazards = [
        {"key": "flood", "name": "Inondation", "value": val(flood_b, 0)},
        {"key": "seismic", "name": "Séisme", "value": val(seis_b, 4)},
        {"key": "heat", "name": "Îlot de chaleur / canicule", "value": val(heat_b, 8)},
        {"key": "forest", "name": "Feu de forêt", "value": val(forest_b, 12)},
    ]
    scenarios = []
    for hz in hazards:
        lvl = "Élevé" if hz["value"] >= 65 else "Modéré" if hz["value"] >= 40 else "Faible"
        key = hz["key"]
        plan = HAZARD_PLANS.get(key)
        scenarios.append({
            "aléa": hz["name"], "niveau": lvl, "valeur": hz["value"],
            "scénario": _scenario_text(sub_name, {**hz, "level": lvl}),
            "prévention": plan["prevention"],
            "réponse_crise": plan["reponse"],
        })
    scenarios.append({
        "aléa": ENERGY_PLAN["nom"], "niveau": "Structurel", "valeur": None,
        "scénario": f"{sub_name} ({level_label}) doit sécuriser son approvisionnement énergétique local.",
        "prévention": ENERGY_PLAN["prevention"],
        "réponse_crise": ENERGY_PLAN["reponse"],
    })
    risk_global = round(sum(h["value"] for h in hazards) / len(hazards))
    return {
        "territoire": sub_name, "niveau_admin": level_label,
        "wilaya_parent": base_name, "wilaya_code": base_wcode,
        "zone_sismique": seismic, "risque_global": risk_global,
        "scénarios": scenarios,
    }


def local_plan_daira(territory, daira_name: str) -> dict:
    wc = (territory.wilaya_code or "").zfill(2)
    return _subdivision_scenarios(wc, territory.name, daira_name, "Daïra", territory.center_lat or 36)


def local_plan_commune(territory, commune_name: str) -> dict:
    wc = (territory.wilaya_code or "").zfill(2)
    return _subdivision_scenarios(wc, territory.name, commune_name, "Commune", territory.center_lat or 36)


def subdivisions_of(wilaya_code: str) -> dict:
    """Retourne {daira: [communes]} pour une wilaya."""
    w = ADMIN_DIVISIONS.get((wilaya_code or "").zfill(2))
    return w["dairas"] if w else {}
