# Code walkthrough for evaluation

Use this as a guide while reading the actual files and practising the demonstration.

## Structure and responsibilities

| Layer | Files | Responsibility |
|---|---|---|
| Pages | `frontend/app/` | Dashboard, meeting list, join steps, and room state |
| Reusable UI | `frontend/components/` | Shared navigation, modal, date-range picker, and create/edit schedule form |
| API client | `frontend/lib/api.ts` | Typed requests, API address, response errors, and participant operations |
| Display helpers | `frontend/lib/utils.ts` | ID/date formatting and invitation text |
| HTTP routes | `backend/app/routers/` | Endpoints, HTTP errors, and meeting lifecycle rules |
| Validation | `backend/app/schemas/` | Required fields, lengths, durations, time zones, and UTC conversion |
| Database operations | `backend/app/crud/` | Creating, querying, editing, and deleting records |
| Schema | `backend/app/models/` | Tables, foreign keys, relationships, uniqueness, and indexes |
| ID/link helpers | `backend/app/services/meeting_service.py` | Random IDs, passcodes, and invite parsing/building |
| Startup | `backend/app/main.py`, `seed.py` | Table creation and first-run sample data |

## Explain the four core flows

1. **Dashboard:** fetch the default user and upcoming/previous records. The interface shows real database content. Upcoming uses scheduled/active statuses; previous uses ended status. The meeting list applies its selected local date range.
2. **Instant meeting:** POST `/api/meetings/instant`; generate an 11-digit ID with `secrets`, check for an existing ID, generate the passcode/link, and commit the meeting. A database unique constraint also protects the ID. The frontend redirects to `/room/{meeting_id}`.
3. **Join:** parse an ID or invite URL, validate the meeting through the API, reject missing/ended meetings, collect a display name, and keep it in session storage. Entering the room registers the participant; retries reuse the participant already created by that page.
4. **Schedule/edit:** reuse `ScheduleForm` for both operations. Convert the browser's local date and 12-hour clock to an ISO timestamp with a UTC offset. The API validates it, stores UTC, and returns explicit UTC timestamps. Editing an unchanged minute preserves the original seconds; changing the displayed minute updates the stored time.

## Explain the database

- A user hosts many meetings through `meetings.host_id`.
- A meeting has many participants through `participants.meeting_id`.
- A guest participant can have a null `user_id` and still has a display name.
- A public meeting ID differs from the internal integer primary key.
- Meeting IDs and user emails/personal IDs are unique. Foreign keys are enabled for SQLite connections; indexes support the list and participant queries.
- Removing/leaving a participant sets `left_at`, retaining history. Ending a meeting also closes its active participants. Deleting a meeting cascades to its participants.
- Initial seeding creates one default user, five upcoming meetings, six previous meetings, and sample participants. It runs only when the users table is empty and does not restore deliberately deleted data.

## Scope and tradeoffs to explain honestly

- No login is required by the assignment; the default user is assumed to be logged in. Host controls are shown to the host in the UI. This is not an authenticated production permission system.
- Microphone/camera capture is local preview. Participant state and mute/remove actions use the API, with room polling every three seconds. There is no remote audio/video transport or WebRTC signaling server.
- Enterprise Zoom features, chat, native app launch, billing, and screen sharing are placeholders. The recurring flag is stored; automatic recurring occurrences are not generated.
- SQLite keeps setup simple for a local assignment. A larger deployment would need an appropriate database/migration and authentication strategy.

## Suggested demonstration

Show the dashboard, create an instant meeting and copy its invitation, join in another tab with a guest name, demonstrate mute/remove, then schedule and edit a future meeting and show it in Upcoming. Open Swagger at `http://localhost:8000/docs` and explain the three related tables. Use the README for setup and test commands.

API and browser tests use temporary databases. Submission timing must be compared with the actual assignment deadline; no deadline is recorded in this project.
