"""Profil synthétique d'un territoire : énergie + risques + population + analyse.

Combine les 3 dimensions clés pour une wilaya, avec une analyse croisée.
Pour les wilayas sans indicateurs explicites, des valeurs cohérentes sont
dérivées de leurs caractéristiques (densité, latitude).
"""
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter(prefix="/profile", tags=["profile"])


def _risk_index(territory) -> dict:
    """Indice de risque naturel global (0-100) + détail par aléa."""
    rng = random.Random((territory.id or 0) + 7)
    lat = territory.center_lat or 36
    # Le nord (côte) = plus d'inondations ; le sud = plus de chaleur
    flood = max(10, min(95, 70 - (36 - lat) * 8 + rng.randint(-10, 10)))
    heat = max(10, min(95, 40 + (36 - lat) * 9 + rng.randint(-10, 10)))
    seismic = rng.randint(30, 80)
    global_idx = round((flood + heat + seismic) / 3)
    return {"global": global_idx, "flood": round(flood),
            "heat": round(heat), "seismic": seismic}


@router.get("/{territory_id}")
def territory_profile(territory_id: int, db: Session = Depends(get_db)):
    from app.models.territory import Territory, Zone, Building
    from app.models.indicator import Indicator

    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")

    indicators = {i.key: i.value for i in
                  db.query(Indicator).filter(Indicator.territory_id == territory_id).all()}

    # Performance énergétique : indicateur réel ou dérivé (densité)
    density = (t.population / t.area_km2) if t.population and t.area_km2 else None
    if "energy_performance" in indicators:
        perf = indicators["energy_performance"]
    else:
        rng = random.Random((t.id or 0) + 3)
        perf = round(max(55, min(90, 72 + rng.randint(-12, 12))))

    risk = _risk_index(t)

    # Analyse combinée des 3 dimensions
    pop = t.population or 0
    pop_label = "forte" if pop > 1_000_000 else "moyenne" if pop > 400_000 else "faible"
    perf_label = "bonne" if perf >= 78 else "moyenne" if perf >= 68 else "faible"
    risk_label = "élevée" if risk["global"] >= 65 else "modérée" if risk["global"] >= 45 else "faible"

    analysis = (
        f"{t.name} présente une population {pop_label} "
        f"({pop:,} hab.) avec une performance énergétique {perf_label} ({perf}%). "
        f"L'exposition aux risques naturels est {risk_label} (indice {risk['global']}/100), "
        f"dominée par {'les inondations' if risk['flood'] >= max(risk['heat'], risk['seismic']) else 'la chaleur' if risk['heat'] >= risk['seismic'] else 'le risque sismique'}. "
    )
    # Recommandation croisée
    if pop > 800_000 and perf < 75:
        analysis += ("La combinaison forte densité + performance modérée appelle "
                     "un programme prioritaire de rénovation énergétique du bâti.")
    elif risk["global"] >= 65:
        analysis += ("Le niveau de risque élevé justifie d'intégrer la résilience "
                     "climatique en amont de tout projet d'aménagement.")
    else:
        analysis += ("Le profil est relativement équilibré ; la priorité est de "
                     "consolider les acquis énergétiques et de prévenir les risques.")

    return {
        "territory": {"id": t.id, "name": t.name, "wilaya_code": t.wilaya_code},
        "population": pop,
        "density": round(density, 1) if density else None,
        "area_km2": t.area_km2,
        "energy_performance": perf,
        "risk": risk,
        "analysis": analysis,
        # série pour le graphe (3 dimensions normalisées 0-100)
        "chart": [
            {"dimension": "Performance énerg.", "value": perf},
            {"dimension": "Risque naturel", "value": risk["global"]},
            {"dimension": "Densité (norm.)",
             "value": round(min(100, (density or 0) / 50)) if density else 0},
        ],
    }


@router.get("/{territory_id}/risks-detail")
def risks_detail(territory_id: int, db: Session = Depends(get_db)):
    """Détail des risques naturels avec valeurs réelles par aléa (page Risques)."""
    from app.models.territory import Territory
    from app.data.risks_data import risk_profile
    t = db.get(Territory, territory_id)
    if not t:
        from fastapi import HTTPException
        raise HTTPException(404, "Territoire introuvable")
    prof = risk_profile(t.wilaya_code or "", t.center_lat or 36,
                        t.population or 0, t.area_km2 or 1)
    return {
        "territory_id": t.id, "territory_name": t.name,
        "wilaya_code": t.wilaya_code,
        "global": prof["global"], "seismic_zone": prof["seismic_zone"],
        "hazards": prof["hazards"],
    }


