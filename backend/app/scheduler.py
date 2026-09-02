"""APScheduler integration: registers cron jobs for enabled, scheduled tasks."""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app import models
from app.database import SessionLocal
from app.executor import execute_task

logger = logging.getLogger("taskpilot.scheduler")

scheduler = BackgroundScheduler(timezone="UTC")


def _job_id(task_id: int) -> str:
    return f"task-{task_id}"


def _run_scheduled_task(task_id: int) -> None:
    """Job body: load a fresh session and execute the task."""
    db = SessionLocal()
    try:
        task = db.get(models.Task, task_id)
        if task and task.enabled:
            execute_task(db, task, trigger="scheduled")
    except Exception:  # noqa: BLE001
        logger.exception("Scheduled run failed for task %s", task_id)
    finally:
        db.close()


def is_valid_cron(expression: str) -> bool:
    """Return True if the string is a parseable 5-field cron expression."""
    try:
        CronTrigger.from_crontab(expression)
        return True
    except (ValueError, TypeError):
        return False


def sync_task(task: models.Task) -> None:
    """Add, update or remove a task's cron job to match its current state."""
    job_id = _job_id(task.id)
    existing = scheduler.get_job(job_id)

    should_schedule = bool(task.enabled and task.schedule and is_valid_cron(task.schedule))
    if not should_schedule:
        if existing:
            scheduler.remove_job(job_id)
        return

    trigger = CronTrigger.from_crontab(task.schedule)  # type: ignore[arg-type]
    if existing:
        scheduler.reschedule_job(job_id, trigger=trigger)
    else:
        scheduler.add_job(
            _run_scheduled_task,
            trigger=trigger,
            id=job_id,
            args=[task.id],
            replace_existing=True,
        )


def remove_task(task_id: int) -> None:
    job_id = _job_id(task_id)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)


def start() -> None:
    """Start the scheduler and register all currently scheduled tasks."""
    if not scheduler.running:
        scheduler.start()
    db = SessionLocal()
    try:
        for task in db.query(models.Task).all():
            sync_task(task)
    finally:
        db.close()


def shutdown() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
