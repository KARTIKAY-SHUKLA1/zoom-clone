from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base
from app.time import utc_now


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    personal_meeting_id = Column(String(20), unique=True, nullable=False, index=True)
    avatar_initials = Column(String(5), nullable=False)
    plan = Column(String(50), nullable=False, default="Workplace Basic")
    created_at = Column(DateTime, nullable=False, default=utc_now)
