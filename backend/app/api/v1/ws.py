import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.ws.manager import manager

router = APIRouter(tags=["ws"])


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, token: str):
    """Single live-update channel per session — pushes chat_message and
    order_update events (see app/ws/events.py) so the client/distributor
    UIs don't need to poll or manually refresh."""
    try:
        payload = decode_access_token(token)
    except ValueError:
        await websocket.close(code=4401)
        return

    role = payload.get("role")
    if role == "client":
        client_id = uuid.UUID(payload["sub"])
        await manager.connect_client(client_id, websocket)
        try:
            while True:
                await websocket.receive_text()  # keepalive/ping; no client->server messages expected
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect_client(client_id, websocket)
    elif role == "distributor":
        distributor_id = uuid.UUID(payload["tenant_id"])
        await manager.connect_distributor(distributor_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect_distributor(distributor_id, websocket)
    else:
        await websocket.close(code=4403)
