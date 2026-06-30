from pydantic import BaseModel


class IndicatorRead(BaseModel):
    key: str
    value: float
    unit: str
    class Config:
        from_attributes = True
