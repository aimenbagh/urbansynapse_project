from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.ahp import compute_ahp, score_with_weights

router = APIRouter(prefix="/ahp", tags=["ahp"])


class AHPRequest(BaseModel):
    criteria: list[str] = Field(..., json_schema_extra={
        "example": ["energie", "resilience", "air", "mobilite"]})
    matrix: list[list[float]] = Field(..., description="Matrice de comparaison par paires (1-9)")


@router.post("/weights")
def ahp_weights(payload: AHPRequest):
    """Calcule les poids AHP et le ratio de cohérence à partir d'une matrice."""
    try:
        r = compute_ahp(payload.criteria, payload.matrix)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {
        "weights": r.weights,
        "lambda_max": r.lambda_max,
        "consistency_index": r.consistency_index,
        "consistency_ratio": r.consistency_ratio,
        "is_consistent": r.is_consistent,
    }


class AHPScoreRequest(AHPRequest):
    values: dict[str, float] = Field(..., description="Valeurs 0-100 par critère")


@router.post("/score")
def ahp_score(payload: AHPScoreRequest):
    """Calcule les poids AHP puis le score global pondéré des valeurs fournies."""
    try:
        r = compute_ahp(payload.criteria, payload.matrix)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {
        "weights": r.weights,
        "consistency_ratio": r.consistency_ratio,
        "is_consistent": r.is_consistent,
        "global_score": score_with_weights(payload.values, r.weights),
    }


# ---- Sauvegarde des analyses AHP (par utilisateur) ----
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from fastapi import Depends


class AhpSavePayload(BaseModel):
    name: str
    criteria: list
    matrix: list
    weights: dict
    consistency_ratio: float | None = None


def _ahp_meta(a):
    return {
        "id": a.id, "name": a.name, "criteria": a.criteria,
        "matrix": a.matrix, "weights": a.weights,
        "consistency_ratio": a.consistency_ratio,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.post("/save")
def save_ahp(payload: AhpSavePayload, db: Session = Depends(get_db),
             user=Depends(get_current_user)):
    from app.models.ahp_analysis import AhpAnalysis
    a = AhpAnalysis(user_id=user.id, name=payload.name, criteria=payload.criteria,
                    matrix=payload.matrix, weights=payload.weights,
                    consistency_ratio=payload.consistency_ratio)
    db.add(a); db.commit(); db.refresh(a)
    return _ahp_meta(a)


@router.get("/saved")
def list_ahp(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from app.models.ahp_analysis import AhpAnalysis
    rows = db.query(AhpAnalysis).filter(AhpAnalysis.user_id == user.id)\
             .order_by(AhpAnalysis.created_at.desc()).all()
    return [_ahp_meta(a) for a in rows]


@router.delete("/saved/{analysis_id}")
def delete_ahp(analysis_id: int, db: Session = Depends(get_db),
               user=Depends(get_current_user)):
    from app.models.ahp_analysis import AhpAnalysis
    a = db.get(AhpAnalysis, analysis_id)
    if not a or a.user_id != user.id:
        raise HTTPException(404, "Analyse introuvable")
    db.delete(a); db.commit()
    return {"deleted": analysis_id}
