import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.onec.base import OneCConnector, OneCOrderLine
from app.models.enums import OrderStatus, PaymentStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.point_of_sale import PointOfSale
from app.models.product import Product
from app.services.blocking import get_block_reason
from app.services.pricing import resolve_price


class PointBlockedError(Exception):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


async def create_order(
    db: AsyncSession,
    connector: OneCConnector,
    client_id: uuid.UUID,
    distributor_id: uuid.UUID,
    point: PointOfSale,
    items: list[tuple[Product, Decimal]],
) -> Order:
    """ORD-1..5: no confirmation step — creating pushes straight to 1C.
    Raises PointBlockedError if the point is currently blocked (section 4.3)."""
    reason = await get_block_reason(db, point, date.today())
    if reason is not None:
        raise PointBlockedError(reason)

    order = Order(
        point_id=point.id,
        client_id=client_id,
        distributor_id=distributor_id,
        status=OrderStatus.created,
        payment_status=PaymentStatus.none,  # ORD-6: never set automatically on creation
    )
    order_lines: list[OneCOrderLine] = []
    for product, qty in items:
        price, _is_manual = await resolve_price(db, point.id, product)
        line_sum = price * qty
        order.items.append(
            OrderItem(
                product_id=product.id,
                qty=qty,
                unit_price_with_vat=price,
                sum=line_sum,
            )
        )
        order_lines.append(
            OneCOrderLine(
                external_code=product.external_code, qty=qty, unit_price_with_vat=price
            )
        )

    db.add(order)
    await db.flush()

    await send_to_1c(db, connector, order, point, order_lines)
    return order


async def send_to_1c(
    db: AsyncSession,
    connector: OneCConnector,
    order: Order,
    point: PointOfSale,
    lines: list[OneCOrderLine],
) -> None:
    """ORD-5/INT-4: push immediately; on failure mark pending_1c so a retry
    job (up to settings.order_send_max_retries, exponential backoff — Q4)
    can pick it up without losing the order."""
    order.status = OrderStatus.pending_1c
    order.send_attempts += 1
    try:
        onec_document_id = await connector.push_order(str(order.id), str(point.id), lines)
    except Exception:
        await db.flush()
        return

    order.status = OrderStatus.sent_to_1c
    order.onec_document_id = onec_document_id
    order.sent_at = datetime.now(timezone.utc)
    await db.flush()


async def cancel_order(db: AsyncSession, order: Order, comment: str) -> Order:
    """ORD-11: distributor-only, with a required comment. 1C is never
    touched automatically — the un-posted document is deleted by the 1C
    operator by hand."""
    order.status = OrderStatus.cancelled
    order.cancel_comment = comment
    order.cancelled_at = datetime.now(timezone.utc)
    await db.flush()
    return order


async def set_payment_status_manual(
    db: AsyncSession, order: Order, payment_status: PaymentStatus
) -> Order:
    """ORD-10: a manual mark is final — later 1C syncs must never overwrite it."""
    order.payment_status = payment_status
    order.payment_status_manual = True
    await db.flush()
    return order


async def list_orders_pending_retry(db: AsyncSession) -> list[Order]:
    result = await db.execute(
        select(Order).where(
            Order.status == OrderStatus.pending_1c,
            Order.send_attempts < settings.order_send_max_retries,
        )
    )
    return list(result.scalars().all())
