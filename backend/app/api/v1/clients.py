from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, require_distributor
from app.db.session import get_db
from app.models.client import Client
from app.schemas.client import ClientOut

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
async def list_clients(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Client).where(Client.distributor_id == ctx.tenant_id))
    return list(result.scalars().all())
