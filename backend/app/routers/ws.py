"""WebSocket endpoint that streams live run events to the dashboard."""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.auth import decode_token
from app.events import manager

router = APIRouter()


@router.websocket("/api/ws")
async def ws_events(ws: WebSocket) -> None:
    # Authenticate via ?token=<jwt> query param (browsers can't set WS headers).
    # Accept first, then close on failure — a pre-accept close can surface as a
    # 500 through some proxies.
    await ws.accept()
    token = ws.query_params.get("token")
    if not token or not decode_token(token):
        await ws.close(code=1008)  # policy violation
        return
    manager.register(ws)
    try:
        # We don't expect client messages; loop keeps the connection open.
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:  # noqa: BLE001
        manager.disconnect(ws)
