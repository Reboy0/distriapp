import uuid
from datetime import date

from pydantic import BaseModel

from app.schemas.common import ORMModel


class PointCreate(BaseModel):
    name: str
    address: str


class PointDefermentUpdate(BaseModel):
    deferment_until: date | None = None


class PointOut(ORMModel):
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    address: str
    is_active: bool
    deferment_until: date | None
    is_blocked: bool = False
    blocked_reason: str | None = None
