import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.integrations.onec.base import OneCConnector
from app.integrations.onec.stub import StubOneCConnector

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/client/login", auto_error=False)


class AuthContext:
    def __init__(self, role: str, subject_id: uuid.UUID, tenant_id: uuid.UUID | None):
        self.role = role
        self.subject_id = subject_id
        self.tenant_id = tenant_id


async def get_auth_context(token: str | None = Depends(oauth2_scheme)) -> AuthContext:
    if token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc

    tenant_id = payload.get("tenant_id")
    return AuthContext(
        role=payload["role"],
        subject_id=uuid.UUID(payload["sub"]),
        tenant_id=uuid.UUID(tenant_id) if tenant_id else None,
    )


def require_role(*roles: str):
    async def _check(ctx: AuthContext = Depends(get_auth_context)) -> AuthContext:
        if ctx.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return ctx

    return _check


require_client = require_role("client")
require_distributor = require_role("distributor")
require_admin = require_role("admin")
require_client_or_distributor = require_role("client", "distributor")


def get_onec_connector(ctx: AuthContext = Depends(get_auth_context)) -> OneCConnector:
    """AUTH-4 / INT-1: each distributor has its own connection, resolved
    per-tenant. Real per-distributor connectors are TBD (Q1) — the stub is
    wired here so the rest of the app never depends on that decision."""
    return StubOneCConnector()
