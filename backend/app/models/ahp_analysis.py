from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from app.db.session import Base


class AhpAnalysis(Base):
    __tablename__ = "ahp_analyses"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True, nullable=True)
    name = Column(String, nullable=False)
    criteria = Column(JSON)          # liste des critères
    matrix = Column(JSON)            # matrice de comparaison
    weights = Column(JSON)           # poids calculés {critère: poids}
    consistency_ratio = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
