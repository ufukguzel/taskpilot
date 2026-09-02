"""WebSocket endpoint that streams live run events to the dashboard."""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.events import manager

router = APIRouter()


@router.websocket("/api/ws")
async def ws_events(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        # We don't expect client messages; loop keeps the connection open.
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:  # noqa: BLE001
        manager.disconnect(ws)
