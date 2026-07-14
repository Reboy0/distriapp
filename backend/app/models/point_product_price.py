import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.point_of_sale import PointOfSale
    from app.models.product import Product


class PointProductPrice(UUIDPKMixin, Base):
    """Manual per-point price override. Presence of a row here always wins over
    Product.base_price_with_vat and is never touched by the nightly 1C import."""

    __tablename__ = "point_product_prices"
    __table_args__ = (UniqueConstraint("point_id", "product_id", name="uq_point_product"),)

    point_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("points_of_sale.id"), index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), index=True
    )
    manual_price_with_vat: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    point: Mapped["PointOfSale"] = relationship(back_populates="manual_prices")
    product: Mapped["Product"] = relationship(back_populates="manual_prices")
