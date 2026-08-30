"""Génération et export de rapports de synthèse."""
from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.services.report import build_report
from app.services.report_pdf import build_report_pdf
from app.services.full_report_pdf import build_full_report_pdf
from app.services.assistant_pdf import build_assistant_pdf
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



def _profile_for_pdf(territory_id: int, db):
    """Récupère profil + analyse détaillée (risques/résilience/mobilité) pour le PDF."""
    from app.models.territory import Territory
    from app.data.risks_data import risk_profile
    from app.data.resilience_data import resilience_profile
    from app.data.mobility_data import mobility_profile
    out = {}
    try:
        from app.api.v1.endpoints.profile import territory_profile
        prof = territory_profile(territory_id, db)
        out["energy_performance"] = prof.get("energy_performance")
        out["risk_global"] = prof.get("risk", {}).get("global")
    except Exception:
        pass
    try:
        t = db.get(Territory, territory_id)
        wc = (t.wilaya_code or "").zfill(2)
        lat = t.center_lat or 36; pop = t.population or 0; area = t.area_km2 or 1
        eperf = out.get("energy_performance", 70) or 70
        risks = risk_profile(wc, lat, pop, area)
        resil = resilience_profile(wc, lat, pop, area, eperf)
        mob = mobility_profile(wc, pop, area)
        out["seismic_zone"] = risks["seismic_zone"]
        out["hazards"] = risks["hazards"]
        out["resilience_global"] = resil["global"]
        out["resilience_dimensions"] = resil["dimensions"]
        out["transport_coverage"] = mob["transport_coverage"]
        out["pedestrian"] = mob["pedestrian"]
        out["modal_split"] = mob["modal_split"]
    except Exception:
        pass
    return out



def _collect_full(territory_id: int, db: Session) -> dict:
    """Rassemble TOUT le contenu analytique du site pour le rapport complet."""
    from app.models.territory import Territory
    from app.data.risks_data import risk_profile
    from app.data.resilience_data import resilience_profile
    from app.data.mobility_data import mobility_profile
    from app.data.energy_data import energy_distribution, estimate_buildings
    t = db.get(Territory, territory_id)
    name = t.name if t else f"Territoire {territory_id}"
    wc = (t.wilaya_code or "").zfill(2) if t else "16"
    lat = t.center_lat or 36; pop = t.population or 0; area = t.area_km2 or 1
    try:
        from app.api.v1.endpoints.profile import territory_profile, dashboard_data
        prof = territory_profile(territory_id, db)
        eperf = round(prof.get("energy_performance", 70))
        dash = dashboard_data(territory_id, db)
        dashboard = dash["kpis"]
    except Exception:
        eperf = 70; dashboard = {}
    risks = risk_profile(wc, lat, pop, area)
    resil = resilience_profile(wc, lat, pop, area, eperf)
    mob = mobility_profile(wc, pop, area)
    try:
        raw = energy_distribution(wc, estimate_buildings(pop))
        items = raw.get("distribution", [])
        total = raw.get("total_buildings", 1) or 1
        dist = [{"class": x["classe"], "count": x["count"],
                 "pct": round(x["count"] / total * 100)} for x in items]
    except Exception:
        dist = []
    return {
        "name": name,
        "dashboard": dashboard,
        "energy": {"performance": eperf, "distribution": dist},
        "risks": {"seismic_zone": risks["seismic_zone"], "global": risks["global"], "hazards": risks["hazards"]},
        "resilience": {"global": resil["global"], "dimensions": resil["dimensions"]},
        "mobility": {"transport_coverage": mob["transport_coverage"], "pedestrian": mob["pedestrian"], "modal_split": mob["modal_split"]},
    }


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
    """Rapport de l'ASSISTANT (4 étapes uniquement)."""
    from app.models.territory import Territory
    from app.services.planning import generate_recommendations
    t = db.get(Territory, territory_id)
    name = t.name if t else f"Territoire {territory_id}"
    try:
        from app.api.v1.endpoints.profile import territory_profile
        prof = territory_profile(territory_id, db)
    except Exception:
        prof = {"energy_performance": 70, "risk": {"global": 50}, "population": None}
    # recommandations
    try:
        _, _, indicators, recs = _collect(territory_id, db)
    except Exception:
        recs = []
    pdf_bytes = build_assistant_pdf(name, prof, recs)
    return Response(
        content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="assistant_{name}.pdf"'},
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

    full = _collect_full(territory_id, db)
    pdf_bytes = build_full_report_pdf(full)
    name = full["name"]

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
