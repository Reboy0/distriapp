/**
 * Client-side cart state. The cart itself is NOT a CONTRACT.md entity -
 * it's a UI-only draft that becomes an Order + OrderItem[] the moment
 * "Замовити" is pressed (see app/(tabs)/cart.tsx and lib/api.ts#createOrder).
 *
 * Arbitrary quantity is allowed with no multiple-of validation, per
 * CONTRACT.md / CAT-4 ("Кратність замовлення поки не реалізуємо").
 */
import React, { createContext, useContext, useMemo, useState } from "react";
import type { CartLine, Product } from "../types";

interface CartContextValue {
  selectedPointId: string | null;
  setSelectedPointId: (pointId: string | null) => void;
  lines: CartLine[];
  addProduct: (product: Product) => void;
  setQty: (productId: string, qty: number) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  totalSum: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  const addProduct = (product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      // TODO: once PointProductPrice is wired up, resolve unit price via the
      // selected point's manual override instead of always using base price.
      return [...prev, { product, qty: 1, unit_price_with_vat: product.base_price_with_vat }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const removeProduct = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const clear = () => setLines([]);

  const totalSum = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.unit_price_with_vat, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({ selectedPointId, setSelectedPointId, lines, addProduct, setQty, removeProduct, clear, totalSum }),
    [selectedPointId, lines, totalSum]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
