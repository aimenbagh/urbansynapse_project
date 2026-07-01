from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")          # "admin" ou "user"
    is_active = Column(Boolean, default=True)        # False = compte bloqué
    suspended_until = Column(DateTime, nullable=True)  # suspension temporaire
    created_at = Column(DateTime, default=datetime.utcnow)

    def is_suspended(self) -> bool:
        return self.suspended_until is not None and self.suspended_until > datetime.utcnow()
