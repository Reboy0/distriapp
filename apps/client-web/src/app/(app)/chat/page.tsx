"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChatCircleDots,
  PaperPlaneTilt,
  Storefront,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { getClientId } from "@/lib/auth";
import { listChatMessages, sendChatMessage } from "@/lib/api";
import { formatDate } from "@/lib/business";
import { useLiveUpdates } from "@/lib/ws";
import { EmptyState } from "@/components/EmptyState";
import type { ChatMessage } from "@/types";

function ChatThread() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [attachedProduct, setAttachedProduct] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const clientId = getClientId();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const productId = searchParams.get("productId");
    const productName = searchParams.get("productName");
    if (productId && productName) {
      setAttachedProduct({ id: productId, name: productName });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!clientId) return;
    listChatMessages(clientId).then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useLiveUpdates((event) => {
    if (event.type !== "chat_message") return;
    if (event.message.sender_type === "client") return; // we already appended our own on send
    setMessages((prev) =>
      prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]
    );
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || (!text.trim() && !attachedProduct)) return;
    setSending(true);
    try {
      const body = attachedProduct
        ? text.trim() || `Коли буде «${attachedProduct.name}»?`
        : text.trim();
      const message = await sendChatMessage(clientId, body, attachedProduct?.id);
      setMessages((prev) => [...prev, message]);
      setText("");
      setAttachedProduct(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
          <Storefront size={18} weight="fill" className="text-brand-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Дистриб&apos;ютор</h1>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {loading && (
          <div className="space-y-2.5">
            <div className="skeleton h-12 w-2/3 rounded-2xl" />
            <div className="skeleton ml-auto h-9 w-1/2 rounded-2xl" />
            <div className="skeleton h-14 w-3/4 rounded-2xl" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <EmptyState
            icon={ChatCircleDots}
            title="Повідомлень ще немає"
            description="Напишіть дистриб'ютору, якщо є питання щодо товару чи замовлення."
          />
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`animate-in max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft ${
              m.sender_type === "client"
                ? "ml-auto rounded-br-md bg-brand-600 text-white"
                : "rounded-bl-md bg-white text-slate-800"
            }`}
          >
            <p>{m.text}</p>
            <p
              className={`mt-1 text-[10px] font-medium ${
                m.sender_type === "client" ? "text-brand-100/80" : "text-slate-400"
              }`}
            >
              {formatDate(m.created_at)}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 space-y-2">
        {attachedProduct && (
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <span className="truncate font-medium">📦 {attachedProduct.name} — коли буде?</span>
            <button
              type="button"
              onClick={() => setAttachedProduct(null)}
              className="shrink-0 rounded-full p-1 text-brand-400 hover:bg-brand-100 hover:text-brand-700"
              aria-label="Прибрати товар"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Повідомлення..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && !attachedProduct)}
            className="btn-primary aspect-square px-0 w-11"
            aria-label="Надіслати"
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatThread />
    </Suspense>
  );
}
