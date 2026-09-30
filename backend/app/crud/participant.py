from sqlalchemy.orm import Session

from app.models.participant import Participant
from app.schemas.participant import ParticipantCreate
from app.time import utc_now


def list_participants(db: Session, meeting_pk: int) -> list[Participant]:
    """Return all currently active (not yet left) participants."""
    return (
        db.query(Participant)
        .filter(
            Participant.meeting_id == meeting_pk,
            Participant.left_at.is_(None),
        )
        .all()
    )


def add_participant(
    db: Session,
    meeting_pk: int,
    data: ParticipantCreate,
    role: str = "participant",
) -> Participant:
    p = Participant(
        meeting_id=meeting_pk,
        user_id=data.user_id,
        display_name=data.display_name,
        role=role,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def get_participant(db: Session, participant_id: int) -> Participant | None:
    return db.query(Participant).filter(Participant.id == participant_id).first()


def remove_participant(db: Session, participant: Participant) -> None:
    """Soft-delete: set left_at timestamp."""
    participant.left_at = utc_now()
    db.commit()


def toggle_mute(db: Session, participant: Participant) -> Participant:
    participant.is_muted = not participant.is_muted
    db.commit()
    db.refresh(participant)
    return participant


def mute_all_participants(db: Session, meeting_pk: int) -> int:
    """Mute every non-host active participant. Returns row count."""
    count = (
        db.query(Participant)
        .filter(
            Participant.meeting_id == meeting_pk,
            Participant.left_at.is_(None),
            Participant.role == "participant",
        )
        .update({"is_muted": True}, synchronize_session="fetch")
    )
    db.commit()
    return count
