"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Receipt,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { ApiError, getOrder } from "@/lib/api";
import { useLiveUpdates } from "@/lib/ws";
import { formatDate, formatMoney } from "@/lib/business";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getOrder(orderId)
      .then((data) => setOrder(data))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          throw err;
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useLiveUpdates((event) => {
    if (event.type === "order_update" && event.order.id === orderId) {
      setOrder(event.order);
    }
  });

  const backButton = (
    <button
      onClick={() => router.back()}
      className="mb-3 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft size={16} weight="bold" />
      Назад
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {backButton}
        <CardSkeleton lines={5} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div>
        {backButton}
        <EmptyState
          icon={WarningCircle}
          title="Замовлення не знайдено"
          description="Можливо, його було видалено."
        />
      </div>
    );
  }

  const total = order.items.reduce((s, i) => s + i.sum, 0);

  return (
    <div className="animate-in space-y-4 pb-4">
      {backButton}

      <div className="card p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <Receipt size={19} weight="bold" className="text-brand-600" />
              Замовлення
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {order.items.map((line, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{line.product_name}</p>
                <p className="text-xs text-slate-400">
                  {line.qty} {line.unit} × {formatMoney(line.unit_price_with_vat)}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                {formatMoney(line.sum)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-medium text-slate-500">Разом</span>
          <span className="text-lg font-bold tabular-nums text-slate-900">
            {formatMoney(total)}
          </span>
        </div>

        {order.status === "cancelled" && order.cancel_comment && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-xs text-danger-700">
            <XCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
            <span>Скасовано: {order.cancel_comment}</span>
          </div>
        )}

        {order.payment_status === "unpaid" && order.payment_url && (
          <a
            href={order.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-3 w-full"
          >
            <CreditCard size={18} weight="bold" />
            Оплатити
          </a>
        )}
      </div>
    </div>
  );
}
