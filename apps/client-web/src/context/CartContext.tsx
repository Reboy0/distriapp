"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CatalogItem } from "@/types";

const STORAGE_KEY = "client_web_cart_v2";

// pointId -> productId -> qty. No multiple-of validation (CAT-4 deferred by
// the customer). Scoped per point — the point comes from the URL
// (/points/[id]), not a separate "select a point" step.
type CartState = Record<string, Record<string, number>>;

interface CartContextValue {
  getLines: (pointId: string) => Record<string, number>;
  setQty: (pointId: string, productId: string, qty: number) => void;
  removeLine: (pointId: string, productId: string) => void;
  clearLines: (pointId: string) => void;
  lineCount: (pointId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadInitial(): CartState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartState) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});
  // Guards the save-effect from firing with the default {} state before
  // loadInitial() has run — otherwise a save-on-mount race can clobber a
  // previously-saved cart on every full page navigation.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const getLines = useCallback((pointId: string) => state[pointId] ?? {}, [state]);

  const setQty = useCallback((pointId: string, productId: string, qty: number) => {
    setState((prev) => {
      const lines = { ...(prev[pointId] ?? {}) };
      if (qty <= 0) {
        delete lines[productId];
      } else {
        lines[productId] = qty;
      }
      return { ...prev, [pointId]: lines };
    });
  }, []);

  const removeLine = useCallback((pointId: string, productId: string) => {
    setState((prev) => {
      const lines = { ...(prev[pointId] ?? {}) };
      delete lines[productId];
      return { ...prev, [pointId]: lines };
    });
  }, []);

  // After a successful order, empty just this point's basket.
  const clearLines = useCallback((pointId: string) => {
    setState((prev) => ({ ...prev, [pointId]: {} }));
  }, []);

  const lineCount = useCallback(
    (pointId: string) => Object.keys(state[pointId] ?? {}).length,
    [state]
  );

  const value: CartContextValue = { getLines, setQty, removeLine, clearLines, lineCount };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function cartTotal(lines: Record<string, number>, catalog: CatalogItem[]): number {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  return Object.entries(lines).reduce((sum, [productId, qty]) => {
    const item = byId.get(productId);
    return sum + (item ? item.price_with_vat * qty : 0);
  }, 0);
}
