"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Storefront, Package, ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

const NAV_ITEMS: { href: string; label: string; icon: Icon }[] = [
  { href: "/points", label: "Точки", icon: Storefront },
  { href: "/orders", label: "Замовлення", icon: Package },
  { href: "/chat", label: "Чат", icon: ChatCircleDots },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-lg">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium"
            >
              <Icon
                size={24}
                weight={active ? "fill" : "regular"}
                className={active ? "text-brand-600" : "text-slate-400"}
              />
              <span className={active ? "text-brand-700" : "text-slate-500"}>{item.label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
