import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import InvitationStatus

if TYPE_CHECKING:
    from app.models.distributor import Distributor


class Invitation(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "invitations"

    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id"), index=True
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus, name="invitation_status"), default=InvitationStatus.active
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_by_client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True
    )

    distributor: Mapped["Distributor"] = relationship(back_populates="invitations")
