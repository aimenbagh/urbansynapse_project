from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.energy import simulate_retrofit, aggregate_territory_retrofit

router = APIRouter(prefix="/energy", tags=["energy"])


class RetrofitRequest(BaseModel):
    surface_m2: float = Field(..., gt=0, json_schema_extra={"example": 100})
    energy_class: str = Field(..., json_schema_extra={"example": "E"})
    measures: list[str] = Field(default_factory=list,
                                json_schema_extra={"example": ["insulation", "glazing"]})


@router.post("/retrofit")
def retrofit(payload: RetrofitRequest):
    return simulate_retrofit(payload.surface_m2, payload.energy_class, payload.measures)


class TerritoryRetrofitRequest(BaseModel):
    territory_id: int
    measures: list[str] = Field(default_factory=lambda: ["insulation", "glazing"])


@router.post("/territory-retrofit")
def territory_retrofit(payload: TerritoryRetrofitRequest, db: Session = Depends(get_db)):
    """Agrège la simulation de rénovation sur tout le bâti d'un territoire."""
    from app.models.territory import Zone, Building
    zone_ids = [z.id for z in db.query(Zone).filter(Zone.territory_id == payload.territory_id).all()]
    buildings = (
        db.query(Building).filter(Building.zone_id.in_(zone_ids)).all() if zone_ids else []
    )
    data = [{"surface_m2": b.surface_m2, "energy_class": b.energy_class} for b in buildings]
    return aggregate_territory_retrofit(data, payload.measures)
