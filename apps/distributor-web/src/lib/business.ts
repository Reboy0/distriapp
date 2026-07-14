import type { Order, PointOfSale, Product } from "@/types";

/**
 * A point of sale is a "debtor" if it has at least one order with
 * payment_status = "unpaid" AND no active deferment
 * (deferment_until is null, or already in the past).
 * See docs/CONTRACT.md, "Блокування точки".
 */
export function isPointDebtor(point: PointOfSale, orders: Order[]): boolean {
  const hasUnpaidOrder = orders.some(
    (o) => o.point_id === point.id && o.payment_status === "unpaid"
  );
  if (!hasUnpaidOrder) return false;
  return !hasActiveDeferment(point);
}

export function hasActiveDeferment(point: PointOfSale): boolean {
  if (!point.deferment_until) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defermentDate = new Date(point.deferment_until);
  return defermentDate >= today;
}

export type StockAvailability = "none" | "low" | "available";

/**
 * qty=0 -> "none"; 0<qty<=threshold -> "low"; qty>threshold -> "available";
 * threshold=null -> only "available"/"none" (never "low").
 */
export function stockAvailability(product: Product): StockAvailability {
  if (product.stock_qty === 0) return "none";
  if (product.low_stock_threshold != null && product.stock_qty <= product.low_stock_threshold) {
    return "low";
  }
  return "available";
}

export function formatMoney(value: number): string {
  return `${value.toFixed(2)} грн (з ПДВ)`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
