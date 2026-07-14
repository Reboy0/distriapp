import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, require_client, require_distributor
from app.db.session import get_db
from app.models.point_of_sale import PointOfSale
from app.models.point_product_price import PointProductPrice
from app.models.product import Product
from app.schemas.product import (
    CatalogItemOut,
    ManualPriceSet,
    PointProductPriceOut,
    ProductOut,
    ProductUpdate,
)
from app.services.pricing import reset_to_base_price, resolve_price, set_manual_price
from app.services.stock_status import compute_availability

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=list[CatalogItemOut])
async def get_catalog(
    point_id: uuid.UUID,
    ctx: AuthContext = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """CAT-2/CAT-3/CAT-5: VAT-inclusive resolved price + coarse availability
    only, never exact stock_qty, for the given point."""
    point_result = await db.execute(
        select(PointOfSale).where(
            PointOfSale.id == point_id, PointOfSale.client_id == ctx.subject_id
        )
    )
    point = point_result.scalar_one_or_none()
    if point is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Point not found")

    products_result = await db.execute(
        select(Product).where(Product.distributor_id == ctx.tenant_id)
    )
    items = []
    for product in products_result.scalars().all():
        price, is_manual = await resolve_price(db, point.id, product)
        items.append(
            CatalogItemOut(
                id=product.id,
                name=product.name,
                unit=product.unit,
                price_with_vat=price,
                is_manual_price=is_manual,
                availability=compute_availability(product.stock_qty, product.low_stock_threshold),
                is_new=product.is_new,
            )
        )
    return items


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Product).where(Product.distributor_id == ctx.tenant_id))
    return list(result.scalars().all())


@router.get("/point-prices", response_model=list[PointProductPriceOut])
async def list_point_prices(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    """All manual per-point overrides for the distributor's catalog (CAT-2
    acceptance criteria: distributor must see which points have a manual
    price vs. the base one)."""
    result = await db.execute(
        select(PointProductPrice)
        .join(Product, PointProductPrice.product_id == Product.id)
        .where(Product.distributor_id == ctx.tenant_id)
    )
    return list(result.scalars().all())


@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    """CAT-5/CAT-6: distributor sets the low-stock threshold and the "new" badge."""
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.distributor_id == ctx.tenant_id)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")

    if payload.low_stock_threshold is not None:
        product.low_stock_threshold = payload.low_stock_threshold
    if payload.is_new is not None:
        product.is_new = payload.is_new
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/points/{point_id}/prices/{product_id}")
async def set_point_price(
    point_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: ManualPriceSet,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    """CAT-2: manual override wins over base price and is never touched by import."""
    await set_manual_price(db, point_id, product_id, payload.manual_price_with_vat)
    await db.commit()
    return {"status": "ok"}


@router.delete("/points/{point_id}/prices/{product_id}")
async def reset_point_price(
    point_id: uuid.UUID,
    product_id: uuid.UUID,
    ctx: AuthContext = Depends(require_distributor),
    db: AsyncSession = Depends(get_db),
):
    await reset_to_base_price(db, point_id, product_id)
    await db.commit()
    return {"status": "ok"}
