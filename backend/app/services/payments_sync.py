from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.onec.base import OneCConnector
from app.models.enums import OrderStatus, PaymentStatus, SyncStatus, SyncType
from app.models.order import Order
from app.models.sync_log import SyncLog


async def sync_payment_statuses(
    db: AsyncSession, connector: OneCConnector, distributor_id, sync_type: SyncType = SyncType.payments
) -> SyncLog:
    """INT-3: runs 3x/day (09:00/15:00/20:00 Kyiv) or on-demand (INT-5).
    A manually-set payment_status (payment_status_manual=True) is never
    overwritten here — that's the whole point of ORD-10 being "final"."""
    started_at = datetime.now(timezone.utc)
    log = SyncLog(
        distributor_id=distributor_id,
        type=sync_type,
        status=SyncStatus.success,
        started_at=started_at,
    )
    try:
        statuses = await connector.fetch_payment_statuses()
        by_doc_id = {s.onec_document_id: s for s in statuses}

        result = await db.execute(
            select(Order).where(
                Order.distributor_id == distributor_id,
                Order.payment_status_manual.is_(False),
                Order.status == OrderStatus.sent_to_1c,
                Order.onec_document_id.isnot(None),
            )
        )
        for order in result.scalars().all():
            status = by_doc_id.get(order.onec_document_id)
            if status is None:
                continue
            order.payment_status = PaymentStatus.paid if status.is_paid else PaymentStatus.unpaid
    except Exception as exc:
        log.status = SyncStatus.error
        log.error_message = str(exc)

    log.finished_at = datetime.now(timezone.utc)
    db.add(log)
    await db.flush()
    return log
