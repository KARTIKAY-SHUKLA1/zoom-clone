"""
Seed the database with one default user, 5 upcoming meetings, and 6 past meetings.
Called automatically on startup if the users table is empty.

All data is synthetic / fictional. No real names, emails, or phone numbers are used.
Meeting IDs are 11 digits stored plain (display format: XXX XXXX XXXX, 3-4-4 grouping).
"""
from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.user import User

_FRONTEND_URL = "http://localhost:3000"

# ── Seed meetings ─────────────────────────────────────────────────────────────
# Columns: (title, description, meeting_id [11 digits], passcode, day_offset, duration_min)
# Positive day_offset = upcoming; negative = past (will be set to status="ended")
_MEETING_DATA = [
    # ── 5 upcoming ────────────────────────────────────────────────────────────
    (
        "Weekly Team Sync",
        "Weekly sync to discuss progress and blockers.",
        "87492263391",  # display: 874 9226 3391
        "ABC123",
        1,
        40,
    ),
    (
        "Product Demo",
        "Demonstrating new features to stakeholders.",
        "56231098471",  # display: 562 3109 8471
        "xyz789",
        2,
        40,
    ),
    (
        "1:1 with Manager",
        None,
        "30918472651",  # display: 309 1847 2651
        "PQ4r5s",
        3,
        30,
    ),
    (
        "Design Review",
        "Review the latest UI mockups and prototypes.",
        "78126345091",  # display: 781 2634 5091
        "mN6t7u",
        5,
        40,
    ),
    (
        "Sprint Planning",
        "Plan tasks for the upcoming two-week sprint.",
        "45239876101",  # display: 452 3987 6101
        "vW8x9y",
        7,
        60,
    ),
    # ── 6 past ────────────────────────────────────────────────────────────────
    (
        "Project Kickoff",
        "Kickoff meeting for the video conferencing platform project.",
        "91827364501",  # display: 918 2736 4501
        "zAB012",
        -30,
        40,
    ),
    (
        "Q3 Review",
        "Review of Q3 goals and performance metrics.",
        "63718293041",  # display: 637 1829 3041
        "cDE345",
        -25,
        60,
    ),
    (
        "Backend Architecture Discussion",
        "Discussing the API design and database schema.",
        "28473615901",  # display: 284 7361 5901
        "fGH678",
        -20,
        40,
    ),
    (
        "Frontend Code Review",
        "Peer review of Next.js components and Tailwind styles.",
        "50319284761",  # display: 503 1928 4761
        "iJK901",
        -15,
        40,
    ),
    (
        "Daily Standup",
        None,
        "72638190451",  # display: 726 3819 0451
        "lMN234",
        -10,
        15,
    ),
    (
        "User Research Sync",
        "Syncing on user feedback from the research team.",
        "38192746501",  # display: 381 9274 6501
        "oP5q6r",
        -5,
        40,
    ),
]

_FAKE_GUESTS = [
    "Alice Johnson",
    "Bob Smith",
    "Priya Patel",
    "Rahul Kumar",
    "Sara Lee",
]


def seed_if_empty() -> None:
    """Seed only when the users table is completely empty (idempotent)."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return  # already seeded — do nothing
        _seed(db)
    finally:
        db.close()


def _seed(db) -> None:
    now = datetime.utcnow()

    # ── Default user (all fictional data) ─────────────────────────────────────
    user = User(
        name="Alex Morgan",
        email="alex.morgan@example.com",
        # 11-digit personal meeting ID stored plain, displayed as 512 8374 0960
        personal_meeting_id="51283740960",
        avatar_initials="AM",
        plan="Workplace Basic",
    )
    db.add(user)
    db.flush()  # assigns user.id before we reference it below

    # ── Meetings ───────────────────────────────────────────────────────────────
    meetings: list[Meeting] = []
    for title, desc, mid, passcode, day_offset, duration in _MEETING_DATA:
        is_past = day_offset < 0
        meeting = Meeting(
            title=title,
            description=desc,
            host_id=user.id,
            meeting_id=mid,
            passcode=passcode,
            invite_link=f"{_FRONTEND_URL}/join?mid={mid}",
            status="ended" if is_past else "scheduled",
            is_instant=False,
            start_time=now + timedelta(days=day_offset),
            duration_minutes=duration,
            time_zone="Asia/Kolkata",
            is_recurring=False,
        )
        db.add(meeting)
        meetings.append(meeting)

    db.flush()  # assigns meeting.id for all rows before participants reference them

    # ── Participants ───────────────────────────────────────────────────────────
    for idx, meeting in enumerate(meetings):
        is_past = meeting.status == "ended"
        end_time = meeting.start_time + timedelta(minutes=meeting.duration_minutes)

        # Host participant
        db.add(
            Participant(
                meeting_id=meeting.id,
                user_id=user.id,
                display_name=user.name,
                role="host",
                is_muted=False,
                is_video_off=False,
                joined_at=meeting.start_time,
                left_at=end_time if is_past else None,
            )
        )

        # 1–3 rotating guest participants (no user account → user_id=None)
        guest_count = (idx % 3) + 1
        for j in range(guest_count):
            guest_name = _FAKE_GUESTS[(idx + j) % len(_FAKE_GUESTS)]
            db.add(
                Participant(
                    meeting_id=meeting.id,
                    user_id=None,
                    display_name=guest_name,
                    role="participant",
                    is_muted=(j % 2 == 0),
                    is_video_off=False,
                    joined_at=meeting.start_time + timedelta(minutes=1),
                    left_at=end_time - timedelta(minutes=2) if is_past else None,
                )
            )

    db.commit()
    print("[seed] Database seeded: 1 user, 11 meetings, participants created.")
