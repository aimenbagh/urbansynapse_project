from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, Float
from app.db.session import Base


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True, nullable=True)  # propriétaire
    title = Column(String, nullable=False)
    territory_id = Column(Integer)
    territory_name = Column(String)
    # instantané des données réelles au moment de la génération
    population = Column(Integer)
    energy_performance = Column(Float)
    risk_global = Column(Integer)
    pdf_data = Column(LargeBinary, nullable=False)   # le PDF généré
    size_bytes = Column(Integer, default=0)
    generated_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
