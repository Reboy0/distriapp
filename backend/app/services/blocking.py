from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentStatus
from app.models.order import Order
from app.models.point_of_sale import PointOfSale


async def get_block_reason(db: AsyncSession, point: PointOfSale, today: date) -> str | None:
    """Section 4.3 rule: a point is blocked for new orders iff it has >=1
    order with payment_status=unpaid AND it has no active deferment. Returns
    a human-readable reason, or None if the point is not blocked."""
    if point.has_active_deferment(today):
        return None

    result = await db.execute(
        select(Order).where(
            Order.point_id == point.id,
            Order.payment_status == PaymentStatus.unpaid,
        )
    )
    unpaid_order = result.scalars().first()
    if unpaid_order is None:
        return None

    return f"Точка заблокована: неоплачене замовлення {unpaid_order.id}"


async def is_blocked(db: AsyncSession, point: PointOfSale, today: date) -> bool:
    return await get_block_reason(db, point, today) is not None
