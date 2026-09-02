"""WebSocket connection manager for broadcasting live run events.

Task execution happens in worker threads (FastAPI's threadpool for manual runs,
APScheduler's thread for scheduled ones), while WebSocket sends must run on the
asyncio event loop. ``publish`` bridges the two with ``run_coroutine_threadsafe``.
"""
from __future__ import annotations

import asyncio
from typing import Any

from starlette.websockets import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Capture the running event loop (called on app startup)."""
        self._loop = loop

    def register(self, ws: WebSocket) -> None:
        """Add an already-accepted WebSocket to the broadcast set."""
        self._clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.discard(ws)

    async def _broadcast(self, message: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._clients):
            try:
                await ws.send_json(message)
            except Exception:  # noqa: BLE001 - drop clients that errored
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    def publish(self, message: dict[str, Any]) -> None:
        """Thread-safe: schedule a broadcast on the event loop from any thread."""
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self._broadcast(message), self._loop)


manager = ConnectionManager()
