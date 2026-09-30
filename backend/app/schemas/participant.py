from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ParticipantCreate(BaseModel):
    display_name: str
    user_id: Optional[int] = None


class ParticipantOut(BaseModel):
    id: int
    meeting_id: int
    user_id: Optional[int]
    display_name: str
    role: str
    is_muted: bool
    is_video_off: bool
    joined_at: datetime
    left_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
