"use client";

import { useEffect, useState } from "react";
import { createInvitation, listInvitations } from "@/lib/api";
import { formatDate } from "@/lib/business";
import { InvitationStatusBadge } from "@/components/Badges";
import type { Invitation } from "@/types";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload() {
    const inv = await listInvitations();
    setInvitations(inv);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      await createInvitation();
      await reload();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Запрошення</h1>
          <p className="text-sm text-slate-500">
            Реєстрація клієнтів можлива лише за кодом запрошення. Код дійсний 7 днів.
          </p>
        </div>
        <button type="button" className="btn-primary" disabled={creating} onClick={handleCreate}>
          {creating ? "Створення..." : "+ Створити запрошення"}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Статус</th>
              <th>Створено</th>
              <th>Діє до</th>
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
            {!loading && invitations.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Ще немає запрошень.
                </td>
              </tr>
            )}
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono">{inv.code}</td>
                <td>
                  <InvitationStatusBadge status={inv.status} />
                </td>
                <td>{formatDate(inv.created_at)}</td>
                <td>{formatDate(inv.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
