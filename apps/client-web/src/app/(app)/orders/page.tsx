"use client";

import { useEffect, useState } from "react";
import { Package } from "@phosphor-icons/react/dist/ssr";
import { listOrders } from "@/lib/api";
import { useLiveUpdates } from "@/lib/ws";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/Skeleton";
import type { Order } from "@/types";

function sortDesc(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders().then((data) => {
      setOrders(sortDesc(data));
      setLoading(false);
    });
  }, []);

  useLiveUpdates((event) => {
    if (event.type !== "order_update") return;
    setOrders((prev) => {
      const withoutThis = prev.filter((o) => o.id !== event.order.id);
      return sortDesc([event.order, ...withoutThis]);
    });
  });

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Мої замовлення</h1>

      {loading && <CardSkeletonList count={4} />}
      {!loading && orders.length === 0 && (
        <EmptyState
          icon={Package}
          title="Замовлень ще немає"
          description="Оберіть точку та зробіть перше замовлення з каталогу."
        />
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
