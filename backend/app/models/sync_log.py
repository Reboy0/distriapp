import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import SyncStatus, SyncType


class SyncLog(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "sync_logs"

    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id"), index=True
    )
    type: Mapped[SyncType] = mapped_column(Enum(SyncType, name="sync_type"))
    status: Mapped[SyncStatus] = mapped_column(Enum(SyncStatus, name="sync_status"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(2000), nullable=True)
