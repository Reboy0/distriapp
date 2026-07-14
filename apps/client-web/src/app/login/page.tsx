"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleNotch, LockKey, Phone, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { login } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(phone, password);
      router.push("/points");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося увійти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="З поверненням"
      subtitle="Кабінет представника магазину"
      footer={
        <>
          Ще не зареєстровані?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            У мене є код запрошення
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              className="input pl-10"
              placeholder="••••••••"
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
          {loading ? "Вхід..." : "Увійти"}
        </button>
      </form>
    </AuthShell>
  );
}
