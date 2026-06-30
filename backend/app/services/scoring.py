"""Scoring territorial multicritère.

Deux approches disponibles :
- weighted_score : somme pondérée avec poids par défaut (rapide, rétro-compatible)
- via app.services.ahp : pondération dérivée d'une matrice AHP (justifiée, vérifiable)
"""
from dataclasses import dataclass
from typing import Dict, Optional


# Poids par défaut — calibrés pour le contexte urbain algérien (somme = 1.0)
DEFAULT_WEIGHTS: Dict[str, float] = {
    "energy_performance": 0.30,
    "resilience": 0.20,
    "air_quality": 0.15,
    "green_surface": 0.15,
    "mobility": 0.10,
    "density": 0.10,
}


@dataclass
class ScoringResult:
    global_score: float
    breakdown: Dict[str, float]


def weighted_score(criteria: Dict[str, float],
                   weights: Optional[Dict[str, float]] = None) -> ScoringResult:
    """Normalise (0-100) les critères et applique une somme pondérée."""
    weights = weights or DEFAULT_WEIGHTS
    breakdown = {k: round(criteria.get(k, 0.0) * weights.get(k, 0.0), 2)
                 for k in weights}
    return ScoringResult(global_score=round(sum(breakdown.values()), 2),
                         breakdown=breakdown)
