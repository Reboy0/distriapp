import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import OrderStatus, PaymentStatus
from app.schemas.common import Money, ORMModel


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    qty: Decimal


class OrderCreate(BaseModel):
    point_id: uuid.UUID
    items: list[OrderItemCreate]


class OrderItemOut(ORMModel):
    product_id: uuid.UUID
    qty: Money
    unit_price_with_vat: Money
    sum: Money


class OrderOut(ORMModel):
    id: uuid.UUID
    point_id: uuid.UUID
    client_id: uuid.UUID
    status: OrderStatus
    payment_status: PaymentStatus
    payment_status_manual: bool
    cancel_comment: str | None
    onec_document_id: str | None
    payment_url: str | None
    created_at: datetime
    sent_at: datetime | None
    cancelled_at: datetime | None
    items: list[OrderItemOut] = []


class OrderCancelRequest(BaseModel):
    comment: str


class OrderPaymentStatusUpdate(BaseModel):
    payment_status: PaymentStatus


class OrderPaymentLinkUpdate(BaseModel):
    payment_url: str | None
