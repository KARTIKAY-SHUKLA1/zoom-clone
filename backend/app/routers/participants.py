from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import participant as crud_p
from app.crud.meeting import get_meeting_by_pk
from app.crud.user import get_user
from app.database import get_db
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantMuteUpdate,
    ParticipantOut,
)

router = APIRouter(
    prefix="/api/meetings/{meeting_pk}/participants",
    tags=["participants"],
)


def _get_meeting_or_404(meeting_pk: int, db: Session):
    m = get_meeting_by_pk(db, meeting_pk)
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return m


# ── GET list ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[ParticipantOut])
def list_participants(meeting_pk: int, db: Session = Depends(get_db)):
    _get_meeting_or_404(meeting_pk, db)
    return crud_p.list_participants(db, meeting_pk)


# ── POST join ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=ParticipantOut, status_code=201)
def join_meeting(
    meeting_pk: int, data: ParticipantCreate, db: Session = Depends(get_db)
):
    m = _get_meeting_or_404(meeting_pk, db)
    if m.status == "ended":
        raise HTTPException(status_code=400, detail="This meeting has already ended.")
    if data.user_id is not None:
        if not get_user(db, data.user_id):
            raise HTTPException(status_code=404, detail="User not found.")
        for participant in crud_p.list_participants(db, meeting_pk):
            if participant.user_id == data.user_id:
                return participant
    role = "host" if data.user_id == m.host_id else "participant"
    return crud_p.add_participant(db, meeting_pk, data, role=role)


# ── POST mute-all (MUST come before /{participant_id} to avoid route conflict) ─
@router.post("/mute-all")
def mute_all(meeting_pk: int, db: Session = Depends(get_db)):
    _get_meeting_or_404(meeting_pk, db)
    count = crud_p.mute_all_participants(db, meeting_pk)
    return {"message": f"Muted {count} participant(s)."}


# ── DELETE remove participant ─────────────────────────────────────────────────
@router.delete("/{participant_id}", status_code=204)
@router.post("/{participant_id}/leave", status_code=204)
def remove_participant(
    meeting_pk: int, participant_id: int, db: Session = Depends(get_db)
):
    _get_meeting_or_404(meeting_pk, db)
    p = crud_p.get_participant(db, participant_id)
    if not p or p.meeting_id != meeting_pk or p.left_at is not None:
        raise HTTPException(status_code=404, detail="Participant not found.")
    crud_p.remove_participant(db, p)


# ── PATCH toggle mute ─────────────────────────────────────────────────────────
@router.patch("/{participant_id}/mute", response_model=ParticipantOut)
def toggle_mute(
    meeting_pk: int,
    participant_id: int,
    payload: ParticipantMuteUpdate | None = None,
    db: Session = Depends(get_db),
):
    _get_meeting_or_404(meeting_pk, db)
    p = crud_p.get_participant(db, participant_id)
    if not p or p.meeting_id != meeting_pk or p.left_at is not None:
        raise HTTPException(status_code=404, detail="Participant not found.")
    if payload is not None:
        p.is_muted = payload.is_muted
        db.commit()
        db.refresh(p)
        return p
    return crud_p.toggle_mute(db, p)
