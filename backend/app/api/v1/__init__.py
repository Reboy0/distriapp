from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    catalog,
    chat,
    clients,
    integrations,
    invitations,
    orders,
    points,
    ws,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(invitations.router)
api_router.include_router(catalog.router)
api_router.include_router(points.router)
api_router.include_router(orders.router)
api_router.include_router(chat.router)
api_router.include_router(clients.router)
api_router.include_router(integrations.router)
api_router.include_router(admin.router)
api_router.include_router(ws.router)
