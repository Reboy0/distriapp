import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import OrderStatus, PaymentStatus

if TYPE_CHECKING:
    from app.models.order_item import OrderItem
    from app.models.point_of_sale import PointOfSale


class Order(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "orders"

    point_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("points_of_sale.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id"), index=True
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), default=OrderStatus.created
    )
    # Deliberately NOT set on creation (ORD-6) — only after delivery, via 1C sync or manual action.
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.none
    )
    # Once true, payment_status is final and 1C sync must never overwrite it (ORD-10 / INT-3).
    payment_status_manual: Mapped[bool] = mapped_column(Boolean, default=False)
    cancel_comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    onec_document_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # Not a real payment integration (explicitly out of scope) — the
    # distributor pastes a link from whatever payment tool they already use
    # (invoicing service, bank, etc.) and the client just sees/clicks it.
    payment_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    send_attempts: Mapped[int] = mapped_column(default=0)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    point: Mapped["PointOfSale"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
