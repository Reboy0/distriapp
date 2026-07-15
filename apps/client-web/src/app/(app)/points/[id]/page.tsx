"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CaretRight,
  CheckCircle,
  MapPin,
  Package,
  Receipt,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { listOrders, listPoints } from "@/lib/api";
import { useLiveUpdates } from "@/lib/ws";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/Skeleton";
import type { Order, PointOfSale } from "@/types";

export default function PointDashboardPage() {
  const params = useParams<{ id: string }>();
  const pointId = params.id;
  const router = useRouter();

  const [point, setPoint] = useState<PointOfSale | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const [points, orders] = await Promise.all([listPoints(), listOrders(pointId)]);
    setPoint(points.find((p) => p.id === pointId) ?? null);
    setRecentOrders(
      [...orders].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 3)
    );
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointId]);

  useLiveUpdates((event) => {
    if (event.type === "order_update" && event.order.point_id === pointId) {
      setRecentOrders((prev) => {
        const withoutThis = prev.filter((o) => o.id !== event.order.id);
        return [event.order, ...withoutThis]
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(0, 3);
      });
    }
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-20 w-full" />
        <CardSkeletonList count={2} />
      </div>
    );
  }

  if (!point) {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Точку не знайдено"
        description="Можливо, її було видалено."
      />
    );
  }

  return (
    <div className="animate-in space-y-6 pb-4">
      <div>
        <button
          onClick={() => router.push("/points")}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} weight="bold" />
          Усі точки
        </button>

        <div className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900">{point.name}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} />
                {point.address}
              </p>
            </div>
            {point.is_blocked ? (
              <span className="badge shrink-0 bg-danger-50 text-danger-700">
                <WarningCircle size={13} weight="fill" />
                заблоковано
              </span>
            ) : (
              <span className="badge shrink-0 bg-success-50 text-success-700">
                <CheckCircle size={13} weight="fill" />
                ОК
              </span>
            )}
          </div>
          {point.is_blocked && point.blocked_reason && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
              <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
              <span>{point.blocked_reason}</span>
            </div>
          )}
        </div>

        <Link
          href={`/points/${pointId}/catalog`}
          className="btn-primary mt-3 w-full text-base"
        >
          <Package size={20} weight="bold" />
          Зробити замовлення
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-bold text-slate-900">
            <Receipt size={18} weight="bold" className="text-brand-600" />
            Останні замовлення
          </h2>
          <Link
            href="/orders"
            className="flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Всі
            <CaretRight size={13} weight="bold" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState icon={Receipt} title="Замовлень ще немає" />
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
