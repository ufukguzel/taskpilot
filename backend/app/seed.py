"""Seed the admin user (and, in demo mode, a public demo user) on startup."""
from __future__ import annotations

import logging
import os

from sqlalchemy.orm import Session

from app import auth, models
from app.database import SessionLocal

logger = logging.getLogger("taskpilot.seed")


def _ensure_user(db: Session, username: str, password: str) -> None:
    if db.query(models.User).filter(models.User.username == username).first():
        return
    db.add(models.User(username=username, hashed_password=auth.hash_password(password)))
    db.commit()
    logger.warning("Seeded user %r (change its password in production!)", username)


def seed_admin() -> None:
    db = SessionLocal()
    try:
        _ensure_user(
            db,
            os.getenv("ADMIN_USERNAME", "admin"),
            os.getenv("ADMIN_PASSWORD", "admin123"),
        )
        # In demo mode, publish a safe shared account so visitors can try the app.
        if os.getenv("DEMO_MODE", "false").lower() == "true":
            _ensure_user(
                db,
                os.getenv("DEMO_USERNAME", "demo"),
                os.getenv("DEMO_PASSWORD", "demo1234"),
            )
    finally:
        db.close()
