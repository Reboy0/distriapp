from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.chat import ChatThread
from app.models.client import Client
from app.models.distributor import Distributor
from app.models.enums import InvitationStatus
from app.models.invitation import Invitation
from app.schemas.auth import (
    AdminLoginRequest,
    ClientLoginRequest,
    ClientRegisterRequest,
    DistributorLoginRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.email == payload.email))
    admin = result.scalar_one_or_none()
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token = create_access_token(subject=str(admin.id), role="admin")
    return TokenResponse(access_token=token)


@router.post("/distributor/login", response_model=TokenResponse)
async def distributor_login(payload: DistributorLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Distributor).where(Distributor.login_email == payload.email)
    )
    distributor = result.scalar_one_or_none()
    if distributor is None or not verify_password(payload.password, distributor.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if not distributor.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Distributor deactivated")
    token = create_access_token(
        subject=str(distributor.id), role="distributor", tenant_id=str(distributor.id)
    )
    return TokenResponse(access_token=token)


@router.post("/client/login", response_model=TokenResponse)
async def client_login(payload: ClientLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.phone == payload.phone))
    client = result.scalar_one_or_none()
    if client is None or not verify_password(payload.password, client.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if not client.is_active:
        # AUTH-6: deactivated clients cannot log in, history is preserved elsewhere.
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Client deactivated")
    token = create_access_token(
        subject=str(client.id), role="client", tenant_id=str(client.distributor_id)
    )
    return TokenResponse(access_token=token)


@router.post("/client/register", response_model=TokenResponse)
async def client_register(payload: ClientRegisterRequest, db: AsyncSession = Depends(get_db)):
    """AUTH-3: registration is invitation-only, no open signup."""
    result = await db.execute(
        select(Invitation).where(Invitation.code == payload.invitation_code)
    )
    invitation = result.scalar_one_or_none()
    if invitation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")

    now = datetime.now(timezone.utc)
    if invitation.status != InvitationStatus.active or invitation.expires_at < now:
        invitation.status = InvitationStatus.expired
        await db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invitation is not active")

    client = Client(
        distributor_id=invitation.distributor_id,
        name=payload.name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    db.add(client)
    await db.flush()

    invitation.status = InvitationStatus.used
    invitation.used_by_client_id = client.id

    # COM-1: one chat thread per client, created up front.
    db.add(ChatThread(client_id=client.id, distributor_id=invitation.distributor_id))
    await db.commit()

    token = create_access_token(
        subject=str(client.id), role="client", tenant_id=str(client.distributor_id)
    )
    return TokenResponse(access_token=token)
