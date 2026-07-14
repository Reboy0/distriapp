"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

/**
 * Client-side route gate. There's no real backend session yet, so we just
 * check for the fake JWT in localStorage and bounce to /login if missing.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-slate-400">
        Завантаження...
      </div>
    );
  }

  return <>{children}</>;
}
