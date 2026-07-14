from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.invitation import Invitation
    from app.models.product import Product


class Distributor(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "distributors"

    name: Mapped[str] = mapped_column(String(255))
    contacts: Mapped[str | None] = mapped_column(String(500), nullable=True)
    onec_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Single login per distributor tenant for the web panel (P0 skeleton;
    # per-staff-member accounts within a distributor are out of scope for v1).
    login_email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    clients: Mapped[list["Client"]] = relationship(back_populates="distributor")
    invitations: Mapped[list["Invitation"]] = relationship(back_populates="distributor")
    products: Mapped[list["Product"]] = relationship(back_populates="distributor")
