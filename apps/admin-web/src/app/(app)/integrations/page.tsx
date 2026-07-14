"use client";

import { useEffect, useState } from "react";
import { listAllSyncLogs, listDistributors } from "@/lib/api";
import type { Distributor, SyncLog } from "@/types";

export default function IntegrationsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAllSyncLogs(), listDistributors()]).then(([l, d]) => {
      setLogs(l);
      setDistributors(d);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-slate-800">Моніторинг інтеграцій 1С</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Зведений журнал синхронізацій 1С по всіх дистриб&apos;юторах ({distributors.length}{" "}
        активних тенантів). Цей екран — P1, наразі лише каркас навігації.
      </p>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Дистриб&apos;ютор</th>
              <th>Тип</th>
              <th>Статус</th>
              <th>Початок</th>
              <th>Завершення</th>
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
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  Ще немає записів синхронізації. Функціонал моніторингу інтеграцій заплановано на
                  P1.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.distributor_id}</td>
                <td>{log.type}</td>
                <td>{log.status}</td>
                <td>{log.started_at}</td>
                <td>{log.finished_at ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
