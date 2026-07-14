"use client";

import { useState } from "react";
import type { DistributorInput } from "@/lib/api";

export function DistributorForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<DistributorInput>;
  submitLabel: string;
  onSubmit: (input: DistributorInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [contacts, setContacts] = useState(initial?.contacts ?? "");
  const [onecHost, setOnecHost] = useState(
    (initial?.onec_config?.host as string | undefined) ?? ""
  );
  const [onecBase, setOnecBase] = useState(
    (initial?.onec_config?.base as string | undefined) ?? ""
  );
  const [onecUser, setOnecUser] = useState(
    (initial?.onec_config?.user as string | undefined) ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const onec_config =
        onecHost || onecBase || onecUser
          ? { host: onecHost || undefined, base: onecBase || undefined, user: onecUser || undefined }
          : null;
      await onSubmit({ name, contacts, onec_config });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl space-y-4 p-6">
      <div>
        <label className="label" htmlFor="name">
          Назва дистриб&apos;ютора
        </label>
        <input
          id="name"
          required
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Хлібзавод №3"
        />
      </div>
      <div>
        <label className="label" htmlFor="contacts">
          Контакти
        </label>
        <textarea
          id="contacts"
          required
          rows={2}
          className="input"
          value={contacts}
          onChange={(e) => setContacts(e.target.value)}
          placeholder="Ім'я контактної особи, телефон, email"
        />
      </div>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Параметри підключення 1С (заглушка)
        </legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="onec-host">
              Host
            </label>
            <input
              id="onec-host"
              className="input"
              value={onecHost}
              onChange={(e) => setOnecHost(e.target.value)}
              placeholder="10.0.1.20"
            />
          </div>
          <div>
            <label className="label" htmlFor="onec-base">
              База
            </label>
            <input
              id="onec-base"
              className="input"
              value={onecBase}
              onChange={(e) => setOnecBase(e.target.value)}
              placeholder="Trade_2026"
            />
          </div>
          <div>
            <label className="label" htmlFor="onec-user">
              Користувач
            </label>
            <input
              id="onec-user"
              className="input"
              value={onecUser}
              onChange={(e) => setOnecUser(e.target.value)}
              placeholder="onec_svc"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Реальна інтеграція з 1С ще не реалізована (StubOneCConnector на бекенді).
        </p>
      </fieldset>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Збереження..." : submitLabel}
      </button>
    </form>
  );
}
