from datetime import datetime, timezone
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AfterValidator, BaseModel, field_serializer


def valid_timezone(value: str) -> str:
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        raise ValueError("Choose a valid IANA time zone.")
    return value


TimeZone = Annotated[str, AfterValidator(valid_timezone)]


class UTCModel(BaseModel):
    """SQLite stores UTC without an offset; expose an explicit offset in JSON."""

    model_config = {"from_attributes": True}

    @field_serializer(
        "start_time",
        "created_at",
        "updated_at",
        "joined_at",
        "left_at",
        check_fields=False,
    )
    def serialize_datetime(self, value: datetime | None) -> str | None:
        if value is None:
            return None
        return value.replace(tzinfo=timezone.utc).isoformat()
