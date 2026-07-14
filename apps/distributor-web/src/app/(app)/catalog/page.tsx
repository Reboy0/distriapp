"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  listPointProductPrices,
  listPoints,
  listProducts,
  resetManualPrice,
  setManualPrice,
  updateProduct,
} from "@/lib/api";
import { formatDate, formatMoney, stockAvailability } from "@/lib/business";
import { StockBadge } from "@/components/Badges";
import type { PointOfSale, PointProductPrice, Product } from "@/types";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<PointProductPrice[]>([]);
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [thresholdDrafts, setThresholdDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newPricePointId, setNewPricePointId] = useState<Record<string, string>>({});
  const [newPriceValue, setNewPriceValue] = useState<Record<string, string>>({});

  async function reload() {
    const [p, pp, pts] = await Promise.all([listProducts(), listPointProductPrices(), listPoints()]);
    setProducts(p);
    setPrices(pp);
    setPoints(pts);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const pointById = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);

  function draftFor(product: Product): string {
    return thresholdDrafts[product.id] ?? (product.low_stock_threshold?.toString() ?? "");
  }

  async function saveThreshold(product: Product) {
    const raw = draftFor(product).trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && (Number.isNaN(value) || value < 0)) return;
    setBusyId(product.id);
    try {
      await updateProduct(product.id, { low_stock_threshold: value });
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleIsNew(product: Product) {
    setBusyId(product.id);
    try {
      await updateProduct(product.id, { is_new: !product.is_new });
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPrice(pointId: string, productId: string) {
    setBusyId(`${pointId}-${productId}`);
    try {
      await resetManualPrice(pointId, productId);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetNewPrice(product: Product) {
    const pointId = newPricePointId[product.id];
    const raw = (newPriceValue[product.id] ?? "").trim();
    const value = Number(raw);
    if (!pointId || raw === "" || Number.isNaN(value) || value < 0) return;
    setBusyId(`new-${product.id}`);
    try {
      await setManualPrice(pointId, product.id, value);
      setNewPricePointId((d) => ({ ...d, [product.id]: "" }));
      setNewPriceValue((d) => ({ ...d, [product.id]: "" }));
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Каталог товарів</h1>
        <p className="text-sm text-slate-500">
          Ціни завжди з ПДВ. Ручна ціна на точку переважає над базовою.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Базова ціна</th>
              <th>Наявність</th>
              <th>Поріг «закінчується»</th>
              <th>Новинка</th>
              <th>Ручні ціни</th>
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
            {!loading &&
              products.map((product) => {
                const productPrices = prices.filter((pp) => pp.product_id === product.id);
                const expanded = expandedId === product.id;
                return (
                  <Fragment key={product.id}>
                    <tr>
                      <td>
                        <p className="font-medium text-slate-800">{product.name}</p>
                        <p className="text-xs text-slate-400">
                          {product.external_code} · {product.unit}
                        </p>
                      </td>
                      <td>{formatMoney(product.base_price_with_vat)}</td>
                      <td>
                        <StockBadge availability={stockAvailability(product)} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            className="input w-24"
                            value={draftFor(product)}
                            onChange={(e) =>
                              setThresholdDrafts((d) => ({ ...d, [product.id]: e.target.value }))
                            }
                            placeholder="—"
                          />
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-xs"
                            disabled={busyId === product.id}
                            onClick={() => saveThreshold(product)}
                          >
                            Зберегти
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={product.is_new}
                          disabled={busyId === product.id}
                          onClick={() => toggleIsNew(product)}
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            product.is_new ? "bg-brand-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                              product.is_new ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-brand-600 hover:underline"
                          onClick={() => setExpandedId(expanded ? null : product.id)}
                        >
                          {productPrices.length > 0
                            ? `${productPrices.length} ручних цін`
                            : "Немає ручних цін"}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50">
                          {productPrices.length === 0 ? (
                            <p className="py-2 text-sm text-slate-400">
                              Для цього товару ще не встановлено ручних цін на точках.
                            </p>
                          ) : (
                            <table className="data-table my-1">
                              <thead>
                                <tr>
                                  <th>Точка</th>
                                  <th>Ручна ціна</th>
                                  <th>Оновлено</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {productPrices.map((pp) => (
                                  <tr key={pp.id}>
                                    <td>{pointById.get(pp.point_id)?.name ?? pp.point_id}</td>
                                    <td>{formatMoney(pp.manual_price_with_vat)}</td>
                                    <td>{formatDate(pp.updated_at)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn-secondary px-2 py-1 text-xs"
                                        disabled={busyId === `${pp.point_id}-${pp.product_id}`}
                                        onClick={() => handleResetPrice(pp.point_id, pp.product_id)}
                                      >
                                        Скинути до базової
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {(() => {
                            const overriddenPointIds = new Set(productPrices.map((pp) => pp.point_id));
                            const availablePoints = points.filter((pt) => !overriddenPointIds.has(pt.id));
                            if (availablePoints.length === 0) return null;
                            return (
                              <div className="flex items-end gap-2 py-3">
                                <div>
                                  <label className="label">Задати ручну ціну для точки</label>
                                  <select
                                    className="input w-56"
                                    value={newPricePointId[product.id] ?? ""}
                                    onChange={(e) =>
                                      setNewPricePointId((d) => ({ ...d, [product.id]: e.target.value }))
                                    }
                                  >
                                    <option value="">Оберіть точку</option>
                                    {availablePoints.map((pt) => (
                                      <option key={pt.id} value={pt.id}>
                                        {pt.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="label">Ціна з ПДВ</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="input w-32"
                                    value={newPriceValue[product.id] ?? ""}
                                    onChange={(e) =>
                                      setNewPriceValue((d) => ({ ...d, [product.id]: e.target.value }))
                                    }
                                    placeholder="0.00"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  disabled={busyId === `new-${product.id}`}
                                  onClick={() => handleSetNewPrice(product)}
                                >
                                  Зберегти
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
