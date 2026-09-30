from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.schemas.common import TimeZone, UTCModel

Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=5000)]
Duration = Annotated[int, Field(strict=True, ge=1, le=1800)]


class MeetingCreate(BaseModel):
    title: Title
    description: Description | None = None
    start_time: datetime
    duration_minutes: Duration = 40
    time_zone: TimeZone = "Asia/Kolkata"
    is_recurring: bool = False

    @field_validator("start_time")
    @classmethod
    def future_start(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Start time must include a UTC offset.")
        value = value.astimezone(timezone.utc)
        if value <= datetime.now(timezone.utc):
            raise ValueError("Choose a start time in the future.")
        return value.replace(tzinfo=None)


class MeetingUpdate(BaseModel):
    title: Title | None = None
    description: Description | None = None
    start_time: datetime | None = None
    duration_minutes: Duration | None = None
    time_zone: TimeZone | None = None
    is_recurring: bool | None = None

    @field_validator(
        "title", "start_time", "duration_minutes", "time_zone", "is_recurring"
    )
    @classmethod
    def non_nullable(cls, value):
        if value is None:
            raise ValueError("This field cannot be null.")
        return value

    @field_validator("start_time")
    @classmethod
    def utc_start(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Start time must include a UTC offset.")
        return value.astimezone(timezone.utc).replace(tzinfo=None)


class MeetingStatusUpdate(BaseModel):
    status: Literal["scheduled", "active", "ended"]


class ValidateMeetingRequest(BaseModel):
    # accepts raw digit string (with/without spaces) OR full invite URL
    meeting_input: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2048)
    ]


class MeetingOut(UTCModel):
    id: int
    title: str
    description: str | None
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
