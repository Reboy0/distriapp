"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  MapPin,
  Package,
  Plus,
  Storefront,
  WarningCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { createPoint, listPoints } from "@/lib/api";
import { CardSkeletonList } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import type { PointOfSale } from "@/types";

export default function PointsPage() {
  const router = useRouter();
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    const pts = await listPoints();
    setPoints(pts);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createPoint(name.trim(), address.trim());
      setName("");
      setAddress("");
      setShowForm(false);
      router.push(`/points/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Мої точки</h1>
        <button
          className="btn-secondary text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <>
              <X size={16} weight="bold" />
              Скасувати
            </>
          ) : (
            <>
              <Plus size={16} weight="bold" />
              Додати
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card animate-scale-in mb-4 space-y-3 p-4">
          <div>
            <label className="label" htmlFor="pname">
              Назва
            </label>
            <input
              id="pname"
              required
              className="input"
              placeholder="Напр. Магазин на Хрещатику"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="paddr">
              Адреса
            </label>
            <input
              id="paddr"
              required
              className="input"
              placeholder="вул. ..., буд. ..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Збереження..." : "Зберегти точку"}
          </button>
        </form>
      )}

      {loading && <CardSkeletonList count={2} lines={1} />}

      {!loading && points.length === 0 && (
        <EmptyState
          icon={Storefront}
          title="У вас ще немає точок"
          description="Додайте першу торгову точку, щоб почати замовляти."
        />
      )}

      <div className="space-y-3">
        {points.map((point) => (
          <div key={point.id} className="card p-4">
            <button
              onClick={() => router.push(`/points/${point.id}`)}
              className="flex w-full items-center gap-3 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Storefront size={22} weight="fill" className="text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{point.name}</p>
                <p className="flex items-center gap-1 truncate text-sm text-slate-500">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{point.address}</span>
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
            </button>

            <Link
              href={`/points/${point.id}/catalog`}
              className="btn-primary mt-3 w-full py-3 text-base"
            >
              <Package size={20} weight="bold" />
              Зробити замовлення
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
