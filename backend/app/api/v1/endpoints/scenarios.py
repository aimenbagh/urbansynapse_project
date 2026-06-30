from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.scenario import ScenarioCreate, ScenarioRead
from app.services.scoring import weighted_score

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/", response_model=list[ScenarioRead])
def list_scenarios(territory_id: int | None = None, db: Session = Depends(get_db)):
    from app.models.indicator import Scenario
    q = db.query(Scenario)
    if territory_id:
        q = q.filter(Scenario.territory_id == territory_id)
    return q.order_by(Scenario.id.desc()).all()


@router.post("/", response_model=ScenarioRead)
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_db)):
    from app.models.indicator import Scenario
    score = weighted_score(payload.parameters)
    sc = Scenario(territory_id=payload.territory_id, name=payload.name,
                  description=payload.description, parameters=payload.parameters,
                  results=score.breakdown, performance=score.global_score)
    db.add(sc); db.commit(); db.refresh(sc)
    return sc


@router.get("/{scenario_id}", response_model=ScenarioRead)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    from app.models.indicator import Scenario
    sc = db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "Scénario introuvable")
    return sc


@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    from app.models.indicator import Scenario
    sc = db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "Scénario introuvable")
    db.delete(sc); db.commit()
    return {"deleted": scenario_id}
