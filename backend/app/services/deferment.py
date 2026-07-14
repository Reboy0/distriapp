from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.point_of_sale import PointOfSale


async def set_deferment(db: AsyncSession, point: PointOfSale, until: date | None) -> PointOfSale:
    """ORD-8: distributor manually sets/changes/clears a point's deferment
    date. No transition job is needed elsewhere — blocking.get_block_reason
    re-evaluates has_active_deferment() against "today" on every read, so the
    point flips to "debtor" automatically once `until` is in the past."""
    point.deferment_until = until
    await db.flush()
    return point
