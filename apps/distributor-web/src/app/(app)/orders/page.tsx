"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listOrders, listPoints } from "@/lib/api";
import { formatDate } from "@/lib/business";
import { useLiveUpdates } from "@/lib/ws";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";
import type { Order, OrderStatus, PointOfSale } from "@/types";

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Усі статуси" },
  { value: "created", label: "Створено" },
  { value: "pending_1c", label: "Очікує 1С" },
  { value: "sent_to_1c", label: "Надіслано в 1С" },
  { value: "cancelled", label: "Скасовано" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [pointFilter, setPointFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listOrders(), listPoints()]).then(([o, p]) => {
      setOrders(o);
      setPoints(p);
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

  const pointById = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (pointFilter !== "all" && o.point_id !== pointFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, pointFilter, statusFilter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Замовлення</h1>
        <div className="flex gap-3">
          <select className="input w-56" value={pointFilter} onChange={(e) => setPointFilter(e.target.value)}>
            <option value="all">Усі точки</option>
            {points.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="input w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Точка</th>
              <th>Статус</th>
              <th>Оплата</th>
              <th>Створено</th>
              <th />
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Немає замовлень за обраними фільтрами.
                </td>
              </tr>
            )}
            {filtered.map((order) => (
              <tr key={order.id}>
                <td className="font-mono text-xs text-slate-500">{order.id}</td>
                <td>{pointById.get(order.point_id)?.name ?? order.point_id}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td>
                  <PaymentStatusBadge status={order.payment_status} />
                </td>
                <td>{formatDate(order.created_at)}</td>
                <td>
                  <Link href={`/orders/${order.id}`} className="text-brand-600 hover:underline">
                    Деталі
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
