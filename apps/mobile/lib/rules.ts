/**
 * Small, pure helpers that encode the business rules from docs/CONTRACT.md
 * so screens don't re-derive them ad hoc. Kept framework-free and testable.
 */
import type { AvailabilityStatus, Order, PointOfSale, Product } from "../types";

/**
 * CONTRACT.md: "Наявність: qty=0 -> «немає»; 0<qty<=threshold -> «закінчується»;
 * qty>threshold -> «є»; якщо threshold=null - тільки «є/немає». Точні залишки
 * клієнту не показувати."
 */
export function getAvailabilityStatus(product: Pick<Product, "stock_qty" | "low_stock_threshold">): AvailabilityStatus {
  const { stock_qty, low_stock_threshold } = product;

  if (stock_qty <= 0) return "out_of_stock";

  if (low_stock_threshold == null) {
    // No threshold configured -> only available/out_of_stock is meaningful.
    return "available";
  }

  return stock_qty <= low_stock_threshold ? "low_stock" : "available";
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "є",
  low_stock: "закінчується",
  out_of_stock: "немає",
};

export interface PointBlockStatus {
  blocked: boolean;
  /** Human-readable Ukrainian explanation shown to the client. */
  reason: string | null;
  /** The order responsible for the block, if any. */
  blockingOrder: Order | null;
}

/**
 * CONTRACT.md blocking rule: a point cannot receive a new order if
 * (it has >=1 order with payment_status="unpaid") AND
 * (deferment_until is not set, or the deferment date has already passed).
 * A deferment only "kicks in" as a debtor state at 00:00 the day after
 * deferment_until, so we treat deferment_until >= today as still protecting
 * the point.
 */
export function getPointBlockStatus(point: PointOfSale, orders: Order[], today: Date = new Date()): PointBlockStatus {
  const unpaidOrders = orders.filter((o) => o.point_id === point.id && o.payment_status === "unpaid");

  if (unpaidOrders.length === 0) {
    return { blocked: false, reason: null, blockingOrder: null };
  }

  const todayStr = toDateOnly(today);
  const hasActiveDeferment = point.deferment_until != null && point.deferment_until >= todayStr;

  if (hasActiveDeferment) {
    return { blocked: false, reason: null, blockingOrder: null };
  }

  const blockingOrder = unpaidOrders[0];
  const reason = point.deferment_until
    ? `Точка «${point.name}» — боржник: відстрочка до ${point.deferment_until} минула, а замовлення №${shortId(blockingOrder.id)} не оплачене.`
    : `Точка «${point.name}» заблокована: замовлення №${shortId(blockingOrder.id)} не оплачене і відстрочки немає.`;

  return { blocked: true, reason, blockingOrder };
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function formatMoney(amount: number): string {
  return `${amount.toFixed(2)} грн`;
}

export const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  created: "Створено",
  pending_1c: "Очікує передачі в 1С",
  sent_to_1c: "Передано в 1С",
  cancelled: "Скасовано",
};

export const ORDER_PAYMENT_LABELS: Record<Order["payment_status"], string> = {
  none: "Без статусу оплати",
  unpaid: "Не оплачено",
  paid: "Оплачено",
};
