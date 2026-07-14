/**
 * Domain types for the client-facing (store representative) web app.
 * Mirrors what the backend actually returns to a `client`-role token — see
 * docs/CONTRACT.md and backend/app/schemas/*. Dates are ISO-8601 strings.
 */

export type ID = string;

export interface PointOfSale {
  id: ID;
  client_id: ID;
  name: string;
  address: string;
  is_active: boolean;
  deferment_until: string | null;
  // Precomputed by the backend on every read (services/blocking.py) — see
  // ORD-7: the client must see *why* a point is blocked, not just that it is.
  is_blocked: boolean;
  blocked_reason: string | null;
}

export type AvailabilityStatus = "available" | "low" | "out";

/**
 * What GET /catalog?point_id=... returns — already resolved (manual-over-base
 * price) and already reduced to a coarse status. Exact stock_qty is never
 * sent to the client (CAT-5), so there is no raw Product type here.
 */
export interface CatalogItem {
  id: ID;
  name: string;
  unit: string;
  price_with_vat: number;
  is_manual_price: boolean;
  availability: AvailabilityStatus;
  is_new: boolean;
}

export type OrderStatus = "created" | "pending_1c" | "sent_to_1c" | "cancelled";
export type PaymentStatus = "none" | "unpaid" | "paid";

export interface OrderItem {
  product_id: ID;
  qty: number;
  unit_price_with_vat: number;
  sum: number;
}

export interface Order {
  id: ID;
  point_id: ID;
  client_id: ID;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_status_manual: boolean;
  cancel_comment: string | null;
  onec_document_id: string | null;
  // Not a real payment integration — a URL the distributor pastes in from
  // whatever payment tool they already use.
  payment_url: string | null;
  created_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
  items: OrderItem[];
}

export type ChatSenderType = "client" | "distributor";

export interface ChatMessage {
  id: ID;
  sender_type: ChatSenderType;
  text: string;
  product_id: ID | null;
  created_at: string;
}

export interface CartLine {
  product: CatalogItem;
  qty: number;
}
