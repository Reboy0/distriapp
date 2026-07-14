"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  SealQuestion,
  ShoppingCartSimple,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { ApiError, listCatalog, listPoints, submitOrder } from "@/lib/api";
import { formatMoney, stepForUnit } from "@/lib/business";
import { cartTotal, useCart } from "@/context/CartContext";
import { NewBadge, StockBadge } from "@/components/Badges";
import { QuantityStepper } from "@/components/QuantityStepper";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/Skeleton";
import type { CatalogItem, PointOfSale } from "@/types";

export default function CatalogPage() {
  const params = useParams<{ id: string }>();
  const pointId = params.id;
  const router = useRouter();
  const { getLines, setQty, clearLines } = useCart();

  const [point, setPoint] = useState<PointOfSale | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = getLines(pointId);

  async function reload() {
    const [points, catalogItems] = await Promise.all([listPoints(), listCatalog(pointId)]);
    setPoint(points.find((p) => p.id === pointId) ?? null);
    setCatalog(catalogItems);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointId]);

  const total = useMemo(() => cartTotal(lines, catalog), [lines, catalog]);
  const cartEntries = useMemo(
    () =>
      Object.entries(lines)
        .map(([productId, qty]) => ({ item: catalog.find((c) => c.id === productId), qty }))
        .filter((l): l is { item: CatalogItem; qty: number } => !!l.item),
    [lines, catalog]
  );

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await submitOrder(
        pointId,
        cartEntries.map(({ item, qty }) => ({ product_id: item.id, qty }))
      );
      clearLines(pointId);
      router.push(`/points/${pointId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не вдалося створити замовлення.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-10 w-40" />
        <CardSkeletonList count={3} lines={1} />
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
    <div className="animate-in space-y-5 pb-4">
      <div>
        <button
          onClick={() => router.push(`/points/${pointId}`)}
          className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} weight="bold" />
          {point.name}
        </button>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Package size={22} weight="bold" className="text-brand-600" />
          Каталог
        </h1>
      </div>

      {catalog.length === 0 ? (
        <EmptyState icon={Package} title="Каталог порожній" />
      ) : (
        <div className="space-y-3">
          {catalog.map((item) => {
            const qty = lines[item.id] ?? 0;
            const outOfStock = item.availability === "out";
            return (
              <div key={item.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-0.5 text-base font-bold tabular-nums text-slate-800">
                        {formatMoney(item.price_with_vat)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StockBadge availability={item.availability} />
                    {item.is_new && <NewBadge />}
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  {outOfStock ? (
                    <Link
                      href={{
                        pathname: "/chat",
                        query: { productId: item.id, productName: item.name },
                      }}
                      className="btn-secondary w-full"
                    >
                      <SealQuestion size={17} weight="bold" />
                      Коли буде?
                    </Link>
                  ) : (
                    <QuantityStepper
                      qty={qty}
                      unit={item.unit}
                      step={stepForUnit(item.unit)}
                      onChange={(v) => setQty(pointId, item.id, v)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartEntries.length > 0 && (
        <section className="card animate-scale-in sticky bottom-nav-offset space-y-3 border-brand-100 p-4 shadow-floating">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <ShoppingCartSimple size={16} weight="fill" className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {cartEntries.length} {cartEntries.length === 1 ? "товар" : "товари"}
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {formatMoney(total)}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-danger-50 p-2.5 text-sm text-danger-700">
              <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || point.is_blocked}
            className="btn-primary w-full text-base"
          >
            {submitting ? "Відправляємо..." : "Замовити"}
          </button>
        </section>
      )}
    </div>
  );
}
