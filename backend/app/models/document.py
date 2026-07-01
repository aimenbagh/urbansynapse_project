from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from app.db.session import Base


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)   # mime type
    file_type = Column(String, nullable=False)       # pdf / word / excel
    size_bytes = Column(Integer, default=0)
    data = Column(LargeBinary, nullable=False)       # contenu binaire du fichier
    uploaded_by = Column(String)                     # email de l'admin
    created_at = Column(DateTime, default=datetime.utcnow)
