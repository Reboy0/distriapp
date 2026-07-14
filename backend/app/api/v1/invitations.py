import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, require_distributor
from app.core.config import settings
from app.db.session import get_db
from app.models.enums import InvitationStatus
from app.models.invitation import Invitation
from app.schemas.invitation import InvitationOut

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("", response_model=InvitationOut)
async def create_invitation(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    """AUTH-2: unique link/code, valid 7 days."""
    invitation = Invitation(
        distributor_id=ctx.tenant_id,
        code=secrets.token_urlsafe(16),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.invitation_expire_days),
    )
    db.add(invitation)
    await db.flush()
    await db.commit()
    return invitation


@router.get("", response_model=list[InvitationOut])
async def list_invitations(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Invitation).where(Invitation.distributor_id == ctx.tenant_id)
    )
    invitations = list(result.scalars().all())
    for inv in invitations:
        if inv.status == InvitationStatus.active and inv.expires_at < now:
            inv.status = InvitationStatus.expired  # lazily reflect expiry on read
    await db.commit()
    return invitations
