"""Données nationales de référence (calibrées sur les bilans algériens)."""
from fastapi import APIRouter
from app.services import algeria_data as ad

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/algeria")
def algeria_reference():
    """Constantes et séries de référence pour l'Algérie."""
    return {
        "co2_per_kwh": ad.CO2_PER_KWH,
        "price_per_kwh_da": ad.PRICE_PER_KWH_DA,
        "renewable_target_2030_pct": ad.RENEWABLE_TARGET_2030_PCT,
        "sector_consumption_pct": ad.SECTOR_CONSUMPTION_PCT,
        "class_baseline_kwh_m2": ad.CLASS_BASELINE_KWH_M2,
        "electricity_production": ad.ELECTRICITY_PRODUCTION,
    }
