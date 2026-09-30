import re
import secrets
import string
from urllib.parse import parse_qs, urlparse


def generate_meeting_id() -> str:
    """Generate a random 11-digit meeting ID stored as a plain digit string.

    Display format (frontend only): XXX XXXX XXXX  (3-4-4 grouping)
    """
    return "".join(secrets.choice(string.digits) for _ in range(11))


def generate_passcode(length: int = 6) -> str:
    """Generate a random alphanumeric passcode."""
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


def generate_invite_link(meeting_id: str, frontend_url: str) -> str:
    """Return a shareable join URL."""
    return f"{frontend_url.rstrip('/')}/join?mid={meeting_id}"


def format_meeting_id(meeting_id: str) -> str:
    """Format an 11-digit plain string as 'XXX XXXX XXXX' for display.
    Used by the frontend; never stored with spaces.
    """
    if len(meeting_id) == 11:
        return f"{meeting_id[:3]} {meeting_id[3:7]} {meeting_id[7:]}"
    return meeting_id


def extract_meeting_id(raw: str) -> str:
    """
    Parse a bare digit meeting ID from user input.

    Accepts:
      - Plain 11-digit string: "87492263391"
      - Formatted with spaces/hyphens: "874 9226 3391" -> "87492263391"
      - Full invite link: "http://localhost:3000/join?mid=87492263391" -> "87492263391"
    """
    raw = raw.strip()
    if raw.startswith(("http://", "https://")):
        try:
            values = parse_qs(urlparse(raw).query).get("mid", [])
        except ValueError:
            return ""
        if len(values) != 1:
            return ""
        raw = values[0]
    if not re.fullmatch(r"[0-9\s-]+", raw):
        return ""
    mid = re.sub(r"[\s-]", "", raw)
    return mid if re.fullmatch(r"[0-9]{11}", mid) else ""
