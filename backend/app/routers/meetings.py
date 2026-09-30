from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.crud import meeting as crud
from app.database import get_db
from app.schemas.meeting import (
    MeetingCreate,
    MeetingOut,
    MeetingStatusUpdate,
    MeetingUpdate,
    ValidateMeetingRequest,
)
from app.services.meeting_service import extract_meeting_id
from app.time import utc_now

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _host_id() -> int:
    """Return the default (unauthenticated) host ID."""
    return settings.default_user_id


# ── POST /api/meetings/instant ────────────────────────────────────────────────
# IMPORTANT: literal-path routes MUST be declared before /{meeting_pk}
@router.post("/instant", response_model=MeetingOut, status_code=201)
def create_instant(db: Session = Depends(get_db)):
    """Create and immediately start an instant meeting."""
    return crud.create_instant_meeting(db, host_id=_host_id())


# ── POST /api/meetings/validate ───────────────────────────────────────────────
@router.post("/validate", response_model=MeetingOut)
def validate_meeting(payload: ValidateMeetingRequest, db: Session = Depends(get_db)):
    """
    Verify a meeting exists.
    Accepts a raw ID (digits ± spaces/hyphens) or a full invite link.
    """
    mid = extract_meeting_id(payload.meeting_input)
    if not mid:
        raise HTTPException(
            status_code=422, detail="Could not parse a meeting ID from the input."
        )
    meeting = crud.get_meeting_by_meeting_id(db, mid)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return meeting


# ── GET /api/meetings/ ────────────────────────────────────────────────────────
@router.get("/", response_model=list[MeetingOut])
def list_meetings(
    type: Literal["upcoming", "previous"] = Query("upcoming"),
    db: Session = Depends(get_db),
):
    """List meetings. type=upcoming (default) returns scheduled+active; type=previous returns ended."""
    if type == "upcoming":
        return crud.list_upcoming(db, _host_id())
    return crud.list_previous(db, _host_id())


# ── POST /api/meetings/ ───────────────────────────────────────────────────────
@router.post("/", response_model=MeetingOut, status_code=201)
def schedule_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    """Create a scheduled meeting."""
    return crud.create_scheduled_meeting(db, data, host_id=_host_id())


# ── GET /api/meetings/{meeting_pk} ────────────────────────────────────────────
@router.get("/{meeting_pk}", response_model=MeetingOut)
def get_meeting(meeting_pk: int, db: Session = Depends(get_db)):
    m = crud.get_meeting_by_pk(db, meeting_pk)
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return m


# ── PUT /api/meetings/{meeting_pk} ────────────────────────────────────────────
@router.put("/{meeting_pk}", response_model=MeetingOut)
def edit_meeting(meeting_pk: int, data: MeetingUpdate, db: Session = Depends(get_db)):
    m = crud.get_meeting_by_pk(db, meeting_pk)
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    if m.status != "scheduled":
        raise HTTPException(
            status_code=409, detail="Only scheduled meetings can be edited."
        )
    if (
        data.start_time is not None
        and data.start_time != m.start_time
        and data.start_time <= utc_now()
    ):
        raise HTTPException(
            status_code=422, detail="Choose a start time in the future."
        )
    return crud.update_meeting(db, m, data)


# ── DELETE /api/meetings/{meeting_pk} ─────────────────────────────────────────
@router.delete("/{meeting_pk}", status_code=204)
def remove_meeting(meeting_pk: int, db: Session = Depends(get_db)):
    m = crud.get_meeting_by_pk(db, meeting_pk)
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    crud.delete_meeting(db, m)


# ── PATCH /api/meetings/{meeting_pk}/status ───────────────────────────────────
@router.patch("/{meeting_pk}/status", response_model=MeetingOut)
def change_status(
    meeting_pk: int, payload: MeetingStatusUpdate, db: Session = Depends(get_db)
):
    """Update a meeting's status (scheduled → active → ended)."""
    m = crud.get_meeting_by_pk(db, meeting_pk)
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    transitions = {
        "scheduled": {"scheduled", "active", "ended"},
        "active": {"active", "ended"},
        "ended": {"ended"},
    }
    if payload.status not in transitions[m.status]:
        raise HTTPException(
            status_code=409, detail="This meeting cannot be restarted or rescheduled."
        )
    return crud.update_status(db, m, payload.status)
