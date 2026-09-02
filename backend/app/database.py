"""Database engine, session and base model configuration (SQLite + SQLAlchemy)."""
from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# SQLite file lives next to the backend by default; override with DATABASE_URL.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./taskpilot.db")

# check_same_thread=False lets the APScheduler background thread share the engine.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables and apply lightweight migrations. Called on startup."""
    # Import models so they register with the metadata before create_all.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _apply_migrations()


def _apply_migrations() -> None:
    """Idempotent column additions for SQLite (create_all won't alter tables)."""
    from sqlalchemy import inspect, text

    if not DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    if "tasks" not in inspector.get_table_names():
        return
    columns = {c["name"] for c in inspector.get_columns("tasks")}
    if "notify_on_failure" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE tasks ADD COLUMN notify_on_failure BOOLEAN NOT NULL DEFAULT 0")
            )
