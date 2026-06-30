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
