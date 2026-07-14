"use client";

import { useEffect, useState } from "react";
import { listSyncLogs, triggerSync } from "@/lib/api";
import { formatDate } from "@/lib/business";
import { SyncStatusBadge } from "@/components/Badges";
import type { SyncLog } from "@/types";

export default function SyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function reload() {
    const l = await listSyncLogs();
    setLogs(l);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const log = await triggerSync();
      // Prepend locally: the mock backend doesn't persist state across
      // requests, so re-fetching the log list would not reflect this run.
      setLogs((prev) => [log, ...prev]);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Синхронізація з 1С</h1>
          <p className="text-sm text-slate-500">
            Автоматична синхронізація відбувається 3 рази на день (9:00 / 15:00 / 20:00 за Києвом).
            Журнал синхронізацій — P1, наразі каркас.
          </p>
        </div>
        <button type="button" className="btn-primary" disabled={syncing} onClick={handleSync}>
          {syncing ? "Синхронізація..." : "Оновити дані з 1С"}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Статус</th>
              <th>Початок</th>
              <th>Завершення</th>
              <th>Помилка</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Завантаження...
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Журнал синхронізацій порожній. Натисніть &laquo;Оновити дані з 1С&raquo;, щоб
                  запустити першу синхронізацію (P1 — функціонал у розробці).
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.type}</td>
                <td>
                  <SyncStatusBadge status={log.status} />
                </td>
                <td>{formatDate(log.started_at)}</td>
                <td>{formatDate(log.finished_at)}</td>
                <td className="text-red-600">{log.error_message ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
