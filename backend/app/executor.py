"""Task execution engine.

Runs a task (shell command or HTTP request), captures the output, and persists
a TaskRun record. Executions are wrapped in timeouts so a hung task cannot block
the scheduler thread indefinitely.

Security note: the "command" task type runs shell commands on the host. TaskPilot
is intended as a self-hosted, single-user tool on a trusted machine. Do not expose
it to untrusted networks without adding authentication and command allow-listing.
"""
from __future__ import annotations

import subprocess
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app import models

COMMAND_TIMEOUT_SECONDS = 60
HTTP_TIMEOUT_SECONDS = 30
MAX_OUTPUT_CHARS = 10_000


def _truncate(text: str) -> str:
    if len(text) > MAX_OUTPUT_CHARS:
        return text[:MAX_OUTPUT_CHARS] + "\n... (output truncated)"
    return text


def _run_command(command: str) -> tuple[bool, str]:
    try:
        completed = subprocess.run(  # noqa: S602 - intentional, documented above
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT_SECONDS,
        )
        output = (completed.stdout or "") + (completed.stderr or "")
        ok = completed.returncode == 0
        return ok, _truncate(f"[exit code: {completed.returncode}]\n{output}".strip())
    except subprocess.TimeoutExpired:
        return False, f"Command timed out after {COMMAND_TIMEOUT_SECONDS}s"
    except Exception as exc:  # noqa: BLE001 - surface any failure to the run log
        return False, f"Execution error: {exc}"


def _run_http(url: str, method: str) -> tuple[bool, str]:
    try:
        response = httpx.request(method, url, timeout=HTTP_TIMEOUT_SECONDS, follow_redirects=True)
        ok = response.is_success
        body = _truncate(response.text)
        return ok, f"[HTTP {response.status_code} {response.reason_phrase}]\n{body}"
    except Exception as exc:  # noqa: BLE001
        return False, f"Request error: {exc}"


def execute_task(db: Session, task: models.Task, trigger: str = "manual") -> models.TaskRun:
    """Execute a task synchronously and store a TaskRun row."""
    run = models.TaskRun(task_id=task.id, status="running", trigger=trigger)
    db.add(run)
    db.commit()
    db.refresh(run)

    if task.task_type == "http":
        ok, output = _run_http(task.url or "", task.http_method or "GET")
    else:
        ok, output = _run_command(task.command or "")

    run.status = "success" if ok else "failed"
    run.output = output
    run.finished_at = datetime.now(timezone.utc)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
