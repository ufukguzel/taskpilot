"""Failure notifications via webhook and/or SMTP e-mail.

Channels are configured globally through environment variables; a task opts in
with ``notify_on_failure``. If no channel is configured, notifying is a no-op.
Failures here never propagate — a broken notifier must not fail the task run.
"""
from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage

import httpx

from app import models

logger = logging.getLogger("taskpilot.notifications")

WEBHOOK_TIMEOUT_SECONDS = 10
SMTP_TIMEOUT_SECONDS = 15


def _summary(task: models.Task, run: models.TaskRun) -> str:
    tail = (run.output or "").splitlines()[-15:]
    return (
        f"Task '{task.name}' (#{task.id}) FAILED\n"
        f"Run #{run.id} · trigger: {run.trigger}\n"
        f"Started: {run.started_at}\n\n"
        f"Output (son satırlar):\n" + "\n".join(tail)
    )


def _send_webhook(task: models.Task, run: models.TaskRun) -> None:
    url = os.getenv("NOTIFY_WEBHOOK_URL", "").strip()
    if not url:
        return
    payload = {
        "event": "task_failed",
        "task_id": task.id,
        "task_name": task.name,
        "run_id": run.id,
        "trigger": run.trigger,
        "started_at": run.started_at.isoformat(),
        "text": _summary(task, run),
    }
    try:
        httpx.post(url, json=payload, timeout=WEBHOOK_TIMEOUT_SECONDS)
        logger.info("Webhook notification sent for task %s", task.id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook notification failed: %s", exc)


def _send_email(task: models.Task, run: models.TaskRun) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    to_addr = os.getenv("NOTIFY_EMAIL_TO", "").strip()
    if not host or not to_addr:
        return

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("SMTP_FROM", user or "taskpilot@localhost")

    msg = EmailMessage()
    msg["Subject"] = f"[TaskPilot] '{task.name}' başarısız oldu"
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.set_content(_summary(task, run))

    try:
        with smtplib.SMTP(host, port, timeout=SMTP_TIMEOUT_SECONDS) as server:
            server.ehlo()
            if os.getenv("SMTP_STARTTLS", "true").lower() == "true":
                server.starttls()
                server.ehlo()
            if user:
                server.login(user, password)
            server.send_message(msg)
        logger.info("Email notification sent for task %s", task.id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Email notification failed: %s", exc)


def notify_failure(task: models.Task, run: models.TaskRun) -> None:
    """Send configured failure notifications for a failed run (best-effort)."""
    _send_webhook(task, run)
    _send_email(task, run)
