import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import (
    AuthContext,
    get_onec_connector,
    require_client,
    require_client_or_distributor,
    require_distributor,
)
from app.db.session import get_db
from app.integrations.onec.base import OneCConnector
from app.models.enums import PaymentStatus
from app.models.order import Order
from app.models.point_of_sale import PointOfSale
from app.models.product import Product
from app.schemas.order import (
    OrderCancelRequest,
    OrderCreate,
    OrderItemOut,
    OrderOut,
    OrderPaymentLinkUpdate,
    OrderPaymentStatusUpdate,
)
from app.services.orders import PointBlockedError, cancel_order, create_order, set_payment_status_manual
from app.ws.events import broadcast_order_update

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut)
async def submit_order(
    payload: OrderCreate,
    ctx: AuthContext = Depends(require_client),
    connector: OneCConnector = Depends(get_onec_connector),
    db: AsyncSession = Depends(get_db),
):
    """ORD-3/4: "Замовити" creates the order and pushes it to 1C in one
    step — there is no separate confirmation screen."""
    point_result = await db.execute(
        select(PointOfSale).where(
            PointOfSale.id == payload.point_id, PointOfSale.client_id == ctx.subject_id
        )
    )
    point = point_result.scalar_one_or_none()
    if point is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Point not found")

    if not payload.items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order must have at least one item")

    product_ids = [i.product_id for i in payload.items]
    products_result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products_by_id = {p.id: p for p in products_result.scalars().all()}

    items = []
    for line in payload.items:
        product = products_by_id.get(line.product_id)
        if product is None or product.distributor_id != ctx.tenant_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {line.product_id} not found")
        items.append((product, line.qty))

    try:
        order = await create_order(
            db,
            connector,
            client_id=ctx.subject_id,
            distributor_id=ctx.tenant_id,
            point=point,
            items=items,
        )
    except PointBlockedError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, exc.reason) from exc

    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    await broadcast_order_update(order)
    return order


@router.get("", response_model=list[OrderOut])
async def list_orders(
    point_id: uuid.UUID | None = None,
    payment_status: PaymentStatus | None = None,
    ctx: AuthContext = Depends(require_client_or_distributor),
    db: AsyncSession = Depends(get_db),
):
    """ORD-12: history for both sides, filterable by point (and, for the
    distributor, by payment status per ORD-9) — same endpoint, scoped by
    the caller's role."""
    if ctx.role == "client":
        query = select(Order).options(selectinload(Order.items)).where(
            Order.client_id == ctx.subject_id
        )
    else:
        query = select(Order).options(selectinload(Order.items)).where(
            Order.distributor_id == ctx.tenant_id
        )
    if point_id is not None:
        query = query.where(Order.point_id == point_id)
    if payment_status is not None:
        query = query.where(Order.payment_status == payment_status)
    result = await db.execute(query)
    return list(result.scalars().all())


async def _get_order_or_404(db: AsyncSession, ctx: AuthContext, order_id: uuid.UUID) -> Order:
    query = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    if ctx.role == "client":
        query = query.where(Order.client_id == ctx.subject_id)
    else:
        query = query.where(Order.distributor_id == ctx.tenant_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    ctx: AuthContext = Depends(require_client_or_distributor),
    db: AsyncSession = Depends(get_db),
):
    return await _get_order_or_404(db, ctx, order_id)


@router.get("/{order_id}/items", response_model=list[OrderItemOut])
async def get_order_items(
    order_id: uuid.UUID,
    ctx: AuthContext = Depends(require_client_or_distributor),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(db, ctx, order_id)
    return order.items


@router.post("/{order_id}/cancel", response_model=OrderOut)
async def cancel_order_endpoint(
    order_id: uuid.UUID,
    payload: OrderCancelRequest,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    """ORD-11: comment required; nothing is changed in 1C automatically."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.distributor_id == ctx.tenant_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    order = await cancel_order(db, order, payload.comment)
    await db.commit()
    await broadcast_order_update(order)
    return order


@router.patch("/{order_id}/payment-status", response_model=OrderOut)
async def update_payment_status(
    order_id: uuid.UUID,
    payload: OrderPaymentStatusUpdate,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    """ORD-10: manual mark is final, unblocks the point immediately."""
    if payload.payment_status == PaymentStatus.none:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Can only set paid or unpaid manually")

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.distributor_id == ctx.tenant_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    order = await set_payment_status_manual(db, order, payload.payment_status)
    await db.commit()
    await broadcast_order_update(order)
    return order


@router.patch("/{order_id}/payment-link", response_model=OrderOut)
async def update_payment_link(
    order_id: uuid.UUID,
    payload: OrderPaymentLinkUpdate,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    """Not a payment integration — the distributor pastes a URL from
    whatever payment tool they already use; the client just sees/clicks it."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.distributor_id == ctx.tenant_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    order.payment_url = payload.payment_url
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    await broadcast_order_update(order)
    return order
