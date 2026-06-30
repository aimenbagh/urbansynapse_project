"""KPIs & simulation scenarios."""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, func
from app.db.session import Base


class Indicator(Base):
    __tablename__ = "indicators"
    id = Column(Integer, primary_key=True)
    territory_id = Column(Integer, ForeignKey("territories.id"))
    key = Column(String, index=True)   # energy_performance, resilience, air_quality...
    value = Column(Float)
    unit = Column(String)
    recorded_at = Column(DateTime, server_default=func.now())


class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True)
    territory_id = Column(Integer, ForeignKey("territories.id"))
    name = Column(String)
    description = Column(String)
    parameters = Column(JSON)   # input levers
    results = Column(JSON)      # computed outputs
    performance = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
