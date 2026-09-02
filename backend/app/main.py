"""TaskPilot FastAPI application entry point."""
from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import scheduler
from app.database import init_db
from app.events import manager
from app.routers import auth, stats, tasks, ws
from app.seed import seed_admin


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialise the database, seed an admin, bind the loop and start the scheduler."""
    init_db()
    seed_admin()
    manager.bind_loop(asyncio.get_running_loop())
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="TaskPilot API",
    description="Schedule, run and monitor automation tasks.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow the Vite dev server (and any origins from ALLOWED_ORIGINS).
default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", default_origins).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(stats.router)
app.include_router(ws.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
