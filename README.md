# Zoom Clone — SDE Fullstack Assignment

A full-stack Zoom-like meeting management app built with **Next.js 15** and **FastAPI**.

---

## Local URLs

| | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/docs |

> Local review only. No deployment is included in this review.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, Lucide icons |
| Backend | FastAPI, SQLAlchemy 2.1, Pydantic v2 |
| Database | SQLite (auto-seeded on startup) |
| Review environment | Local frontend and backend; no deployment in this review |

---

## 🚀 Local Setup

Prerequisites: Python 3.12 or newer, Node.js 20.9 or newer, and npm. Open two terminals in the project root: one for the backend and one for the frontend. Keep both servers running. The initial setup commands below copy example environment files; keep your existing `.env` and `.env.local` if already configured.

### Backend (Windows PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload
```

### Backend (macOS/Linux)

```bash
cd backend
python3 -m venv venv
venv/bin/python -m pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
venv/bin/python -m uvicorn app.main:app --port 8000 --reload
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- SQLite tables are created automatically. An empty users table triggers the initial sample data: one default user, 11 meetings, and sample participants. Existing data is preserved on restart.

### Frontend (Windows PowerShell)

```powershell
cd frontend
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

### Frontend (macOS/Linux)

```bash
cd frontend
npm ci
[ -f .env.local ] || cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. For a local production preview, stop the frontend development server, then run `npm run build` followed by `npm start` from `frontend/`. Restart the frontend after changing `NEXT_PUBLIC_API_URL`; a production build must be rebuilt to pick up that value.

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
| PATCH | `/api/meetings/{id}/participants/{pid}/mute` | Set mute state, or toggle when omitted |
| POST | `/api/meetings/{id}/participants/{pid}/leave` | Leave on page exit using a beacon |

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
| 2 | **Default host** — meetings are owned and displayed for the default user. Guests enter their own display names and are stored as participants. |
| 3 | **Fake seed data only** — 5 upcoming + 6 past meetings with rotating fake guest names (Alice Johnson, Bob Smith, Priya Patel, Rahul Kumar, Sara Lee). No real personal data. |
| 4 | **Persistence** — SQLite stores meetings locally. Seeding runs only when the users table is empty; restarting does not recreate deleted meetings. Deployment requires persistent storage to retain data across restarts. |
| 5 | **Camera limited to local device** — `getUserMedia` captures each user's own camera and microphone locally. Seeded participants are synthetic database records. |
| 6 | **Room scope** — guests register and enter with their own names; participant state is refreshed from the API. Camera/microphone controls are local. Remote audio/video transport is outside this core-workflow review. |
| 7 | **Meeting IDs are 11 digits** — stored as plain digit strings in the DB. Formatted as `XXX XXXX XXXX` (3-4-4) only on the frontend. |
| 8 | **Invite link configuration** — frontend copy/share links use `window.location.origin`; backend-generated links use `FRONTEND_URL`. Configure that value to match the frontend address when running on another host. |
| 9 | **Existing bonus controls** — Mute All and Remove Participant were already present. The review focuses on the four required workflows; no authentication or remote media transport was added. |
| 10 | **Interface** — the existing frontend was restyled using the supplied Zoom screenshots for spacing, colors, navigation, and room layout. Settings and non-core product sections are placeholders. The personal meeting ID is displayed; personal-room scheduling is outside the core workflows. |

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


## Core workflows

- Dashboard: New Meeting, Join, Schedule, upcoming meetings, and recent meetings from the database. The existing Zoom-style navigation and profile/settings placeholders are retained.
- Instant meeting: creates an active meeting with a unique 11-digit ID and generated invite link, then redirects to the Workplace room permission screen. Users can enable their microphone/camera or continue without them. Invitations can be copied in the room.
- Join: accepts a meeting ID, a formatted ID, or a generated invite URL. Invite URLs prefill the meeting ID. The API validates the meeting before the browser-join choice and display-name step; the room preserves that name and registers the participant once when entering. The browser preference is remembered locally. Native Zoom app launch is a visual placeholder.
- Schedule: saves a topic, optional description, date/time, and duration, generates a link, and displays the record in Upcoming. Editing preserves the existing time and permits clearing the description.

Datetime requests include an offset and are normalized to UTC for SQLite storage. API responses include an explicit UTC offset; the frontend displays the browser's local time zone. New schedules must be in the future. Titles are limited to 200 characters, display names to 100, descriptions to 5,000, and durations to 1 to 1,800 minutes. The Basic-plan promotional text is visual reference copy; billing and plan limits are not implemented.

## Verification

For explaining the implementation during evaluation, see [Code walkthrough](docs/EVALUATION_GUIDE.md).

Backend, from `backend/`:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

Frontend, from `frontend/`:

```powershell
npm ci
npm run lint
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Browser tests start a separate frontend on port 3001 with an isolated `.next-e2e` build directory and a disposable backend on port 8001. Both API and browser regression tests use temporary SQLite databases and do not write to your local `backend/zoom.db`. For macOS/Linux, use `venv/bin/python`; browser tests select that interpreter automatically. Set `E2E_PYTHON` if using another virtual environment.

`next` remains on version 15. Patched PostCSS and sharp dependencies are selected with npm overrides and locked in `package-lock.json`. Backend requirements are pinned to the versions used in the local review.

UI references: all 22 supplied screenshots in `PICS/` were inspected for the portal dashboard, meeting list and date-range picker, horizontal schedule form, join screens, Workplace room, participants panel, end menu, and footer. Desktop measurements scale together from the reference's approximately 1896px viewport, with separate mobile layouts. Real default-user and database content is retained. AI, Docs, billing, native app launch, chat, reactions, and screen sharing remain outside this core-feature implementation; room media is local device preview only.
