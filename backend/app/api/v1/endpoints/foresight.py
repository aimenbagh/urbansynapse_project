"""Planification prospective : projections ML + scénarios + plan IA."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.ml.forecasting import forecast_series, project_indicator
from app.services.planning import generate_recommendations
from app.services.ai_planner import generate_plan
from app.services.structured_plan import build_structured_plan

router = APIRouter(prefix="/foresight", tags=["foresight"])


def _territory_context(territory_id: int, db: Session):
    from app.models.territory import Territory, Zone, Building
    from app.models.indicator import Indicator
    t = db.get(Territory, territory_id)
    name = t.name if t else f"Territoire {territory_id}"
    indicators = {i.key: i.value for i in
                  db.query(Indicator).filter(Indicator.territory_id == territory_id).all()}
    zone_ids = [z.id for z in db.query(Zone).filter(Zone.territory_id == territory_id).all()]
    buildings = db.query(Building).filter(Building.zone_id.in_(zone_ids)).all() if zone_ids else []
    bdata = [{"energy_class": b.energy_class, "surface_m2": b.surface_m2} for b in buildings]
    return name, indicators, bdata


@router.get("/{territory_id}/forecast")
def forecast(territory_id: int, target_year: int = 2035):
    """Projection ML de la consommation énergétique nationale."""
    return forecast_series(target_year)


@router.get("/{territory_id}/scenarios")
def scenarios(territory_id: int, db: Session = Depends(get_db), horizon: int = 10):
    """Trois trajectoires prospectives d'un indicateur clé (perf. énergétique)."""
    _, indicators, _ = _territory_context(territory_id, db)
    current = indicators.get("energy_performance", 75)
    return {
        "indicator": "Performance énergétique (%)",
        "current": current,
        "trajectories": {
            "tendanciel": project_indicator(current, 1.0, horizon),
            "volontariste": project_indicator(current, 2.5, horizon),
            "objectif_2030": project_indicator(current, 4.0, horizon),
        },
    }


class PlanRequest(BaseModel):
    horizon: int = 10


@router.post("/{territory_id}/plan")
def plan(territory_id: int, payload: PlanRequest, db: Session = Depends(get_db)):
    """Génère un plan d'action prospectif (ML + diagnostic + IA générative)."""
    name, indicators, bdata = _territory_context(territory_id, db)
    fc = forecast_series(2025 + payload.horizon)
    recs = generate_recommendations(indicators, bdata)
    result = generate_plan(name, indicators, fc, recs, payload.horizon)
    return {
        "territory": name,
        "horizon": payload.horizon,
        "source": result["source"],
        "forecast_summary": {
            "from": fc["history"][-1],
            "to": fc["forecast"][-1],
            "cagr_pct": fc.get("historical_cagr_pct"),
            "r2": fc["r2"],
        },
        "plan_markdown": result["plan"],
    }


@router.post("/{territory_id}/structured-plan")
def structured_plan(territory_id: int, payload: PlanRequest, db: Session = Depends(get_db)):
    """Plan de planification structuré (phases, actions, budgets, cibles)."""
    name, indicators, bdata = _territory_context(territory_id, db)
    fc = forecast_series(2025 + payload.horizon)
    recs = generate_recommendations(indicators, bdata)
    return build_structured_plan(name, indicators, fc, recs, payload.horizon)
