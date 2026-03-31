from __future__ import annotations

import asyncio
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket


_event_buffer: deque[dict[str, Any]] = deque(maxlen=1000)
_subscribers: dict[str, set[WebSocket]] = defaultdict(set)
_lock = asyncio.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def publish_processing_event(paper_id: str, stage: str, status: str, message: str, **payload: Any) -> None:
    event = {
        "paper_id": paper_id,
        "stage": stage,
        "status": status,
        "message": message,
        "payload": payload,
        "timestamp": _now_iso(),
    }

    async with _lock:
        _event_buffer.append(event)
        targets = list(_subscribers.get(paper_id, set())) + list(_subscribers.get("*", set()))

    stale: list[WebSocket] = []
    for ws in targets:
        try:
            await ws.send_json(event)
        except Exception:
            stale.append(ws)

    if stale:
        async with _lock:
            for ws in stale:
                _subscribers.get(paper_id, set()).discard(ws)
                _subscribers.get("*", set()).discard(ws)


async def subscribe(websocket: WebSocket, paper_id: str | None = None) -> str:
    key = paper_id or "*"
    await websocket.accept()
    async with _lock:
        _subscribers[key].add(websocket)
    return key


async def unsubscribe(websocket: WebSocket, key: str) -> None:
    async with _lock:
        if key in _subscribers:
            _subscribers[key].discard(websocket)


def list_events(paper_id: str | None = None, limit: int = 200) -> list[dict[str, Any]]:
    events = list(_event_buffer)
    if paper_id:
        events = [e for e in events if e.get("paper_id") == paper_id]
    return events[-limit:]
