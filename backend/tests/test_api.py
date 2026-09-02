"""API tests using FastAPI's TestClient against an isolated SQLite database."""
from __future__ import annotations

import os
import tempfile

import pytest

# Use a throwaway database file for the test session.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    """Authenticated client using the seeded default admin (admin/admin123)."""
    with TestClient(app) as c:
        token = c.post(
            "/api/auth/login", json={"username": "admin", "password": "admin123"}
        ).json()["access_token"]
        c.headers.update({"Authorization": f"Bearer {token}"})
        yield c


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_requires_auth():
    with TestClient(app) as anon:
        assert anon.get("/api/tasks").status_code == 401
        assert anon.get("/api/stats").status_code == 401


def test_login_bad_credentials():
    with TestClient(app) as c:
        r = c.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
        assert r.status_code == 401


def test_me(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["username"] == "admin"


def test_create_and_run_command_task(client):
    payload = {
        "name": "Echo hello",
        "task_type": "command",
        "command": "echo hello-taskpilot",
    }
    r = client.post("/api/tasks", json=payload)
    assert r.status_code == 201, r.text
    task = r.json()
    assert task["name"] == "Echo hello"
    assert task["last_run"] is None

    run = client.post(f"/api/tasks/{task['id']}/run")
    assert run.status_code == 200, run.text
    body = run.json()
    assert body["status"] == "success"
    assert "hello-taskpilot" in body["output"]


def test_command_task_requires_command(client):
    r = client.post("/api/tasks", json={"name": "bad", "task_type": "command"})
    assert r.status_code == 422


def test_invalid_cron_rejected(client):
    payload = {
        "name": "cron task",
        "task_type": "command",
        "command": "echo hi",
        "schedule": "not a cron",
    }
    r = client.post("/api/tasks", json=payload)
    assert r.status_code == 422


def test_update_and_delete(client):
    created = client.post(
        "/api/tasks",
        json={"name": "temp", "task_type": "command", "command": "echo x"},
    ).json()
    tid = created["id"]

    upd = client.patch(f"/api/tasks/{tid}", json={"enabled": False, "name": "renamed"})
    assert upd.status_code == 200
    assert upd.json()["name"] == "renamed"
    assert upd.json()["enabled"] is False

    dele = client.delete(f"/api/tasks/{tid}")
    assert dele.status_code == 204
    assert client.get(f"/api/tasks/{tid}").status_code == 404


def test_stats(client):
    r = client.get("/api/stats")
    assert r.status_code == 200
    assert "total_tasks" in r.json()
