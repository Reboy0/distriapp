"use client";

import { useEffect, useMemo, useState } from "react";
import { listClients, listOrders, listPoints, setPointDeferment } from "@/lib/api";
import { formatDateOnly, hasActiveDeferment, isPointDebtor } from "@/lib/business";
import { useLiveUpdates } from "@/lib/ws";
import type { Client, Order, PointOfSale } from "@/types";

type PaymentFilter = "all" | "debtor" | "ok";

export default function PointsPage() {
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defermentInput, setDefermentInput] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listPoints(), listClients(), listOrders()]).then(([p, c, o]) => {
      setPoints(p);
      setClients(c);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  useLiveUpdates((event) => {
    if (event.type !== "order_update") return;
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === event.order.id);
      return exists
        ? prev.map((o) => (o.id === event.order.id ? event.order : o))
        : [event.order, ...prev];
    });
  });

  function startEditing(point: PointOfSale) {
    setEditingId(point.id);
    setDefermentInput(point.deferment_until ? point.deferment_until.slice(0, 10) : "");
  }

  async function saveDeferment(pointId: string) {
    setSavingId(pointId);
    const updated = await setPointDeferment(pointId, defermentInput || null);
    setPoints((prev) => prev.map((p) => (p.id === pointId ? updated : p)));
    setSavingId(null);
    setEditingId(null);
  }

  async function clearDeferment(pointId: string) {
    setSavingId(pointId);
    const updated = await setPointDeferment(pointId, null);
    setPoints((prev) => prev.map((p) => (p.id === pointId ? updated : p)));
    setSavingId(null);
    setEditingId(null);
  }

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const rows = useMemo(() => {
    return points
      .map((point) => ({ point, debtor: isPointDebtor(point, orders) }))
      .filter(({ debtor }) => {
        if (filter === "debtor") return debtor;
        if (filter === "ok") return !debtor;
        return true;
      });
  }, [points, orders, filter]);

  const debtorCount = useMemo(
    () => points.filter((p) => isPointDebtor(p, orders)).length,
    [points, orders]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Точки продажів</h1>
          <p className="text-sm text-slate-500">
            Усі точки всіх клієнтів. {debtorCount > 0 && (
              <span className="font-medium text-red-600">Боржників: {debtorCount}</span>
            )}
          </p>
        </div>
        <select
          className="input w-56"
          value={filter}
          onChange={(e) => setFilter(e.target.value as PaymentFilter)}
        >
          <option value="all">Усі точки</option>
          <option value="debtor">Лише боржники</option>
          <option value="ok">Без заборгованості</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Точка</th>
              <th>Клієнт</th>
              <th>Адреса</th>
              <th>Відстрочка до</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Завантаження...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Немає точок за обраним фільтром.
                </td>
              </tr>
            )}
            {rows.map(({ point, debtor }) => (
              <tr key={point.id} className={debtor ? "bg-debtor-bg" : undefined}>
                <td className={debtor ? "font-medium text-debtor-text" : "font-medium text-slate-800"}>
                  {point.name}
                </td>
                <td>{clientById.get(point.client_id)?.name ?? point.client_id}</td>
                <td>{point.address}</td>
                <td>
                  {editingId === point.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        className="input w-40"
                        value={defermentInput}
                        onChange={(e) => setDefermentInput(e.target.value)}
                      />
                      <button
                        className="btn-secondary"
                        disabled={savingId === point.id}
                        onClick={() => saveDeferment(point.id)}
                      >
                        Зберегти
                      </button>
                      <button
                        className="text-sm text-slate-500 hover:underline"
                        onClick={() => setEditingId(null)}
                      >
                        Скасувати
                      </button>
                    </div>
                  ) : (
                    <>
                      {point.deferment_until ? formatDateOnly(point.deferment_until) : "—"}
                      {point.deferment_until && hasActiveDeferment(point) && (
                        <span className="ml-2 badge bg-blue-100 text-blue-700">активна</span>
                      )}
                    </>
                  )}
                </td>
                <td>
                  {debtor ? (
                    <span className="badge bg-red-100 text-red-700">боржник — блокування точки</span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">ОК</span>
                  )}
                </td>
                <td>
                  {editingId !== point.id && (
                    <div className="flex items-center gap-3">
                      <button
                        className="text-brand-600 hover:underline"
                        onClick={() => startEditing(point)}
                      >
                        {point.deferment_until ? "Змінити" : "Задати відстрочку"}
                      </button>
                      {point.deferment_until && (
                        <button
                          className="text-slate-500 hover:underline"
                          disabled={savingId === point.id}
                          onClick={() => clearDeferment(point.id)}
                        >
                          Зняти
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
