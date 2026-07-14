import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.distributor import Distributor
from app.schemas.distributor import DistributorCreate, DistributorOut, DistributorUpdate

router = APIRouter(prefix="/admin/distributors", tags=["admin"])


@router.post("", response_model=DistributorOut)
async def create_distributor(
    payload: DistributorCreate,
    ctx: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """AUTH-1/ADM-1: admin onboards a distributor tenant + its 1C connection params."""
    distributor = Distributor(
        name=payload.name,
        contacts=payload.contacts,
        onec_config=payload.onec_config,
        login_email=payload.login_email,
        password_hash=hash_password(payload.login_password),
    )
    db.add(distributor)
    await db.commit()
    await db.refresh(distributor)
    return distributor


@router.get("", response_model=list[DistributorOut])
async def list_distributors(
    ctx: AuthContext = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Distributor))
    return list(result.scalars().all())


@router.patch("/{distributor_id}", response_model=DistributorOut)
async def update_distributor(
    distributor_id: uuid.UUID,
    payload: DistributorUpdate,
    ctx: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Distributor).where(Distributor.id == distributor_id))
    distributor = result.scalar_one_or_none()
    if distributor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Distributor not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(distributor, field, value)
    await db.commit()
    await db.refresh(distributor)
    return distributor
