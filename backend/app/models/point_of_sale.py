import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.order import Order
    from app.models.point_product_price import PointProductPrice


class PointOfSale(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "points_of_sale"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    deferment_until: Mapped[date | None] = mapped_column(Date, nullable=True)

    client: Mapped["Client"] = relationship(back_populates="points")
    manual_prices: Mapped[list["PointProductPrice"]] = relationship(back_populates="point")
    orders: Mapped[list["Order"]] = relationship(back_populates="point")

    def has_active_deferment(self, today: date) -> bool:
        return self.deferment_until is not None and today <= self.deferment_until
