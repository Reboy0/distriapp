from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, get_onec_connector, require_distributor
from app.db.session import get_db
from app.integrations.onec.base import OneCConnector
from app.models.enums import SyncType
from app.models.sync_log import SyncLog
from app.schemas.sync import SyncLogOut
from app.services.catalog_sync import sync_catalog
from app.services.payments_sync import sync_payment_statuses

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.post("/sync", response_model=list[SyncLogOut])
async def manual_sync(
    ctx: AuthContext = Depends(require_distributor),
    connector: OneCConnector = Depends(get_onec_connector),
    db: AsyncSession = Depends(get_db),
):
    """INT-5: "Оновити дані з 1С" — on-demand catalog + payment sync."""
    catalog_log = await sync_catalog(db, connector, ctx.tenant_id)
    payments_log = await sync_payment_statuses(db, connector, ctx.tenant_id, SyncType.manual)
    await db.commit()
    return [catalog_log, payments_log]


@router.get("/sync-log", response_model=list[SyncLogOut])
async def get_sync_log(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    """INT-6 (P1): visible to distributor and admin."""
    result = await db.execute(
        select(SyncLog)
        .where(SyncLog.distributor_id == ctx.tenant_id)
        .order_by(SyncLog.started_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())
