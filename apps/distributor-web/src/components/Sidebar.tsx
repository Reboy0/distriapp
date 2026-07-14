"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getDistributorName } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/points", label: "Точки продажів", icon: "\u{1F3EA}" },
  { href: "/orders", label: "Замовлення", icon: "\u{1F4E6}" },
  { href: "/catalog", label: "Каталог", icon: "\u{1F4D6}" },
  { href: "/invitations", label: "Запрошення", icon: "\u{2709}\u{FE0F}" },
  { href: "/chat", label: "Чат", icon: "\u{1F4AC}" },
  { href: "/sync", label: "Синхронізація", icon: "\u{1F504}" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-5">
        <p className="text-xs uppercase tracking-wide text-slate-400">Дистриб&apos;ютор</p>
        <p className="truncate font-semibold text-slate-800">
          {getDistributorName() ?? "Панель керування"}
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button type="button" onClick={handleLogout} className="btn-secondary w-full">
          Вийти
        </button>
      </div>
    </aside>
  );
}
