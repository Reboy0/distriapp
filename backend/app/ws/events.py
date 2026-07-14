import uuid

from app.models.chat import ChatMessage
from app.models.order import Order
from app.schemas.chat import ChatMessageOut
from app.schemas.order import OrderOut
from app.ws.manager import manager


async def broadcast_chat_message(
    message: ChatMessage, client_id: uuid.UUID, distributor_id: uuid.UUID
) -> None:
    event = {
        "type": "chat_message",
        "client_id": str(client_id),
        "message": ChatMessageOut.model_validate(message).model_dump(mode="json"),
    }
    await manager.send_to_client(client_id, event)
    await manager.send_to_distributor(distributor_id, event)


async def broadcast_order_update(order: Order) -> None:
    event = {
        "type": "order_update",
        "order": OrderOut.model_validate(order).model_dump(mode="json"),
    }
    await manager.send_to_client(order.client_id, event)
    await manager.send_to_distributor(order.distributor_id, event)
