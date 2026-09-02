"""Database CRUD helpers for tasks and runs."""
from __future__ import annotations

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
