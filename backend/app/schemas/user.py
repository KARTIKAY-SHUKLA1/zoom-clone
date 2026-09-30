from datetime import datetime

from app.schemas.common import UTCModel


class UserOut(UTCModel):
    id: int
    name: str
    email: str
    personal_meeting_id: str
    avatar_initials: str
    plan: str
    created_at: datetime
