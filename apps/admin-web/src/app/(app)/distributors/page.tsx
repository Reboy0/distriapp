"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listDistributors } from "@/lib/api";
import type { Distributor } from "@/types";

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDistributors().then((d) => {
      setDistributors(d);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Дистриб&apos;ютори</h1>
        <Link href="/distributors/new" className="btn-primary">
          + Додати дистриб&apos;ютора
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Контакти</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Завантаження...
                </td>
              </tr>
            )}
            {!loading && distributors.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Ще немає жодного дистриб&apos;ютора.
                </td>
              </tr>
            )}
            {distributors.map((d) => (
              <tr key={d.id}>
                <td className="font-medium text-slate-800">{d.name}</td>
                <td className="whitespace-pre-line text-slate-600">{d.contacts}</td>
                <td>
                  {d.is_active ? (
                    <span className="badge bg-green-100 text-green-700">активний</span>
                  ) : (
                    <span className="badge bg-slate-200 text-slate-600">деактивовано</span>
                  )}
                </td>
                <td>
                  <Link href={`/distributors/${d.id}`} className="text-brand-600 hover:underline">
                    Редагувати
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
