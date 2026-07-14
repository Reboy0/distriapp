import uuid
from datetime import datetime

from app.models.enums import SyncStatus, SyncType
from app.schemas.common import ORMModel


class SyncLogOut(ORMModel):
    id: uuid.UUID
    type: SyncType
    status: SyncStatus
    started_at: datetime
    finished_at: datetime | None
    error_message: str | None
