from datetime import datetime
from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    personal_meeting_id: str
    avatar_initials: str
    plan: str
    created_at: datetime

    model_config = {"from_attributes": True}
