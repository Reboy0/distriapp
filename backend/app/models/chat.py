import uuid

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import ChatSender


class ChatThread(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "chat_threads"
    __table_args__ = (UniqueConstraint("client_id", name="uq_thread_per_client"),)

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id"), index=True
    )

    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="thread")


class ChatMessage(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "chat_messages"

    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_threads.id"), index=True
    )
    sender_type: Mapped[ChatSender] = mapped_column(Enum(ChatSender, name="chat_sender"))
    text: Mapped[str] = mapped_column(String(2000))
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )

    thread: Mapped["ChatThread"] = relationship(back_populates="messages")
