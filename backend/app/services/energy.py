"""Simulation énergétique du bâti et agrégation territoriale.

Cœur scientifique de la plateforme : évaluer la rénovation énergétique du
bâti existant à l'échelle du bâtiment PUIS agréger à l'échelle du territoire,
avec estimation des économies, des émissions de CO2 évitées, du coût et du
retour sur investissement (ROI). Les valeurs de référence sont indicatives et
à calibrer avec les bilans énergétiques nationaux algériens.
"""
from __future__ import annotations

from app.services.algeria_data import (
    CLASS_BASELINE_KWH_M2 as CLASS_BASELINE,
    CO2_PER_KWH, PRICE_PER_KWH_DA as PRICE_PER_KWH,
)

# Gain de réduction par mesure de rénovation (multiplicatif)
RETROFIT_GAIN = {"insulation": 0.25, "glazing": 0.12, "hvac": 0.18, "solar_pv": 0.20}

# Coût indicatif de la mesure en DA/m² (dinar algérien)
RETROFIT_COST = {"insulation": 4500, "glazing": 6000, "hvac": 5500, "solar_pv": 9000}


def estimate_consumption(surface_m2: float, energy_class: str) -> float:
    return surface_m2 * CLASS_BASELINE.get(energy_class, 300)


def _combined_factor(measures: list[str]) -> float:
    factor = 1.0
    for m in measures:
        factor *= (1 - RETROFIT_GAIN.get(m, 0.0))
    return factor


def simulate_retrofit(surface_m2: float, energy_class: str,
                      measures: list[str]) -> dict:
    """Simulation complète d'une rénovation au niveau d'un bâtiment.

    Renvoie économies d'énergie, CO2 évité, coût des travaux, gain annuel
    et retour sur investissement (en années).
    """
    before = estimate_consumption(surface_m2, energy_class)
    factor = _combined_factor(measures)
    after = before * factor
    saved_kwh = before - after

    co2_avoided_kg = saved_kwh * CO2_PER_KWH
    annual_savings_da = saved_kwh * PRICE_PER_KWH
    invest_da = sum(RETROFIT_COST.get(m, 0) for m in measures) * surface_m2
    roi_years = round(invest_da / annual_savings_da, 1) if annual_savings_da > 0 else None

    return {
        "before_kwh": round(before, 1),
        "after_kwh": round(after, 1),
        "saved_kwh": round(saved_kwh, 1),
        "reduction_pct": round((1 - factor) * 100, 1),
        "co2_avoided_kg": round(co2_avoided_kg, 1),
        "annual_savings_da": round(annual_savings_da, 1),
        "investment_da": round(invest_da, 1),
        "roi_years": roi_years,
    }


def aggregate_territory_retrofit(buildings: list[dict],
                                 measures: list[str]) -> dict:
    """Agrège la rénovation sur un ensemble de bâtiments (échelle territoire).

    `buildings` : liste de dicts {surface_m2, energy_class}.
    Concrétise l'analyse multi-échelles : bâtiment -> territoire.
    """
    total_before = total_after = total_co2 = total_invest = total_savings = 0.0
    count = 0
    for b in buildings:
        s = b.get("surface_m2") or 0
        cls = b.get("energy_class") or "D"
        if s <= 0:
            continue
        r = simulate_retrofit(s, cls, measures)
        total_before += r["before_kwh"]
        total_after += r["after_kwh"]
        total_co2 += r["co2_avoided_kg"]
        total_invest += r["investment_da"]
        total_savings += r["annual_savings_da"]
        count += 1

    saved = total_before - total_after
    roi = round(total_invest / total_savings, 1) if total_savings > 0 else None
    return {
        "buildings_count": count,
        "total_before_kwh": round(total_before, 1),
        "total_after_kwh": round(total_after, 1),
        "total_saved_kwh": round(saved, 1),
        "reduction_pct": round((saved / total_before * 100), 1) if total_before else 0,
        "total_co2_avoided_t": round(total_co2 / 1000, 1),     # en tonnes
        "total_investment_da": round(total_invest, 1),
        "total_annual_savings_da": round(total_savings, 1),
        "roi_years": roi,
    }
