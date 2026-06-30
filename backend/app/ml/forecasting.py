"""Projection prospective des indicateurs (modèle ML de tendance).

Entraîne une régression (linéaire + polynomiale) sur les séries historiques
réelles issues des bilans énergétiques nationaux algériens, puis projette
les valeurs futures (2025→2035). Sert de socle quantitatif au module de
planification prospective.
"""
from __future__ import annotations
import json
import os
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.metrics import r2_score

_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "processed", "algeria_timeseries.json",
)


def _load_series() -> tuple[list[int], list[float]]:
    """Charge la série historique réelle ; repli minimal si fichier absent."""
    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            d = json.load(f)
        return d["years"], d["electricity_consumption_gwh"]
    except (FileNotFoundError, KeyError):
        years = list(range(2000, 2025))
        vals = [7404 + i * 700 for i in range(25)]
        return years, vals


def forecast_series(target_year: int = 2035, degree: int = 2) -> dict:
    """Projette la consommation électrique nationale jusqu'à target_year.

    Renvoie historique + projection + qualité d'ajustement (R²) + croissance.
    """
    years, values = _load_series()
    X = np.array(years).reshape(-1, 1)
    y = np.array(values, dtype=float)

    model = make_pipeline(PolynomialFeatures(degree), LinearRegression())
    model.fit(X, y)
    r2 = round(r2_score(y, model.predict(X)), 4)

    last = years[-1]
    future_years = list(range(last + 1, target_year + 1))
    future_X = np.array(future_years).reshape(-1, 1)
    future_y = [round(float(v), 1) for v in model.predict(future_X)]

    cagr = None
    if values[0] > 0 and len(values) > 1:
        n = years[-1] - years[0]
        cagr = round(((values[-1] / values[0]) ** (1 / n) - 1) * 100, 2)

    return {
        "metric": "Consommation électrique nationale (GWh)",
        "history": [{"year": y_, "value": v_} for y_, v_ in zip(years, values)],
        "forecast": [{"year": y_, "value": v_} for y_, v_ in zip(future_years, future_y)],
        "r2": r2,
        "historical_cagr_pct": cagr,
        "model": f"Régression polynomiale (degré {degree})",
    }


def project_indicator(current: float, annual_change_pct: float,
                      horizon_years: int) -> list[dict]:
    """Projette un indicateur territorial (ex: performance énergétique) année
    par année selon un taux d'évolution annuel donné (scénario)."""
    out = []
    val = current
    base_year = 2025
    for i in range(horizon_years + 1):
        out.append({"year": base_year + i, "value": round(val, 1)})
        val = min(val * (1 + annual_change_pct / 100), 100)
    return out
