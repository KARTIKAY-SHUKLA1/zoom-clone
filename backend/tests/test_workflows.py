"""API regressions use a temporary database, never the user's zoom.db."""

import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

_directory = tempfile.TemporaryDirectory(prefix="zoom-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_directory.name, 'test.db').as_posix()}"
os.environ["FRONTEND_URL"] = "https://assignment.example.com"
os.environ["DEFAULT_USER_ID"] = "1"

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import engine
from app.main import app
from app.seed import seed_if_empty


class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.context = TestClient(app)
        cls.client = cls.context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.context.__exit__(None, None, None)
        engine.dispose()
        _directory.cleanup()

    def schedule(self, **changes):
        data = {
            "title": " Test meeting ",
            "start_time": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "duration_minutes": 30,
        }
        data.update(changes)
        return self.client.post("/api/meetings/", json=data)

    def test_seed_is_idempotent_and_has_relationships(self):
        upcoming = self.client.get("/api/meetings/?type=upcoming").json()
        previous = self.client.get("/api/meetings/?type=previous").json()
        before = len(upcoming) + len(previous)
        seed_if_empty()
        after = len(self.client.get("/api/meetings/?type=upcoming").json()) + len(
            self.client.get("/api/meetings/?type=previous").json()
        )
        self.assertEqual(before, after)
        seeded = [m for m in upcoming if m["title"] == "Weekly Team Sync"][0]
        self.assertTrue(
            seeded["invite_link"].startswith("https://assignment.example.com/")
        )
        self.assertGreater(
            len(self.client.get(f"/api/meetings/{seeded['id']}/participants/").json()),
            0,
        )

    def test_schedule_edit_and_delete(self):
        response = self.schedule(description="original")
        self.assertEqual(response.status_code, 201)
        m = response.json()
        self.assertEqual(m["title"], "Test meeting")
        self.assertRegex(m["meeting_id"], r"^\d{11}$")
        self.assertTrue(m["start_time"].endswith("+00:00"))
        result = self.client.put(
            f"/api/meetings/{m['id']}", json={"description": "", "title": "Edited"}
        )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["start_time"], m["start_time"])
        self.assertEqual(result.json()["description"], "")
        p = self.client.post(
            f"/api/meetings/{m['id']}/participants/", json={"display_name": "Guest"}
        ).json()
        self.assertEqual(
            self.client.delete(f"/api/meetings/{m['id']}").status_code, 204
        )
        self.assertEqual(self.client.get(f"/api/meetings/{m['id']}").status_code, 404)
        with engine.connect() as connection:
            self.assertEqual(
                connection.execute(
                    text("SELECT COUNT(*) FROM participants WHERE id=:id"),
                    {"id": p["id"]},
                ).scalar(),
                0,
            )

    def test_validation_rejects_bad_inputs(self):
        for changes in [
            {"title": " "},
            {"title": "x" * 201},
            {"duration_minutes": 0},
            {"duration_minutes": -5},
            {"duration_minutes": 1.5},
            {"duration_minutes": 1801},
            {"time_zone": "Invalid/Zone"},
            {"start_time": "2020-01-01T12:00:00+00:00"},
            {"start_time": "2030-01-01T12:00:00"},
        ]:
            with self.subTest(changes=changes):
                self.assertEqual(self.schedule(**changes).status_code, 422)
        m = self.schedule().json()
        for field in [
            "title",
            "duration_minutes",
            "start_time",
            "time_zone",
            "is_recurring",
        ]:
            self.assertEqual(
                self.client.put(
                    f"/api/meetings/{m['id']}", json={field: None}
                ).status_code,
                422,
            )
        self.client.delete(f"/api/meetings/{m['id']}")

    def test_join_parsing_and_guest_name_validation(self):
        m = self.schedule().json()
        mid = m["meeting_id"]
        for value in [
            mid,
            f"{mid[:3]} {mid[3:7]} {mid[7:]}",
            m["invite_link"],
            f"https://assignment.example.com/join?mid={mid}&other=1",
            f"My Meeting is inviting you to a scheduled Zoom meeting.\n\nMeeting ID: {mid[:3]} {mid[3:7]} {mid[7:]}\nPasscode: MikjaR\nJoin link: {m['invite_link']}",
            f"My MeetingMeeting ID: {mid}Passcode: MikjaRJoin link: {m['invite_link']}",
        ]:
            self.assertEqual(
                self.client.post(
                    "/api/meetings/validate", json={"meeting_input": value}
                ).json()["id"],
                m["id"],
            )
        for value in [
            "abc" + mid,
            "123",
            "https://example.com/" + mid,
            m["invite_link"] + "junk",
            m["invite_link"] + "&mid=" + mid,
            f"Meeting ID: {mid}\nJoin link: https://example.com/join?mid=12345678901",
            f"Meeting ID: {mid}\nJoin link: https://example.com/join?mid=bad",
        ]:
            self.assertEqual(
                self.client.post(
                    "/api/meetings/validate", json={"meeting_input": value}
                ).status_code,
                422,
            )
        for name in ["", " ", "x" * 101]:
            self.assertEqual(
                self.client.post(
                    f"/api/meetings/{m['id']}/participants/",
                    json={"display_name": name},
                ).status_code,
                422,
            )
        self.assertEqual(
            self.client.post(
                f"/api/meetings/{m['id']}/participants/",
                json={"display_name": "Guest", "user_id": 999999},
            ).status_code,
            404,
        )
        self.client.delete(f"/api/meetings/{m['id']}")

    def test_host_controls_and_meeting_lifecycle(self):
        m = self.client.post("/api/meetings/instant").json()
        pk = m["id"]
        path = f"/api/meetings/{pk}/participants"
        host = self.client.post(
            path + "/", json={"display_name": "Alex Morgan", "user_id": 1}
        ).json()
        repeated = self.client.post(
            path + "/", json={"display_name": "Alex Morgan", "user_id": 1}
        ).json()
        self.assertEqual(host["role"], "host")
        self.assertEqual(host["id"], repeated["id"])
        guest = self.client.post(path + "/", json={"display_name": " My Guest "}).json()
        self.assertEqual(guest["display_name"], "My Guest")
        self.client.post(path + "/mute-all")
        ps = self.client.get(path + "/").json()
        self.assertFalse(next(p for p in ps if p["id"] == host["id"])["is_muted"])
        self.assertTrue(next(p for p in ps if p["id"] == guest["id"])["is_muted"])
        self.assertEqual(self.client.delete(path + f"/{guest['id']}").status_code, 204)
        self.assertEqual(
            self.client.patch(path + f"/{guest['id']}/mute").status_code, 404
        )
        self.assertEqual(
            self.client.patch(
                f"/api/meetings/{pk}/status", json={"status": "scheduled"}
            ).status_code,
            409,
        )
        self.assertEqual(
            self.client.put(
                f"/api/meetings/{pk}", json={"title": "Change"}
            ).status_code,
            409,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/meetings/{pk}/status", json={"status": "ended"}
            ).status_code,
            200,
        )
        self.assertEqual(self.client.get(path + "/").json(), [])
        self.assertEqual(
            self.client.patch(
                f"/api/meetings/{pk}/status", json={"status": "active"}
            ).status_code,
            409,
        )
        self.assertEqual(
            self.client.post(path + "/", json={"display_name": "Guest"}).status_code,
            400,
        )
        self.client.delete(f"/api/meetings/{pk}")

    def test_timezone_offset_is_normalized(self):
        start = (
            datetime.now(timezone(timedelta(hours=5, minutes=30))) + timedelta(days=1)
        ).replace(microsecond=0)
        response = self.schedule(start_time=start.isoformat())
        self.assertEqual(
            datetime.fromisoformat(response.json()["start_time"]),
            start.astimezone(timezone.utc),
        )
        self.client.delete(f"/api/meetings/{response.json()['id']}")

    def test_sqlite_foreign_keys_are_enabled(self):
        with engine.connect() as connection:
            self.assertEqual(
                connection.execute(text("PRAGMA foreign_keys")).scalar(), 1
            )


if __name__ == "__main__":
    unittest.main()
