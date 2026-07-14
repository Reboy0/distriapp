import uuid
from datetime import datetime

from app.models.enums import InvitationStatus
from app.schemas.common import ORMModel


class InvitationOut(ORMModel):
    id: uuid.UUID
    code: str
    status: InvitationStatus
    created_at: datetime
    expires_at: datetime
