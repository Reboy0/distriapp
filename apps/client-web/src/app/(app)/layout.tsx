"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SignOut, Storefront } from "@phosphor-icons/react/dist/ssr";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/context/CartContext";
import { clearSession } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <AuthGuard>
      <CartProvider>
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50">
          <header className="safe-top sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <Storefront size={18} weight="fill" className="text-white" />
              </div>
              <span className="font-bold text-slate-900">Кабінет клієнта</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <SignOut size={16} weight="bold" />
              Вийти
            </button>
          </header>
          <main className="content-bottom-offset flex-1 overflow-y-auto px-4 pt-4">{children}</main>
          <BottomNav />
        </div>
      </CartProvider>
    </AuthGuard>
  );
}
