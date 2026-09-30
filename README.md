# Zoom Clone — SDE Fullstack Assignment

A full-stack Zoom-like meeting management app built with **Next.js 15** and **FastAPI**.

---

## 🔗 Live Links

| | URL |
|---|---|
| **Frontend** | `https://YOUR-APP.vercel.app` |
| **Backend API** | `https://YOUR-API.onrender.com` |
| **Swagger Docs** | `https://YOUR-API.onrender.com/docs` |

> Replace placeholders after deployment.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | SQLite (auto-seeded on startup) |
| Deployment | Vercel (frontend) · Render (backend) |

---

## 🚀 Local Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # edit if needed
uvicorn app.main:app --port 8000 --reload
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- DB seeds automatically on first run (11 fake meetings)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # already points to localhost:8000
npm run dev
```

- App: http://localhost:3000

---

## 🗄 Database Schema

```
┌─────────────────────────────┐      ┌──────────────────────────────────────┐
│           users             │      │              meetings                 │
├─────────────────────────────┤      ├──────────────────────────────────────┤
│ id              INTEGER PK  │◄─┐   │ id              INTEGER PK           │
│ name            VARCHAR     │  │   │ title           VARCHAR               │
│ email           VARCHAR UQ  │  │   │ description     TEXT                  │
│ personal_meeting_id VARCHAR │  └───│ host_id         INTEGER FK→users.id  │
│ avatar_initials VARCHAR     │      │ meeting_id      VARCHAR(20) UQ        │
│ plan            VARCHAR     │      │ passcode        VARCHAR(20)           │
│ created_at      DATETIME    │      │ invite_link     VARCHAR               │
└─────────────────────────────┘      │ status          VARCHAR  ← scheduled │
                                     │                          ← active     │
                                     │                          ← ended      │
                                     │ is_instant      BOOLEAN               │
                                     │ start_time      DATETIME              │
                                     │ duration_minutes INTEGER              │
                                     │ time_zone       VARCHAR               │
                                     │ is_recurring    BOOLEAN               │
                                     │ created_at      DATETIME              │
                                     │ updated_at      DATETIME              │
                                     └──────────┬───────────────────────────┘
                                                │
                                     ┌──────────▼───────────────────────────┐
                                     │            participants               │
                                     ├──────────────────────────────────────┤
                                     │ id              INTEGER PK           │
                                     │ meeting_id      INTEGER FK→meetings  │
                                     │ user_id         INTEGER FK→users     │
                                     │ display_name    VARCHAR               │
                                     │ role            VARCHAR  ← host       │
                                     │                          ← participant│
                                     │ is_muted        BOOLEAN               │
                                     │ is_video_off    BOOLEAN               │
                                     │ joined_at       DATETIME              │
                                     │ left_at         DATETIME nullable     │
                                     └──────────────────────────────────────┘
```

**Indexes:** `meetings(host_id)`, `meetings(meeting_id)`, `meetings(status)`, `meetings(start_time)`, `participants(meeting_id)`, `participants(user_id)`

---

## 📡 API Endpoints

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/me` | Get default user (Alex Morgan) |

### Meetings
| Method | Path | Description |
|---|---|---|
| GET | `/api/meetings/?type=upcoming` | List scheduled/active meetings |
| GET | `/api/meetings/?type=previous` | List ended meetings |
| POST | `/api/meetings/` | Schedule a meeting |
| POST | `/api/meetings/instant` | Create & start instant meeting |
| POST | `/api/meetings/validate` | Validate meeting ID or invite link |
| GET | `/api/meetings/{id}` | Get meeting by PK |
| PUT | `/api/meetings/{id}` | Edit meeting |
| DELETE | `/api/meetings/{id}` | Delete meeting |
| PATCH | `/api/meetings/{id}/status` | Change status (scheduled→active→ended) |

### Participants
| Method | Path | Description |
|---|---|---|
| GET | `/api/meetings/{id}/participants/` | List active participants |
| POST | `/api/meetings/{id}/participants/` | Join meeting |
| POST | `/api/meetings/{id}/participants/mute-all` | Mute all (host control) |
| DELETE | `/api/meetings/{id}/participants/{pid}` | Remove participant |
| PATCH | `/api/meetings/{id}/participants/{pid}/mute` | Toggle mute |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server health check |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./zoom.db` | SQLAlchemy DB URL |
| `FRONTEND_URL` | `http://localhost:3000` | Used in generated invite links |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `DEFAULT_USER_ID` | `1` | ID of the default (unauthenticated) user |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI backend base URL |

---

## 📋 Assumptions & Design Decisions

| # | Assumption |
|---|---|
| 1 | **No authentication** — a default user (Alex Morgan, id=1) is always assumed to be logged in. |
| 2 | **Single user** — all meetings are owned and displayed for the default user only. |
| 3 | **Fake seed data only** — 5 upcoming + 6 past meetings with rotating fake guest names (Alice Johnson, Bob Smith, Priya Patel, Rahul Kumar, Sara Lee). No real personal data. |
| 4 | **SQLite resets on Render restart** — Render free tier has ephemeral storage; seed auto-runs on every cold start, restoring all 11 meetings. |
| 5 | **Camera limited to local device** — `getUserMedia` captures only the host's own camera. Remote participants are simulated (seeded into the participants table). |
| 6 | **No WebRTC / real-time** — the meeting room is a UI demo. Multiple real participants are not supported; the room shows the host's own video tile and the participant list from the DB. |
| 7 | **Meeting IDs are 11 digits** — stored as plain digit strings in the DB. Formatted as `XXX XXXX XXXX` (3-4-4) only on the frontend. |
| 8 | **Invite links use `window.location.origin`** — so they always point to the deployed domain, never hardcoded localhost. |
| 9 | **Host controls** — Mute All and Remove Participant are implemented as bonus features. |
| 10 | **Responsive** — mobile (hamburger sidebar drawer), tablet, and desktop layouts supported. |

---

## 📁 Project Structure

```
zoom-clone/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, startup seed
│   │   ├── config.py        # pydantic-settings (reads .env)
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── seed.py          # Fake data seeder (idempotent)
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── crud/            # DB query helpers
│   │   ├── routers/         # FastAPI route handlers
│   │   └── services/        # meeting_id generator, invite-link builder
│   ├── requirements.txt
│   ├── runtime.txt          # Python 3.12.7 for Render
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── (main)/          # Dashboard + Meetings (with Sidebar/Topbar)
    │   ├── join/            # Standalone join page
    │   └── room/[meetingId] # Dark-theme meeting room
    ├── components/
    │   ├── layout/          # MainShell, Sidebar, Topbar
    │   ├── dashboard/       # Clock, ActionButton, FeatureCard, TodaysMeetings
    │   ├── meetings/        # ScheduleForm, EditModal, MeetingDetail
    │   └── ui/              # Spinner, Modal, BackendBanner
    ├── lib/
    │   ├── api.ts           # Typed API client (reads NEXT_PUBLIC_API_URL)
    │   └── utils.ts         # formatMeetingId, getJoinUrl, buildInvitationText
    ├── types/index.ts
    └── .env.example
```
