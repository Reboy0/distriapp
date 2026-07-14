"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  cancelOrder,
  getOrder,
  listClients,
  listOrderItems,
  listPoints,
  listProducts,
  setOrderPaymentLink,
  setOrderPaymentStatus,
} from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/business";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/Badges";
import type { Client, Order, OrderItem, PointOfSale, Product } from "@/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | undefined>();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelComment, setCancelComment] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentUrlDraft, setPaymentUrlDraft] = useState("");

  async function reload() {
    const [o, i, p, c, pr] = await Promise.all([
      getOrder(orderId),
      listOrderItems(orderId),
      listPoints(),
      listClients(),
      listProducts(),
    ]);
    setOrder(o);
    setPaymentUrlDraft(o?.payment_url ?? "");
    setItems(i);
    setPoints(p);
    setClients(c);
    setProducts(pr);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const point = useMemo(() => points.find((p) => p.id === order?.point_id), [points, order]);
  const client = useMemo(() => clients.find((c) => c.id === order?.client_id), [clients, order]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  async function handleCancel() {
    if (!cancelComment.trim()) return;
    setBusy(true);
    try {
      await cancelOrder(orderId, cancelComment.trim());
      setShowCancelForm(false);
      setCancelComment("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handlePaymentStatus(status: "paid" | "unpaid") {
    setBusy(true);
    try {
      await setOrderPaymentStatus(orderId, status);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePaymentLink() {
    setBusy(true);
    try {
      await setOrderPaymentLink(orderId, paymentUrlDraft.trim() || null);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-slate-400">Завантаження...</p>;
  }

  if (!order) {
    return (
      <div>
        <Link href="/orders" className="text-brand-600 hover:underline">
          &larr; До списку замовлень
        </Link>
        <p className="mt-4 text-slate-500">Замовлення не знайдено.</p>
      </div>
    );
  }

  const canCancel = order.status !== "cancelled";

  return (
    <div className="max-w-3xl">
      <Link href="/orders" className="text-sm text-brand-600 hover:underline">
        &larr; До списку замовлень
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Замовлення {order.id}</h1>
          <p className="text-sm text-slate-500">
            Точка: {point?.name ?? order.point_id} · Клієнт: {client?.name ?? order.client_id}
          </p>
        </div>
        {client?.phone && (
          <a href={`tel:${client.phone}`} className="btn-secondary">
            &#128222; Подзвонити клієнту
          </a>
        )}
      </div>

      <div className="card mb-6 grid grid-cols-2 gap-4 p-4 text-sm">
        <div>
          <p className="text-slate-400">Статус замовлення</p>
          <div className="mt-1">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        <div>
          <p className="text-slate-400">Статус оплати</p>
          <div className="mt-1">
            <PaymentStatusBadge status={order.payment_status} />
            {order.payment_status_manual && (
              <span className="ml-2 text-xs text-slate-400">(вручну, фінально)</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-slate-400">Створено</p>
          <p>{formatDate(order.created_at)}</p>
        </div>
        <div>
          <p className="text-slate-400">Документ 1С</p>
          <p>{order.onec_document_id ?? "—"}</p>
        </div>
        {order.cancel_comment && (
          <div className="col-span-2">
            <p className="text-slate-400">Коментар скасування</p>
            <p className="text-red-700">{order.cancel_comment}</p>
          </div>
        )}
      </div>

      <div className="card mb-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>К-сть</th>
              <th>Ціна за од. (з ПДВ)</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{productById.get(item.product_id)?.name ?? item.product_id}</td>
                <td>{item.qty}</td>
                <td>{formatMoney(item.unit_price_with_vat)}</td>
                <td>{formatMoney(item.sum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card space-y-4 p-4">
        <h2 className="font-semibold text-slate-700">Дії</h2>

        <div>
          <p className="mb-2 text-sm text-slate-500">Позначити оплату вручну (фінально):</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handlePaymentStatus("paid")}
              className="btn-primary"
            >
              Оплачено
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handlePaymentStatus("unpaid")}
              className="btn-secondary"
            >
              Не оплачено
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="payment-url">
            Посилання на оплату (не інтеграція — клієнт лише бачить і переходить за лінком)
          </label>
          <div className="flex gap-2">
            <input
              id="payment-url"
              className="input"
              placeholder="https://..."
              value={paymentUrlDraft}
              onChange={(e) => setPaymentUrlDraft(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleSavePaymentLink}
              className="btn-secondary shrink-0"
            >
              Зберегти
            </button>
          </div>
        </div>

        {canCancel && (
          <div>
            {!showCancelForm ? (
              <button
                type="button"
                className="btn-danger"
                onClick={() => setShowCancelForm(true)}
              >
                Скасувати замовлення
              </button>
            ) : (
              <div className="space-y-2">
                <label className="label" htmlFor="cancel-comment">
                  Коментар до скасування (обов&apos;язково)
                </label>
                <textarea
                  id="cancel-comment"
                  className="input"
                  rows={3}
                  value={cancelComment}
                  onChange={(e) => setCancelComment(e.target.value)}
                  placeholder="Наприклад: товару немає в наявності"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={busy || !cancelComment.trim()}
                    onClick={handleCancel}
                  >
                    Підтвердити скасування
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelComment("");
                    }}
                  >
                    Відмінити
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
