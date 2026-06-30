"""Analyse multicritère hiérarchique (AHP - Saaty).

Implémente la méthode AHP : à partir d'une matrice de comparaison par paires
des critères, calcule les poids (vecteur propre principal approché) et le
ratio de cohérence (CR). Un CR <= 0.10 indique un jugement cohérent.

Cela remplace la pondération fixe par une pondération justifiée et vérifiable,
conformément à l'exigence de "modélisation multicritère" de la plateforme.
"""
from __future__ import annotations
from dataclasses import dataclass

# Indice de cohérence aléatoire de Saaty (Random Index) selon n
_RANDOM_INDEX = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12,
                 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}


@dataclass
class AHPResult:
    criteria: list[str]
    weights: dict[str, float]      # somme = 1
    lambda_max: float
    consistency_index: float       # CI
    consistency_ratio: float       # CR
    is_consistent: bool            # CR <= 0.10


def _normalize_columns(matrix: list[list[float]]) -> list[list[float]]:
    n = len(matrix)
    col_sums = [sum(matrix[i][j] for i in range(n)) for j in range(n)]
    return [[matrix[i][j] / col_sums[j] for j in range(n)] for i in range(n)]


def compute_ahp(criteria: list[str], matrix: list[list[float]]) -> AHPResult:
    """matrix[i][j] = importance du critère i par rapport à j (échelle 1-9).

    La diagonale vaut 1 et matrix[j][i] = 1 / matrix[i][j].
    """
    n = len(criteria)
    if any(len(row) != n for row in matrix):
        raise ValueError("La matrice doit être carrée de taille len(criteria).")

    # Poids = moyenne des lignes de la matrice normalisée par colonnes
    norm = _normalize_columns(matrix)
    weights_list = [sum(norm[i]) / n for i in range(n)]
    weights = {criteria[i]: round(weights_list[i], 4) for i in range(n)}

    # lambda_max via le vecteur (matrice x poids) / poids
    weighted_sums = [sum(matrix[i][j] * weights_list[j] for j in range(n))
                     for i in range(n)]
    lambda_max = sum(weighted_sums[i] / weights_list[i] for i in range(n)) / n

    ci = (lambda_max - n) / (n - 1) if n > 1 else 0.0
    ri = _RANDOM_INDEX.get(n, 1.49)
    cr = ci / ri if ri > 0 else 0.0

    return AHPResult(
        criteria=criteria, weights=weights,
        lambda_max=round(lambda_max, 4),
        consistency_index=round(ci, 4),
        consistency_ratio=round(cr, 4),
        is_consistent=cr <= 0.10,
    )


def score_with_weights(criteria_values: dict[str, float],
                       weights: dict[str, float]) -> float:
    """Score global 0-100 = somme pondérée des valeurs par les poids AHP."""
    return round(sum(criteria_values.get(k, 0.0) * w
                     for k, w in weights.items()), 2)
