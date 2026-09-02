"""Database CRUD helpers for tasks and runs."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas


def list_tasks(db: Session) -> list[models.Task]:
    return list(db.scalars(select(models.Task).order_by(models.Task.created_at.desc())))


def get_task(db: Session, task_id: int) -> models.Task | None:
    return db.get(models.Task, task_id)


def create_task(db: Session, payload: schemas.TaskCreate) -> models.Task:
    task = models.Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: models.Task, payload: schemas.TaskUpdate) -> models.Task:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: models.Task) -> None:
    db.delete(task)
    db.commit()


def last_run(db: Session, task_id: int) -> models.TaskRun | None:
    stmt = (
        select(models.TaskRun)
        .where(models.TaskRun.task_id == task_id)
        .order_by(models.TaskRun.started_at.desc())
        .limit(1)
    )
    return db.scalars(stmt).first()


def list_runs(db: Session, task_id: int, limit: int = 50) -> list[models.TaskRun]:
    stmt = (
        select(models.TaskRun)
        .where(models.TaskRun.task_id == task_id)
        .order_by(models.TaskRun.started_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


def stats(db: Session) -> dict[str, int]:
    tasks = db.scalars(select(models.Task)).all()
    runs = db.scalars(select(models.TaskRun)).all()
    return {
        "total_tasks": len(tasks),
        "enabled_tasks": sum(1 for t in tasks if t.enabled),
        "scheduled_tasks": sum(1 for t in tasks if t.schedule),
        "total_runs": len(runs),
        "failed_runs": sum(1 for r in runs if r.status == "failed"),
    }


def _duration_seconds(run: models.TaskRun) -> float | None:
    if run.finished_at is None:
        return None
    return (run.finished_at - run.started_at).total_seconds()


def metrics(db: Session, days: int = 14) -> dict:
    """Aggregate run analytics: success rate, durations, daily buckets, recent."""
    runs = db.scalars(select(models.TaskRun)).all()
    finished = [r for r in runs if r.status in ("success", "failed")]
    total = len(finished)
    success = sum(1 for r in finished if r.status == "success")
    success_rate = round(success / total * 100, 1) if total else 0.0

    durations = [d for r in finished if (d := _duration_seconds(r)) is not None]
    avg_duration = round(sum(durations) / len(durations), 2) if durations else 0.0
    max_duration = round(max(durations), 2) if durations else 0.0

    day_success: dict[str, int] = defaultdict(int)
    day_failed: dict[str, int] = defaultdict(int)
    for r in finished:
        key = r.started_at.date().isoformat()
        (day_success if r.status == "success" else day_failed)[key] += 1

    today = datetime.now(timezone.utc).date()
    daily = [
        {
            "date": (d := (today - timedelta(days=i)).isoformat()),
            "success": day_success.get(d, 0),
            "failed": day_failed.get(d, 0),
        }
        for i in range(days - 1, -1, -1)
    ]

    recent_rows = db.scalars(
        select(models.TaskRun).order_by(models.TaskRun.started_at.desc()).limit(10)
    ).all()
    recent = [
        {
            "id": r.id,
            "task_id": r.task_id,
            "task_name": r.task.name if r.task else "—",
            "status": r.status,
            "trigger": r.trigger,
            "started_at": r.started_at.isoformat(),
            "duration": round(d, 2) if (d := _duration_seconds(r)) is not None else None,
        }
        for r in recent_rows
    ]

    return {
        "success_rate": success_rate,
        "avg_duration": avg_duration,
        "max_duration": max_duration,
        "total_runs": total,
        "success_runs": success,
        "failed_runs": total - success,
        "daily": daily,
        "recent": recent,
    }