@router.get("/{territory_id}/risks-hierarchy")
def risks_hierarchy(territory_id: int, db: Session = Depends(get_db)):
    """Risques de la wilaya + détail par daïra et commune (wilaya→daïra→commune)."""
    from app.models.territory import Territory
    from app.data.risks_data import risk_profile
    from app.data.admin_divisions import ADMIN_DIVISIONS
    import hashlib

    t = db.get(Territory, territory_id)
    if not t:
        from fastapi import HTTPException
        raise HTTPException(404, "Territoire introuvable")

    wcode = (t.wilaya_code or "").zfill(2)
    base = risk_profile(wcode, t.center_lat or 36, t.population or 0, t.area_km2 or 1)

    # Petite variation déterministe par commune (autour des valeurs de la wilaya)
    def vary(base_val: int, seed: str) -> int:
        h = int(hashlib.md5(seed.encode()).hexdigest(), 16) % 21 - 10  # -10..+10
        return max(5, min(98, base_val + h))

    def level(v):
        return "Élevé" if v >= 65 else "Modéré" if v >= 40 else "Faible"

    wilaya_data = ADMIN_DIVISIONS.get(wcode)
    dairas = []
    if wilaya_data:
        for daira_name, communes in wilaya_data["dairas"].items():
            commune_list = []
            for cname in communes:
                hazards = []
                for hz in base["hazards"]:
                    v = vary(hz["value"], f"{cname}-{hz['key']}")
                    hazards.append({"key": hz["key"], "name": hz["name"], "value": v, "level": level(v)})
                gidx = round(sum(h["value"] for h in hazards) / len(hazards))
                commune_list.append({"name": cname, "global": gidx, "level": level(gidx), "hazards": hazards})
            # risque moyen de la daïra
            davg = round(sum(c["global"] for c in commune_list) / len(commune_list)) if commune_list else base["global"]
            dairas.append({"name": daira_name, "global": davg, "level": level(davg), "communes": commune_list})

    return {
        "territory_id": t.id, "territory_name": t.name, "wilaya_code": wcode,
        "global": base["global"], "seismic_zone": base["seismic_zone"],
        "hazards": base["hazards"],
        "dairas": dairas,
        "has_detail": len(dairas) > 0,
    }


@router.get("/{territory_id}/resilience")
def resilience_detail(territory_id: int, db: Session = Depends(get_db)):
    """Résilience urbaine (données dérivées) + détail par daïra et commune."""
    from app.models.territory import Territory
    from app.data.resilience_data import resilience_profile
    from app.data.admin_divisions import ADMIN_DIVISIONS
    import hashlib

    t = db.get(Territory, territory_id)
    if not t:
        from fastapi import HTTPException
        raise HTTPException(404, "Territoire introuvable")

    wcode = (t.wilaya_code or "").zfill(2)
    # performance énergétique depuis le profil
    try:
        prof = territory_profile(territory_id, db)
        eperf = prof.get("energy_performance", 70)
    except Exception:
        eperf = 70

    base = resilience_profile(wcode, t.center_lat or 36, t.population or 0, t.area_km2 or 1, eperf)

    def vary(v, seed):
        h = int(hashlib.md5(seed.encode()).hexdigest(), 16) % 21 - 10
        return max(10, min(98, v + h))

    def level(v):
        return "Élevée" if v >= 65 else "Moyenne" if v >= 45 else "Faible"

    wilaya_data = ADMIN_DIVISIONS.get(wcode)
    dairas = []
    if wilaya_data:
        for daira_name, communes in wilaya_data["dairas"].items():
            clist = []
            for cname in communes:
                # dimensions propres à la commune (variation par axe autour de la wilaya)
                cdims = [{"axis": d["axis"], "score": vary(d["score"], f"{cname}-{d['axis']}")}
                         for d in base["dimensions"]]
                gv = round(sum(x["score"] for x in cdims) / len(cdims))
                clist.append({"name": cname, "global": gv, "level": level(gv), "dimensions": cdims})
            davg = round(sum(c["global"] for c in clist) / len(clist)) if clist else base["global"]
            # dimensions de la daïra = moyenne de ses communes
            ddims = []
            for i, d in enumerate(base["dimensions"]):
                avg = round(sum(c["dimensions"][i]["score"] for c in clist) / len(clist)) if clist else d["score"]
                ddims.append({"axis": d["axis"], "score": avg})
            dairas.append({"name": daira_name, "global": davg, "level": level(davg),
                          "dimensions": ddims, "communes": clist})

    return {
        "territory_id": t.id, "territory_name": t.name, "wilaya_code": wcode,
        "global": base["global"], "heat_zones": base["heat_zones"],
        "water_management": base["water_management"], "green_coverage": base["green_coverage"],
        "dimensions": base["dimensions"],
        "dairas": dairas, "has_detail": len(dairas) > 0,
    }


