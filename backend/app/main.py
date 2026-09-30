from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.config import settings
from app.database import Base, engine
from app.routers import meetings, participants, users
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    yield


app = FastAPI(
    title="Zoom Clone API",
    description="REST API for the Zoom Clone SDE Fullstack assignment",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # Reads from CORS_ORIGINS env var — comma-separated list of allowed origins
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(meetings.router)
app.include_router(participants.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}
