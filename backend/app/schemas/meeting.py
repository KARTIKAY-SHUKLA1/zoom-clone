from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    duration_minutes: int = 40
    time_zone: str = "Asia/Kolkata"
    is_recurring: bool = False


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    time_zone: Optional[str] = None
    is_recurring: Optional[bool] = None


class MeetingStatusUpdate(BaseModel):
    status: str  # scheduled | active | ended


class ValidateMeetingRequest(BaseModel):
    # accepts raw digit string (with/without spaces) OR full invite URL
    meeting_input: str


class MeetingOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    host_id: int
    meeting_id: str
    passcode: str
    invite_link: str
    status: str
    is_instant: bool
    start_time: datetime
    duration_minutes: int
    time_zone: str
    is_recurring: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
