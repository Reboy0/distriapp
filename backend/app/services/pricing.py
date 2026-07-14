from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.point_product_price import PointProductPrice
from app.models.product import Product


async def resolve_price(
    db: AsyncSession, point_id, product: Product
) -> tuple[Decimal, bool]:
    """Returns (price_with_vat, is_manual). Manual per-point override always
    wins over Product.base_price_with_vat and survives nightly 1C imports
    (CAT-2)."""
    result = await db.execute(
        select(PointProductPrice).where(
            PointProductPrice.point_id == point_id,
            PointProductPrice.product_id == product.id,
        )
    )
    override = result.scalar_one_or_none()
    if override is not None:
        return override.manual_price_with_vat, True
    return product.base_price_with_vat, False


async def set_manual_price(
    db: AsyncSession, point_id, product_id, price: Decimal
) -> PointProductPrice:
    result = await db.execute(
        select(PointProductPrice).where(
            PointProductPrice.point_id == point_id,
            PointProductPrice.product_id == product_id,
        )
    )
    override = result.scalar_one_or_none()
    if override is None:
        override = PointProductPrice(
            point_id=point_id, product_id=product_id, manual_price_with_vat=price
        )
        db.add(override)
    else:
        override.manual_price_with_vat = price
    await db.flush()
    return override


async def reset_to_base_price(db: AsyncSession, point_id, product_id) -> None:
    result = await db.execute(
        select(PointProductPrice).where(
            PointProductPrice.point_id == point_id,
            PointProductPrice.product_id == product_id,
        )
    )
    override = result.scalar_one_or_none()
    if override is not None:
        await db.delete(override)
        await db.flush()
