"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CircleNotch,
  IdentificationBadge,
  LockKey,
  Phone,
  Ticket,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { register } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(code.trim(), name.trim(), phone.trim(), password);
      router.push("/points");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зареєструватися");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Реєстрація"
      subtitle="Код видає ваш дистриб'ютор, дійсний 7 днів"
      footer={
        <>
          Вже є акаунт?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Увійти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="code">
            Код запрошення
          </label>
          <div className="relative">
            <Ticket size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="code"
              required
              className="input pl-10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="name">
            Ім&apos;я
          </label>
          <div className="relative">
            <IdentificationBadge size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="name"
              required
              className="input pl-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Телефон
          </label>
          <div className="relative">
            <Phone size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              className="input pl-10"
              placeholder="+380..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="password">
            Пароль
          </label>
          <div className="relative">
            <LockKey size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              className="input pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
            <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <CircleNotch size={18} className="animate-spin" />}
          {loading ? "Реєстрація..." : "Зареєструватися"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
