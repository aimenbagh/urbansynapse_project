from sqlalchemy import Column, Integer, String, Boolean
from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst")  # admin / planner / analyst
    is_active = Column(Boolean, default=True)
