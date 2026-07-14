import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    AuthContext,
    require_client,
    require_client_or_distributor,
    require_distributor,
)
from app.db.session import get_db
from app.models.point_of_sale import PointOfSale
from app.schemas.point import PointCreate, PointDefermentUpdate, PointOut
from app.services.blocking import get_block_reason
from app.services.deferment import set_deferment

router = APIRouter(prefix="/points", tags=["points"])


async def _to_point_out(db: AsyncSession, point: PointOfSale) -> PointOut:
    reason = await get_block_reason(db, point, date.today())
    return PointOut(
        id=point.id,
        client_id=point.client_id,
        name=point.name,
        address=point.address,
        is_active=point.is_active,
        deferment_until=point.deferment_until,
        is_blocked=reason is not None,
        blocked_reason=reason,
    )


@router.get("", response_model=list[PointOut])
async def list_points(
    ctx: AuthContext = Depends(require_client_or_distributor), db: AsyncSession = Depends(get_db)
):
    """POS-1: client sees only their own points. POS-3: distributor sees
    every point of every one of their clients — same endpoint, scoped by
    the caller's role."""
    if ctx.role == "client":
        query = select(PointOfSale).where(PointOfSale.client_id == ctx.subject_id)
    else:
        query = select(PointOfSale).where(PointOfSale.distributor_id == ctx.tenant_id)
    result = await db.execute(query)
    return [await _to_point_out(db, p) for p in result.scalars().all()]


@router.post("", response_model=PointOut)
async def create_point(
    payload: PointCreate,
    ctx: AuthContext = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """POS-2: active immediately, no distributor approval needed; base prices
    apply until the distributor sets manual overrides."""
    point = PointOfSale(
        client_id=ctx.subject_id,
        distributor_id=ctx.tenant_id,
        name=payload.name,
        address=payload.address,
    )
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return await _to_point_out(db, point)


@router.patch("/{point_id}/deferment", response_model=PointOut)
async def update_deferment(
    point_id: uuid.UUID,
    payload: PointDefermentUpdate,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    """ORD-8: deferment lives on the point, not the order; distributor can
    set, change, or clear it (pass null)."""
    result = await db.execute(
        select(PointOfSale).where(
            PointOfSale.id == point_id, PointOfSale.distributor_id == ctx.tenant_id
        )
    )
    point = result.scalar_one_or_none()
    if point is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Point not found")

    await set_deferment(db, point, payload.deferment_until)
    await db.commit()
    await db.refresh(point)
    return await _to_point_out(db, point)
