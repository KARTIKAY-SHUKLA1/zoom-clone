import random
import re
import string


def generate_meeting_id() -> str:
    """Generate a random 11-digit meeting ID stored as a plain digit string.

    Display format (frontend only): XXX XXXX XXXX  (3-4-4 grouping)
    """
    return "".join(str(random.randint(0, 9)) for _ in range(11))


def generate_passcode(length: int = 6) -> str:
    """Generate a random alphanumeric passcode."""
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


def generate_invite_link(meeting_id: str, frontend_url: str) -> str:
    """Return a shareable join URL."""
    return f"{frontend_url}/join?mid={meeting_id}"


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
    # Prefer the explicit ?mid= / &mid= query parameter
    mid_match = re.search(r"[?&]mid=(\d+)", raw)
    if mid_match:
        return mid_match.group(1)
    # Fall back: strip every non-digit character
    return re.sub(r"\D", "", raw)
