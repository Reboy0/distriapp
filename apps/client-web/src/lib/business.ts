/**
 * Unlike distributor-web, this app doesn't recompute blocking/availability
 * client-side — the backend already resolves both (services/blocking.py,
 * services/stock_status.py) and sends is_blocked/blocked_reason/availability
 * directly on PointOfSale/CatalogItem. This file is just display formatting.
 */

/**
 * The API has no explicit "step" for a unit (CAT-4: no multiple-of
 * validation, arbitrary quantity is always allowed) — this only picks a
 * sensible +/- increment for the stepper UI. Piece-like units count by 1;
 * weight/volume units get a fractional step so the stepper stays useful.
 */
export function stepForUnit(unit: string): number {
  const piece = /^(шт|уп|пач|кор|бут|бан)/i;
  return piece.test(unit.trim()) ? 1 : 0.1;
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
