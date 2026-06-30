from typing import Optional
from pydantic import BaseModel


class ScenarioCreate(BaseModel):
    territory_id: int
    name: str
    description: Optional[str] = None
    parameters: dict


class ScenarioRead(BaseModel):
    id: int
    name: str
    performance: Optional[float] = None
    results: Optional[dict] = None
    class Config:
        from_attributes = True
