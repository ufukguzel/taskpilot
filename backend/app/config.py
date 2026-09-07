"""Runtime configuration helpers with secure-by-default behavior on hosting.

On a hosted platform (Render sets RENDER=true), demo mode defaults ON and a
random SECRET_KEY is generated when none is provided — so a public deployment is
safe even without manual environment configuration. Both can still be overridden
with explicit environment variables.
"""
from __future__ import annotations

import os
import secrets


def is_hosted() -> bool:
    """True when running on a known hosting platform (Render, Heroku, Fly)."""
    return any(os.getenv(k) for k in ("RENDER", "DYNO", "FLY_APP_NAME"))


def is_demo_mode() -> bool:
    """Demo mode disables shell command execution and publishes a demo account.

    Explicit DEMO_MODE wins; otherwise it defaults ON when hosted, OFF locally.
    """
    value = os.getenv("DEMO_MODE")
    if value is not None:
        return value.strip().lower() == "true"
    return is_hosted()


def get_secret_key() -> str:
    """JWT signing key. Env value wins; on hosting without one, generate a key and
    persist it to a file so it survives restarts and is shared across workers
    (set SECRET_KEY explicitly to control it). Falls back to a dev key locally.
    """
    key = os.getenv("SECRET_KEY")
    if key:
        return key
    if is_hosted():
        path = os.getenv("SECRET_KEY_FILE", "/data/.secret_key")
        try:
            if os.path.exists(path):
                stored = open(path, encoding="utf-8").read().strip()
                if stored:
                    return stored
            generated = secrets.token_hex(32)
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(generated)
            return generated
        except Exception:  # noqa: BLE001 - fall back to an in-memory key
            return secrets.token_hex(32)
    return "dev-secret-change-me-in-production"
