"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listChatMessages, listClients, listProducts, sendChatMessage } from "@/lib/api";
import { formatDate } from "@/lib/business";
import { useLiveUpdates } from "@/lib/ws";
import { ProductCard } from "@/components/ProductCard";
import type { ChatMessage, Client, Product } from "@/types";

export default function ChatThreadPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function reload() {
    const [msgs, cls, prods] = await Promise.all([
      listChatMessages(clientId),
      listClients(),
      listProducts(),
    ]);
    setMessages(msgs);
    setClients(cls);
    setProducts(prods);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useLiveUpdates((event) => {
    if (event.type !== "chat_message" || event.client_id !== clientId) return;
    if (event.message.sender_type === "distributor") return; // we already appended our own on send
    setMessages((prev) =>
      prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]
    );
  });

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendChatMessage(clientId, draft.trim());
      setDraft("");
      await reload();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full max-w-2xl flex-col">
      <Link href="/chat" className="mb-3 text-sm text-brand-600 hover:underline">
        &larr; До списку тредів
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">
        {client?.name ?? clientId}
      </h1>

      <div className="card mb-4 flex-1 space-y-3 overflow-y-auto p-4">
        {loading && <p className="text-slate-400">Завантаження...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-slate-400">Повідомлень ще немає.</p>
        )}
        {messages.map((msg) => {
          const product = msg.product_id ? productById.get(msg.product_id) : undefined;
          const fromDistributor = msg.sender_type === "distributor";
          return (
            <div key={msg.id} className={`flex ${fromDistributor ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-sm rounded-lg px-3 py-2 text-sm ${
                  fromDistributor ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <p>{msg.text}</p>
                {product && (
                  <div className="mt-2">
                    <ProductCard product={product} />
                  </div>
                )}
                <p
                  className={`mt-1 text-[10px] ${
                    fromDistributor ? "text-brand-100" : "text-slate-400"
                  }`}
                >
                  {formatDate(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Написати повідомлення..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button type="button" className="btn-primary" disabled={sending} onClick={handleSend}>
          Надіслати
        </button>
      </div>
    </div>
  );
}
