import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ChatSender
from app.schemas.common import ORMModel


class ChatMessageCreate(BaseModel):
    text: str
    product_id: uuid.UUID | None = None


class ChatMessageOut(ORMModel):
    id: uuid.UUID
    sender_type: ChatSender
    text: str
    product_id: uuid.UUID | None
    created_at: datetime


class ChatThreadOut(ORMModel):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
