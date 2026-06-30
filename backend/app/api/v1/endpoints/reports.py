"""Génération et export de rapports de synthèse."""
from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.report import build_report
from app.services.report_pdf import build_report_pdf
from fastapi.responses import Response
from app.services.planning import generate_recommendations

router = APIRouter(prefix="/reports", tags=["reports"])


def _collect(territory_id: int, db: Session):
    from app.models.territory import Territory, Zone, Building
    from app.models.indicator import Indicator

    t = db.get(Territory, territory_id)
    name = t.name if t else f"Territoire {territory_id}"
    zones = db.query(Zone).filter(Zone.territory_id == territory_id).all()
    zone_ids = [z.id for z in zones]
    buildings = db.query(Building).filter(Building.zone_id.in_(zone_ids)).all() if zone_ids else []
    indicators = {i.key: i.value for i in
                  db.query(Indicator).filter(Indicator.territory_id == territory_id).all()}

    from datetime import datetime
    year = datetime.now().year
    ages = [year - b.construction_year for b in buildings if b.construction_year]
    stats = {
        "population": t.population if t else None,
        "density": round(t.population / t.area_km2, 1) if t and t.population and t.area_km2 else None,
        "zones_count": len(zones),
        "buildings_count": len(buildings),
        "avg_building_age": round(sum(ages) / len(ages), 1) if ages else None,
    }
    bdata = [{"energy_class": b.energy_class, "surface_m2": b.surface_m2} for b in buildings]
    recs = generate_recommendations(indicators, bdata)
    return name, stats, indicators, recs


@router.get("/{territory_id}", response_class=PlainTextResponse)
def generate(territory_id: int, db: Session = Depends(get_db)):
    """Renvoie un rapport Markdown de synthèse du territoire."""
    name, stats, indicators, recs = _collect(territory_id, db)
    md = build_report(name, stats, indicators, recs)
    return PlainTextResponse(md, headers={
        "Content-Disposition": f'attachment; filename="rapport_{name}.md"'
    })


@router.get("/{territory_id}/pdf")
def generate_pdf(territory_id: int, db: Session = Depends(get_db)):
    """Renvoie le rapport de synthèse au format PDF."""
    name, stats, indicators, recs = _collect(territory_id, db)
    pdf_bytes = build_report_pdf(name, stats, indicators, recs)
    return Response(
        content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="rapport_{name}.pdf"'},
    )
