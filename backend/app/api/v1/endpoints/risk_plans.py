from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.risk_planner import (
    local_plan_single, local_plan_global, mistral_risk_plan,
    local_plan_daira, local_plan_commune, subdivisions_of,
)
from app.services.risk_pdf import build_single_risk_pdf, build_global_risk_pdf

router = APIRouter(prefix="/risk-plans", tags=["risk-plans"])


def _ctx_single(plan: dict) -> str:
    lines = [f"Territoire : {plan['territoire']} (wilaya {plan['wilaya_code']}), "
             f"zone sismique {plan['zone_sismique']}, risque global {plan['risque_global']}/100."]
    for sc in plan["scénarios"]:
        v = f" ({sc['valeur']}/100)" if sc.get("valeur") is not None else ""
        lines.append(f"- {sc['aléa']} : niveau {sc['niveau']}{v}.")
    return "\n".join(lines)


@router.get("/single/{territory_id}")
def plan_single(territory_id: int, ai: bool = True, db: Session = Depends(get_db)):
    """Scénarios de risques + solutions + plans pour un lieu précis."""
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    plan = local_plan_single(t)
    ai_text = mistral_risk_plan(_ctx_single(plan)) if ai else None
    return {**plan, "ai_plan": ai_text, "ai_available": ai_text is not None}


@router.get("/global")
def plan_global(ai: bool = True, db: Session = Depends(get_db)):
    """Rapport national : risques de toutes les wilayas + priorités."""
    from app.models.territory import Territory
    territories = db.query(Territory).all()
    plan = local_plan_global(territories)
    ctx = (f"Périmètre : {plan['périmètre']}. "
           f"Wilayas les plus risquées : "
           f"{', '.join(w['nom'] for w in plan['wilayas_plus_risquées'][:5])}. "
           f"Zones sismiques élevées : {', '.join(plan['zones_sismiques_élevées'][:8])}.")
    ai_text = mistral_risk_plan(ctx) if ai else None
    return {**plan, "ai_plan": ai_text, "ai_available": ai_text is not None}


@router.get("/single/{territory_id}/pdf")
def plan_single_pdf(territory_id: int, ai: bool = True, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    plan = local_plan_single(t)
    ai_text = mistral_risk_plan(_ctx_single(plan)) if ai else None
    pdf = build_single_risk_pdf(plan, ai_text)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="plan_risques_{t.name}.pdf"'})


@router.get("/global/pdf")
def plan_global_pdf(ai: bool = True, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    territories = db.query(Territory).all()
    plan = local_plan_global(territories)
    ctx = f"Plan national Algérie. Wilayas risquées : {', '.join(w['nom'] for w in plan['wilayas_plus_risquées'][:5])}."
    ai_text = mistral_risk_plan(ctx) if ai else None
    pdf = build_global_risk_pdf(plan, ai_text)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": 'inline; filename="plan_national_risques_algerie.pdf"'})



@router.get("/subdivisions/{territory_id}")
def list_subdivisions(territory_id: int, db: Session = Depends(get_db)):
    """Liste des daïras et communes d'une wilaya (pour les sélecteurs)."""
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    subs = subdivisions_of(t.wilaya_code or "")
    return {"wilaya": t.name, "wilaya_code": (t.wilaya_code or "").zfill(2),
            "dairas": [{"nom": d, "communes": c} for d, c in subs.items()]}


@router.get("/daira/{territory_id}/{daira_name}")
def plan_daira(territory_id: int, daira_name: str, ai: bool = True, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    plan = local_plan_daira(t, daira_name)
    ai_text = mistral_risk_plan(_ctx_single(plan)) if ai else None
    return {**plan, "ai_plan": ai_text, "ai_available": ai_text is not None}


@router.get("/commune/{territory_id}/{commune_name}")
def plan_commune(territory_id: int, commune_name: str, ai: bool = True, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    plan = local_plan_commune(t, commune_name)
    ai_text = mistral_risk_plan(_ctx_single(plan)) if ai else None
    return {**plan, "ai_plan": ai_text, "ai_available": ai_text is not None}


@router.get("/daira/{territory_id}/{daira_name}/pdf")
def plan_daira_pdf(territory_id: int, daira_name: str, ai: bool = True, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    plan = local_plan_daira(t, daira_name)
    ai_text = mistral_risk_plan(_ctx_single(plan)) if ai else None
    pdf = build_single_risk_pdf(plan, ai_text)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="plan_risques_daira_{daira_name}.pdf"'})


@router.get("/commune/{territory_id}/{commune_name}/pdf")
def plan_commune_pdf(territory_id: int, commune_name: str, ai: bool = True, db: Session = Depends(get_db)):
    from app.models.territory import Territory
    t = db.get(Territory, territory_id)
    if not t:
        raise HTTPException(404, "Territoire introuvable")
    plan = local_plan_commune(t, commune_name)
    ai_text = mistral_risk_plan(_ctx_single(plan)) if ai else None
    pdf = build_single_risk_pdf(plan, ai_text)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="plan_risques_commune_{commune_name}.pdf"'})
