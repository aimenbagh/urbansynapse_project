"""Endpoint de recommandations de planification (IA à base de règles)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.planning import generate_recommendations

router = APIRouter(prefix="/planning", tags=["planning"])


@router.get("/{territory_id}/recommendations")
def recommendations(territory_id: int, db: Session = Depends(get_db)):
    from app.models.indicator import Indicator
    from app.models.territory import Zone, Building

    indicators = {
        i.key: i.value
        for i in db.query(Indicator).filter(Indicator.territory_id == territory_id).all()
    }
    zone_ids = [z.id for z in db.query(Zone).filter(Zone.territory_id == territory_id).all()]
    buildings = (
        db.query(Building).filter(Building.zone_id.in_(zone_ids)).all() if zone_ids else []
    )
    bdata = [{"energy_class": b.energy_class, "surface_m2": b.surface_m2} for b in buildings]

    recs = generate_recommendations(indicators, bdata)
    return {"territory_id": territory_id, "count": len(recs), "recommendations": recs}
