from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.indicator import IndicatorRead

router = APIRouter(prefix="/indicators", tags=["indicators"])


@router.get("/", response_model=list[IndicatorRead])
def list_indicators(territory_id: int | None = None, db: Session = Depends(get_db)):
    from app.models.indicator import Indicator
    q = db.query(Indicator)
    if territory_id:
        q = q.filter(Indicator.territory_id == territory_id)
    return q.all()
