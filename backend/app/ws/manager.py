import uuid
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """In-process pub/sub for live updates (chat messages, order changes).

    Single-process only — fine for this skeleton (one uvicorn worker). A
    multi-worker deployment would need a shared broker (Redis pub/sub) since
    each worker has its own in-memory set of connections.
    """

    def __init__(self) -> None:
        self._clients: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)
        self._distributors: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)

    async def connect_client(self, client_id: uuid.UUID, ws: WebSocket) -> None:
        await ws.accept()
        self._clients[client_id].add(ws)

    async def connect_distributor(self, distributor_id: uuid.UUID, ws: WebSocket) -> None:
        await ws.accept()
        self._distributors[distributor_id].add(ws)

    def disconnect_client(self, client_id: uuid.UUID, ws: WebSocket) -> None:
        self._clients[client_id].discard(ws)

    def disconnect_distributor(self, distributor_id: uuid.UUID, ws: WebSocket) -> None:
        self._distributors[distributor_id].discard(ws)

    async def send_to_client(self, client_id: uuid.UUID, event: dict[str, Any]) -> None:
        for ws in list(self._clients.get(client_id, ())):
            try:
                await ws.send_json(event)
            except Exception:
                self._clients[client_id].discard(ws)

    async def send_to_distributor(self, distributor_id: uuid.UUID, event: dict[str, Any]) -> None:
        for ws in list(self._distributors.get(distributor_id, ())):
            try:
                await ws.send_json(event)
            except Exception:
                self._distributors[distributor_id].discard(ws)


manager = ConnectionManager()
