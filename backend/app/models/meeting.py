from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.time import utc_now


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    host_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id = Column(String(20), unique=True, nullable=False)
    passcode = Column(String(20), nullable=False)
    invite_link = Column(String(500), nullable=False)
    # status: scheduled | active | ended
    status = Column(String(20), nullable=False, default="scheduled")
    is_instant = Column(Boolean, nullable=False, default=False)
    start_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=40)
    time_zone = Column(String(100), nullable=False, default="Asia/Kolkata")
    is_recurring = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    host = relationship("User", backref="hosted_meetings")
    participants = relationship(
        "Participant", back_populates="meeting", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_meetings_host_id", "host_id"),
        Index("ix_meetings_meeting_id", "meeting_id"),
        Index("ix_meetings_status", "status"),
        Index("ix_meetings_start_time", "start_time"),
    )
