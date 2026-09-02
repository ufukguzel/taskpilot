"""SQLAlchemy ORM models: Task and TaskRun."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    """A scheduled or on-demand automation task."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # "command" -> run a shell command | "http" -> perform an HTTP request
    task_type: Mapped[str] = mapped_column(String(20), nullable=False, default="command")

    # command-type fields
    command: Mapped[str | None] = mapped_column(Text, nullable=True)

    # http-type fields
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    http_method: Mapped[str] = mapped_column(String(10), nullable=False, default="GET")

    # optional cron expression, e.g. "*/5 * * * *"; empty => manual only
    schedule: Mapped[str | None] = mapped_column(String(120), nullable=True)
    enabled: Mapped[bool] = mapped_column(default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    runs: Mapped[list["TaskRun"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="TaskRun.started_at.desc()",
    )


class TaskRun(Base):
    """A single execution record for a task."""

    __tablename__ = "task_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)

    status: Mapped[str] = mapped_column(String(20), default="running")  # running|success|failed
    trigger: Mapped[str] = mapped_column(String(20), default="manual")  # manual|scheduled
    output: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    task: Mapped["Task"] = relationship(back_populates="runs")
