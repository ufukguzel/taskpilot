"""Seed a default admin user on first run (configurable via env)."""
from __future__ import annotations

import logging
import os

from app import auth, models
from app.database import SessionLocal

logger = logging.getLogger("taskpilot.seed")


def seed_admin() -> None:
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "admin123")

    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return
        user = models.User(username=username, hashed_password=auth.hash_password(password))
        db.add(user)
        db.commit()
        logger.warning(
            "Seeded default admin user %r. Change ADMIN_PASSWORD in production!", username
        )
    finally:
        db.close()
