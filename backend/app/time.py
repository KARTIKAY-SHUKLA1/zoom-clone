from datetime import datetime, timezone


def utc_now() -> datetime:
    """UTC datetime without tzinfo for the existing SQLite DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
