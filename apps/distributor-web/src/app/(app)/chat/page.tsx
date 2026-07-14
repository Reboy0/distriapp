"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listChatThreads, listClients } from "@/lib/api";
import type { ChatThread, Client } from "@/types";

export default function ChatListPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listChatThreads(), listClients()]).then(([t, c]) => {
      setThreads(t);
      setClients(c);
      setLoading(false);
    });
  }, []);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Чат з клієнтами</h1>

      {loading && <p className="text-slate-400">Завантаження...</p>}
      {!loading && threads.length === 0 && <p className="text-slate-400">Ще немає тредів.</p>}

      <div className="card divide-y divide-slate-100">
        {threads.map((thread) => {
          const client = clientById.get(thread.client_id);
          return (
            <Link
              key={thread.id}
              href={`/chat/${thread.client_id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-800">{client?.name ?? thread.client_id}</p>
                <p className="text-xs text-slate-400">{client?.phone}</p>
              </div>
              <span className="text-brand-600">Відкрити &rarr;</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
