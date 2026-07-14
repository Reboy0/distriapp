from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.onec.base import OneCConnector
from app.models.enums import SyncStatus, SyncType
from app.models.product import Product
from app.models.sync_log import SyncLog


async def sync_catalog(db: AsyncSession, connector: OneCConnector, distributor_id) -> SyncLog:
    """INT-2: daily import of nomenclature/stock/base prices. Never touches
    PointProductPrice overrides (CAT-2) — those live in a separate table."""
    started_at = datetime.now(timezone.utc)
    log = SyncLog(
        distributor_id=distributor_id,
        type=SyncType.catalog,
        status=SyncStatus.success,
        started_at=started_at,
    )
    try:
        items = await connector.fetch_catalog()
        result = await db.execute(
            select(Product).where(Product.distributor_id == distributor_id)
        )
        existing = {p.external_code: p for p in result.scalars().all()}

        for item in items:
            product = existing.get(item.external_code)
            if product is None:
                db.add(
                    Product(
                        distributor_id=distributor_id,
                        external_code=item.external_code,
                        name=item.name,
                        unit=item.unit,
                        base_price_with_vat=item.base_price_with_vat,
                        stock_qty=item.stock_qty,
                    )
                )
            else:
                product.name = item.name
                product.unit = item.unit
                product.base_price_with_vat = item.base_price_with_vat
                product.stock_qty = item.stock_qty
    except Exception as exc:
        log.status = SyncStatus.error
        log.error_message = str(exc)

    log.finished_at = datetime.now(timezone.utc)
    db.add(log)
    await db.flush()
    return log
