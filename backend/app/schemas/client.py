import uuid

from app.schemas.common import ORMModel


class ClientOut(ORMModel):
    id: uuid.UUID
    name: str
    phone: str
    is_active: bool
