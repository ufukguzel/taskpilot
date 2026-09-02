"""Task execution engine with live streaming.

Runs a task (shell command or HTTP request), streams each output line to
connected WebSocket clients in real time, and persists a TaskRun record.

Security note: the "command" task type runs shell commands on the host. TaskPilot
is intended as a self-hosted, single-user tool on a trusted machine. Do not expose
it to untrusted networks without adding authentication and command allow-listing.
"""
from __future__ import annotations

import os
import subprocess
import threading
from collections.abc import Callable
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app import models, notifications
from app.events import manager

COMMAND_TIMEOUT_SECONDS = 60
HTTP_TIMEOUT_SECONDS = 30
MAX_OUTPUT_CHARS = 20_000

LineEmitter = Callable[[str], None]


def _run_command(command: str, emit: LineEmitter) -> bool:
    """Run a shell command, streaming stdout+stderr line by line via ``emit``."""
    try:
        proc = subprocess.Popen(  # noqa: S602 - intentional, documented above
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except Exception as exc:  # noqa: BLE001
        emit(f"Execution error: {exc}")
        return False

    timed_out = threading.Event()

    def _kill() -> None:
        timed_out.set()
        proc.kill()

    watchdog = threading.Timer(COMMAND_TIMEOUT_SECONDS, _kill)
    watchdog.start()
    try:
        if proc.stdout is not None:
            for line in proc.stdout:
                emit(line.rstrip("\n"))
        proc.wait()
    finally:
        watchdog.cancel()

    if timed_out.is_set():
        emit(f"Command timed out after {COMMAND_TIMEOUT_SECONDS}s")
        return False
    emit(f"[exit code: {proc.returncode}]")
    return proc.returncode == 0


def _run_http(url: str, method: str, emit: LineEmitter) -> bool:
    try:
        emit(f"{method} {url}")
        response = httpx.request(method, url, timeout=HTTP_TIMEOUT_SECONDS, follow_redirects=True)
        emit(f"[HTTP {response.status_code} {response.reason_phrase}]")
        for line in response.text.splitlines():
            emit(line)
        return response.is_success
    except Exception as exc:  # noqa: BLE001
        emit(f"Request error: {exc}")
        return False


def execute_task(db: Session, task: models.Task, trigger: str = "manual") -> models.TaskRun:
    """Execute a task synchronously, streaming events, and store a TaskRun row."""
    run = models.TaskRun(task_id=task.id, status="running", trigger=trigger)
    db.add(run)
    db.commit()
    db.refresh(run)

    manager.publish(
        {
            "event": "run_started",
            "task_id": task.id,
            "run_id": run.id,
            "task_name": task.name,
            "trigger": trigger,
            "started_at": run.started_at.isoformat(),
        }
    )

    collected: list[str] = []

    def emit(line: str) -> None:
        if sum(len(x) for x in collected) < MAX_OUTPUT_CHARS:
            collected.append(line)
        manager.publish({"event": "log", "task_id": task.id, "run_id": run.id, "line": line})

    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    if task.task_type == "http":
        ok = _run_http(task.url or "", task.http_method or "GET", emit)
    elif demo_mode:
        # Public demo: never run arbitrary shell commands.
        emit("⚠️ Demo modu: komut çalıştırma güvenlik nedeniyle devre dışı.")
        emit("HTTP tipi görevler tam çalışır; komutu yerel kurulumda deneyebilirsin.")
        ok = True
    else:
        ok = _run_command(task.command or "", emit)

    run.status = "success" if ok else "failed"
    run.output = "\n".join(collected)
    run.finished_at = datetime.now(timezone.utc)
    db.add(run)
    db.commit()
    db.refresh(run)

    manager.publish(
        {
            "event": "run_finished",
            "task_id": task.id,
            "run_id": run.id,
            "status": run.status,
            "finished_at": run.finished_at.isoformat(),
        }
    )

    if not ok and task.notify_on_failure:
        notifications.notify_failure(task, run)

    return run