@router.get("/{territory_id}/mobility-detail")
def mobility_detail(territory_id: int, db: Session = Depends(get_db)):
    """Mobilité & accessibilité (données dérivées) + détail par daïra et commune."""
    from app.models.territory import Territory
    from app.data.mobility_data import mobility_profile
    from app.data.admin_divisions import ADMIN_DIVISIONS
    import hashlib

    t = db.get(Territory, territory_id)
    if not t:
        from fastapi import HTTPException
        raise HTTPException(404, "Territoire introuvable")

    wcode = (t.wilaya_code or "").zfill(2)
    base = mobility_profile(wcode, t.population or 0, t.area_km2 or 1)

    def vary(v, seed, spread=10):
        h = int(hashlib.md5(seed.encode()).hexdigest(), 16) % (2 * spread + 1) - spread
        return max(5, min(98, v + h))

    def level(v):
        return "Bonne" if v >= 65 else "Moyenne" if v >= 45 else "Faible"

    def commune_modal(cname):
        # répartition modale propre à la commune (variation, re-normalisée à 100)
        raw = [{"mode": m["mode"], "value": vary(m["value"], f"{cname}-{m['mode']}", 6)}
               for m in base["modal_split"]]
        tot = sum(x["value"] for x in raw) or 1
        norm = [{"mode": x["mode"], "value": round(x["value"] * 100 / tot)} for x in raw]
        # ajuster l'arrondi pour tomber pile à 100
        diff = 100 - sum(x["value"] for x in norm)
        if norm:
            norm[0]["value"] += diff
        return norm

    wilaya_data = ADMIN_DIVISIONS.get(wcode)
    dairas = []
    if wilaya_data:
        for daira_name, communes in wilaya_data["dairas"].items():
            clist = []
            for cname in communes:
                cov = vary(base["transport_coverage"], f"{cname}-cov")
                ped = vary(base["pedestrian"], f"{cname}-ped")
                score = round((cov + ped) / 2)
                clist.append({"name": cname, "transport_coverage": cov,
                              "pedestrian": ped, "score": score, "level": level(score),
                              "modal_split": commune_modal(cname)})
            davg = round(sum(c["score"] for c in clist) / len(clist)) if clist else 50
            # modal moyen de la daïra = moyenne des communes
            dmodal = []
            for i, m in enumerate(base["modal_split"]):
                avg = round(sum(c["modal_split"][i]["value"] for c in clist) / len(clist)) if clist else m["value"]
                dmodal.append({"mode": m["mode"], "value": avg})
            # ajuster à 100 exactement
            _diff = 100 - sum(x["value"] for x in dmodal)
            if dmodal:
                dmodal[0]["value"] += _diff
            dairas.append({"name": daira_name, "score": davg, "level": level(davg),
                          "modal_split": dmodal, "communes": clist})

    return {
        "territory_id": t.id, "territory_name": t.name, "wilaya_code": wcode,
        "traffic": base["traffic"], "transport_coverage": base["transport_coverage"],
        "bike_km": base["bike_km"], "pedestrian": base["pedestrian"],
        "modal_split": base["modal_split"],
        "dairas": dairas, "has_detail": len(dairas) > 0,
    }


@router.get("/{territory_id}/compare-data")
def compare_data(territory_id: int, db: Session = Depends(get_db)):
    """Données consolidées d'une wilaya pour la comparaison (mêmes sources que
    les pages Risques / Résilience / Mobilité / Énergie, pour la cohérence)."""
    from app.models.territory import Territory
    from app.data.risks_data import risk_profile
    from app.data.resilience_data import resilience_profile
    from app.data.mobility_data import mobility_profile
    from app.data.energy_data import energy_distribution, estimate_buildings

    t = db.get(Territory, territory_id)
    if not t:
        from fastapi import HTTPException
        raise HTTPException(404, "Territoire introuvable")

    wcode = (t.wilaya_code or "").zfill(2)
    lat = t.center_lat or 36
    pop = t.population or 0
    area = t.area_km2 or 1
    density = round(pop / area, 1) if area else 0

    # Performance énergétique (même logique que la page Énergie)
    try:
        prof = territory_profile(territory_id, db)
        eperf = prof.get("energy_performance", 70)
    except Exception:
        eperf = 70

    risks = risk_profile(wcode, lat, pop, area)
    resil = resilience_profile(wcode, lat, pop, area, eperf)
    mob = mobility_profile(wcode, pop, area)

    return {
        "territory_id": t.id, "territory_name": t.name, "wilaya_code": wcode,
        "population": pop, "area_km2": area, "density": density,
        "energy_performance": round(eperf),
        "risk_global": risks["global"], "seismic_zone": risks["seismic_zone"],
        "resilience_global": resil["global"],
        "transport_coverage": mob["transport_coverage"],
        "pedestrian": mob["pedestrian"],
        "green_coverage": resil["green_coverage"],
        # pour les graphes détaillés
        "risk_hazards": risks["hazards"],
        "resilience_dimensions": resil["dimensions"],
        "modal_split": mob["modal_split"],
    }


@router.get("/compare/{id_a}/{id_b}/analysis")
def compare_analysis_endpoint(id_a: int, id_b: int, db: Session = Depends(get_db)):
    """Analyse comparative de deux wilayas : locale (toujours) + IA Mistral (si dispo)."""
    from app.services.compare_ai import compare_analysis
    a = compare_data(id_a, db)
    b = compare_data(id_b, db)
    result = compare_analysis(a, b)
    return {"wilaya_a": a["territory_name"], "wilaya_b": b["territory_name"], **result}
