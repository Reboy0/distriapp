import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, require_client_or_distributor, require_distributor
from app.db.session import get_db
from app.models.chat import ChatMessage, ChatThread
from app.models.enums import ChatSender
from app.schemas.chat import ChatMessageCreate, ChatMessageOut, ChatThreadOut
from app.ws.events import broadcast_chat_message

router = APIRouter(prefix="/chat", tags=["chat"])


async def _get_authorized_thread(db: AsyncSession, ctx: AuthContext, client_id: uuid.UUID) -> ChatThread:
    """COM-1: one thread per client. A client may only touch their own
    thread; a distributor only threads belonging to their own clients."""
    if ctx.role == "client" and client_id != ctx.subject_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your thread")

    result = await db.execute(select(ChatThread).where(ChatThread.client_id == client_id))
    thread = result.scalar_one_or_none()
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")

    if ctx.role == "distributor" and thread.distributor_id != ctx.tenant_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your client")

    return thread


@router.get("/threads", response_model=list[ChatThreadOut])
async def list_threads(
    ctx: AuthContext = Depends(require_distributor), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChatThread).where(ChatThread.distributor_id == ctx.tenant_id))
    return list(result.scalars().all())


@router.get("/threads/{client_id}/messages", response_model=list[ChatMessageOut])
async def get_messages(
    client_id: uuid.UUID,
    ctx: AuthContext = Depends(require_client_or_distributor),
    db: AsyncSession = Depends(get_db),
):
    thread = await _get_authorized_thread(db, ctx, client_id)
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.thread_id == thread.id).order_by(ChatMessage.created_at)
    )
    return list(result.scalars().all())


@router.post("/threads/{client_id}/messages", response_model=ChatMessageOut)
async def send_message(
    client_id: uuid.UUID,
    payload: ChatMessageCreate,
    ctx: AuthContext = Depends(require_client_or_distributor),
    db: AsyncSession = Depends(get_db),
):
    """COM-2: product_id lets "коли буде?" attach a product card to the message."""
    thread = await _get_authorized_thread(db, ctx, client_id)
    message = ChatMessage(
        thread_id=thread.id,
        sender_type=ChatSender.client if ctx.role == "client" else ChatSender.distributor,
        text=payload.text,
        product_id=payload.product_id,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    await broadcast_chat_message(message, client_id, thread.distributor_id)
    return message
