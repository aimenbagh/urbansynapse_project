"""Génération et export de rapports de synthèse."""
from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
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


def _report_meta(r) -> dict:
    return {
        "id": r.id, "title": r.title,
        "territory_id": r.territory_id, "territory_name": r.territory_name,
        "population": r.population, "energy_performance": r.energy_performance,
        "risk_global": r.risk_global, "size_bytes": r.size_bytes,
        "generated_by": r.generated_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("")
def list_reports(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Liste les rapports de l'utilisateur courant."""
    from app.models.report import Report
    reports = db.query(Report).filter(Report.user_id == user.id).order_by(Report.created_at.desc()).all()
    return [_report_meta(r) for r in reports]


@router.post("/{territory_id}/generate")
def generate_and_save(territory_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Génère un rapport PDF avec les données réelles ET le sauvegarde."""
    from app.models.report import Report
    from app.models.territory import Territory

    name, stats, indicators, recs = _collect(territory_id, db)
    pdf_bytes = build_report_pdf(name, stats, indicators, recs)

    # Instantané des données réelles
    t = db.get(Territory, territory_id)
    # récupérer performance/risque via le profil
    try:
        from app.api.v1.endpoints.profile import territory_profile
        prof = territory_profile(territory_id, db)
        perf = prof.get("energy_performance")
        risk = prof.get("risk", {}).get("global")
    except Exception:
        perf, risk = None, None

    from datetime import datetime
    title = f"Rapport {name} — {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    report = Report(
        title=title, territory_id=territory_id, territory_name=name,
        population=(t.population if t else None),
        energy_performance=perf, risk_global=risk,
        pdf_data=pdf_bytes, size_bytes=len(pdf_bytes),
        generated_by=user.email, user_id=user.id,
    )
    db.add(report); db.commit(); db.refresh(report)
    return _report_meta(report)


@router.get("/saved/{report_id}/content")
def get_saved_report(report_id: int, download: bool = False, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Affiche (inline) ou télécharge un rapport sauvegardé (le sien)."""
    from app.models.report import Report
    from fastapi import HTTPException
    r = db.get(Report, report_id)
    if not r or r.user_id != user.id:
        raise HTTPException(404, "Rapport introuvable")
    disp = "attachment" if download else "inline"
    return Response(
        content=r.pdf_data, media_type="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="rapport_{r.territory_name}.pdf"'},
    )


@router.delete("/saved/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Supprime un rapport sauvegardé (le sien)."""
    from app.models.report import Report
    from fastapi import HTTPException
    r = db.get(Report, report_id)
    if not r or r.user_id != user.id:
        raise HTTPException(404, "Rapport introuvable")
    db.delete(r); db.commit()
    return {"message": "Rapport supprimé", "id": report_id}
