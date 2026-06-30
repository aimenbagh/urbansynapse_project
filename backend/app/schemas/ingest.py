"""Schémas pour l'ajout de données (territoires, zones, bâtiments, indicateurs)."""
from typing import Optional
from pydantic import BaseModel, Field


class TerritoryCreateIn(BaseModel):
    name: str
    wilaya_code: Optional[str] = None
    population: Optional[int] = None
    area_km2: Optional[float] = None
    center_lon: Optional[float] = None   # pour positionner sur la carte
    center_lat: Optional[float] = None


class BuildingIn(BaseModel):
    construction_year: Optional[int] = None
    floors: Optional[int] = Field(default=1, ge=1)
    surface_m2: Optional[float] = Field(default=100, gt=0)
    energy_class: str = "D"
    annual_kwh_m2: Optional[float] = None


class ZoneCreateIn(BaseModel):
    territory_id: int
    name: str
    land_use: str = "mixte"
    center_lon: Optional[float] = None
    center_lat: Optional[float] = None
    buildings_count: int = Field(default=5, ge=0, le=50)
    buildings: Optional[list[BuildingIn]] = None  # sinon générés aléatoirement


class IndicatorIn(BaseModel):
    territory_id: int
    key: str
    value: float
    unit: str = "%"


class EnergyBalanceIn(BaseModel):
    """Import d'un bilan énergétique : un lot d'indicateurs pour un territoire."""
    territory_id: int
    year: Optional[int] = None
    energy_performance: Optional[float] = None
    resilience: Optional[float] = None
    air_quality: Optional[float] = None
    co2_avoided: Optional[float] = None
    renewable_share: Optional[float] = None
