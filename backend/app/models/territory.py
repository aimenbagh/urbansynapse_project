"""Geospatial domain models: Territory, Zone, Building.

Les colonnes géométriques utilisent app.db.types.Geom() qui s'adapte
automatiquement : vrai type PostGIS sur PostgreSQL, texte sur SQLite.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.db.types import Geom


class Territory(Base):
    __tablename__ = "territories"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    wilaya_code = Column(String, index=True)        # code wilaya (Algérie)
    population = Column(Integer)
    area_km2 = Column(Float)
    center_lon = Column(Float)   # centre pour la carte
    center_lat = Column(Float)
    geom = Column(Geom("MULTIPOLYGON", srid=4326))
    created_at = Column(DateTime, server_default=func.now())
    zones = relationship("Zone", back_populates="territory")


class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True)
    territory_id = Column(Integer, ForeignKey("territories.id"))
    name = Column(String)
    land_use = Column(String)   # résidentiel / tertiaire / industrie / mixte
    geom = Column(Geom("POLYGON", srid=4326))
    territory = relationship("Territory", back_populates="zones")
    buildings = relationship("Building", back_populates="zone")


class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    construction_year = Column(Integer)
    floors = Column(Integer)
    surface_m2 = Column(Float)
    energy_class = Column(String)          # A..G
    annual_kwh_m2 = Column(Float)          # consommation énergétique
    geom = Column(Geom("POLYGON", srid=4326))
    zone = relationship("Zone", back_populates="buildings")
