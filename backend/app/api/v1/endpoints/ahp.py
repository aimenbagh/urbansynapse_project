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
