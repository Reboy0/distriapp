import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.distributor import Distributor
    from app.models.point_product_price import PointProductPrice


class Product(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "products"

    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id"), index=True
    )
    external_code: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(255))
    unit: Mapped[str] = mapped_column(String(32))
    base_price_with_vat: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    stock_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    low_stock_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)

    distributor: Mapped["Distributor"] = relationship(back_populates="products")
    manual_prices: Mapped[list["PointProductPrice"]] = relationship(back_populates="product")
