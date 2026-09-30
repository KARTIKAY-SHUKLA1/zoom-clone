"""Start a disposable backend for browser tests without touching zoom.db."""

import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

with tempfile.TemporaryDirectory(prefix="zoom-browser-tests-") as directory:
    os.environ["DATABASE_URL"] = f"sqlite:///{Path(directory, 'browser.db').as_posix()}"
    os.environ["FRONTEND_URL"] = "http://localhost:3001"
    os.environ["CORS_ORIGINS"] = "http://localhost:3001"
    os.environ["DEFAULT_USER_ID"] = "1"
    import uvicorn

    from app.database import engine

    try:
        uvicorn.run("app.main:app", host="127.0.0.1", port=8001)
    finally:
        engine.dispose()
