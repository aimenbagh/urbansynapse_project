from typing import Optional
from pydantic import BaseModel


class TerritoryBase(BaseModel):
    name: str
    wilaya_code: Optional[str] = None
    population: Optional[int] = None
    area_km2: Optional[float] = None


class TerritoryCreate(TerritoryBase):
    pass


class TerritoryRead(TerritoryBase):
    id: int
    class Config:
        from_attributes = True


class TerritoryStats(BaseModel):
    territory_id: int
    name: str
    population: Optional[int]
    area_km2: Optional[float]
    density: Optional[float]            # hab/km²
    zones_count: int
    buildings_count: int
    avg_building_age: Optional[float]
    avg_energy_class_score: Optional[float]


class ZoneRead(BaseModel):
    id: int
    name: Optional[str]
    land_use: Optional[str]
    class Config:
        from_attributes = True


class BuildingRead(BaseModel):
    id: int
    construction_year: Optional[int]
    floors: Optional[int]
    surface_m2: Optional[float]
    energy_class: Optional[str]
    annual_kwh_m2: Optional[float]
    class Config:
        from_attributes = True
