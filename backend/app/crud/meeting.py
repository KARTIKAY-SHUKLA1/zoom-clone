from sqlalchemy.orm import Session

from app.config import settings
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingCreate, MeetingUpdate
from app.services.meeting_service import (
    generate_invite_link,
    generate_meeting_id,
    generate_passcode,
)
from app.time import utc_now

# ── helpers ───────────────────────────────────────────────────────────────────


def _unique_meeting_id(db: Session) -> str:
    """Generate a collision-free 11-digit meeting ID."""
    mid = generate_meeting_id()
    while db.query(Meeting).filter(Meeting.meeting_id == mid).first():
        mid = generate_meeting_id()
    return mid


# ── create ────────────────────────────────────────────────────────────────────


def create_scheduled_meeting(db: Session, data: MeetingCreate, host_id: int) -> Meeting:
    mid = _unique_meeting_id(db)
    meeting = Meeting(
        title=data.title,
        description=data.description,
        host_id=host_id,
        meeting_id=mid,
        passcode=generate_passcode(),
        invite_link=generate_invite_link(mid, settings.frontend_url),
        status="scheduled",
        is_instant=False,
        start_time=data.start_time,
        duration_minutes=data.duration_minutes,
        time_zone=data.time_zone,
        is_recurring=data.is_recurring,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def create_instant_meeting(db: Session, host_id: int) -> Meeting:
    mid = _unique_meeting_id(db)
    meeting = Meeting(
        title="My Meeting",
        description=None,
        host_id=host_id,
        meeting_id=mid,
        passcode=generate_passcode(),
        invite_link=generate_invite_link(mid, settings.frontend_url),
        status="active",
        is_instant=True,
        start_time=utc_now(),
        duration_minutes=40,
        time_zone="Asia/Kolkata",
        is_recurring=False,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ── read ──────────────────────────────────────────────────────────────────────


def get_meeting_by_pk(db: Session, meeting_pk: int) -> Meeting | None:
    return db.query(Meeting).filter(Meeting.id == meeting_pk).first()


def get_meeting_by_meeting_id(db: Session, meeting_id: str) -> Meeting | None:
    return db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()


def list_upcoming(db: Session, host_id: int) -> list[Meeting]:
    return (
        db.query(Meeting)
        .filter(
            Meeting.host_id == host_id,
            Meeting.status.in_(["scheduled", "active"]),
        )
        .order_by(Meeting.start_time.asc())
        .all()
    )


def list_previous(db: Session, host_id: int) -> list[Meeting]:
    return (
        db.query(Meeting)
        .filter(Meeting.host_id == host_id, Meeting.status == "ended")
        .order_by(Meeting.start_time.desc())
        .all()
    )


# ── update ────────────────────────────────────────────────────────────────────


def update_meeting(db: Session, meeting: Meeting, data: MeetingUpdate) -> Meeting:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(meeting, field, value)
    meeting.updated_at = utc_now()
    db.commit()
    db.refresh(meeting)
    return meeting


def update_status(db: Session, meeting: Meeting, status: str) -> Meeting:
    allowed = {"scheduled", "active", "ended"}
    if status not in allowed:
        raise ValueError(f"status must be one of {allowed}")
    meeting.status = status
    meeting.updated_at = utc_now()
    if status == "ended":
        for participant in meeting.participants:
            if participant.left_at is None:
                participant.left_at = meeting.updated_at
    db.commit()
    db.refresh(meeting)
    return meeting


# ── delete ────────────────────────────────────────────────────────────────────


def delete_meeting(db: Session, meeting: Meeting) -> None:
    db.delete(meeting)
    db.commit()
