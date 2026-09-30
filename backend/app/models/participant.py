from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.time import utc_now


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    display_name = Column(String(100), nullable=False)
    # role: host | participant
    role = Column(String(20), nullable=False, default="participant")
    is_muted = Column(Boolean, nullable=False, default=False)
    is_video_off = Column(Boolean, nullable=False, default=False)
    joined_at = Column(DateTime, nullable=False, default=utc_now)
    left_at = Column(DateTime, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", backref="participations")

    __table_args__ = (
        Index("ix_participants_meeting_id", "meeting_id"),
        Index("ix_participants_user_id", "user_id"),
    )
