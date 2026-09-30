from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.common import UTCModel


class ParticipantCreate(BaseModel):
    display_name: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
    ]
    user_id: int | None = Field(default=None, gt=0)


class ParticipantMuteUpdate(BaseModel):
    is_muted: bool


class ParticipantOut(UTCModel):
    id: int
    meeting_id: int
    user_id: int | None
    display_name: str
    role: str
    is_muted: bool
    is_video_off: bool
    joined_at: datetime
    left_at: datetime | None = None
