import uuid
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import AvailabilityStatus
from app.schemas.common import Money, ORMModel


class ProductUpdate(BaseModel):
    low_stock_threshold: int | None = None
    is_new: bool | None = None


class ManualPriceSet(BaseModel):
    manual_price_with_vat: Decimal


class ProductOut(ORMModel):
    """Product as seen by the distributor — full detail, unlike CatalogItemOut."""

    id: uuid.UUID
    external_code: str
    name: str
    unit: str
    base_price_with_vat: Money
    stock_qty: Money
    low_stock_threshold: int | None
    is_new: bool


class CatalogItemOut(ORMModel):
    """Product as seen by a client for a specific point: resolved price,
    coarse availability status only — never exact stock_qty."""

    id: uuid.UUID
    name: str
    unit: str
    price_with_vat: Money
    is_manual_price: bool
    availability: AvailabilityStatus
    is_new: bool


class PointProductPriceOut(ORMModel):
    id: uuid.UUID
    point_id: uuid.UUID
    product_id: uuid.UUID
    manual_price_with_vat: Money
