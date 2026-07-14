/**
 * Domain types mirroring docs/CONTRACT.md ("Сутності" section) field-for-field.
 * These are the canonical shapes shared conceptually with apps/distributor-web
 * and apps/admin-web / backend. Do not invent fields here — if the backend
 * needs something new, add it to CONTRACT.md first.
 *
 * ISO date-time strings are used for all `created_at` / timestamps (as
 * returned by a JSON API); plain `YYYY-MM-DD` strings are used for the few
 * date-only fields (`expires_at` on Invitation is a datetime per contract,
 * `deferment_until` on PointOfSale is date-only).
 */

export type ID = string;

// ---------------------------------------------------------------------------
// Distributor (tenant)
// ---------------------------------------------------------------------------
export interface Distributor {
  id: ID;
  name: string;
  contacts: string;
  onec_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Invitation
// ---------------------------------------------------------------------------
export type InvitationStatus = "active" | "used" | "expired";

export interface Invitation {
  id: ID;
  distributor_id: ID;
  code: string;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
export interface Client {
  id: ID;
  distributor_id: ID;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// PointOfSale (торгова точка)
// ---------------------------------------------------------------------------
export interface PointOfSale {
  id: ID;
  client_id: ID;
  distributor_id: ID;
  name: string;
  address: string;
  is_active: boolean;
  /** date-only (YYYY-MM-DD), null = no deferment set */
  deferment_until: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------
export interface Product {
  id: ID;
  distributor_id: ID;
  external_code: string;
  name: string;
  unit: string;
  /** Always VAT-inclusive. Never show a price without VAT anywhere in the UI. */
  base_price_with_vat: number;
  stock_qty: number;
  /** null => only "available" / "out_of_stock" statuses are meaningful */
  low_stock_threshold: number | null;
  is_new: boolean;
}

// ---------------------------------------------------------------------------
// PointProductPrice (manual per-point price override)
// ---------------------------------------------------------------------------
export interface PointProductPrice {
  id: ID;
  point_id: ID;
  product_id: ID;
  manual_price_with_vat: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------
export type OrderStatus = "created" | "pending_1c" | "sent_to_1c" | "cancelled";
export type OrderPaymentStatus = "none" | "unpaid" | "paid";

export interface Order {
  id: ID;
  point_id: ID;
  client_id: ID;
  distributor_id: ID;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_status_manual: boolean;
  cancel_comment: string | null;
  onec_document_id: string | null;
  created_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
}

// ---------------------------------------------------------------------------
// OrderItem
// ---------------------------------------------------------------------------
export interface OrderItem {
  id: ID;
  order_id: ID;
  product_id: ID;
  qty: number;
  /** VAT-inclusive unit price captured at order time */
  unit_price_with_vat: number;
  /** qty * unit_price_with_vat, captured at order time */
  sum: number;
}

// ---------------------------------------------------------------------------
// ChatThread / ChatMessage
// ---------------------------------------------------------------------------
export interface ChatThread {
  id: ID;
  client_id: ID;
  distributor_id: ID;
}

export type ChatSenderType = "client" | "distributor";

export interface ChatMessage {
  id: ID;
  thread_id: ID;
  sender_type: ChatSenderType;
  text: string;
  product_id: ID | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// SyncLog
// ---------------------------------------------------------------------------
export type SyncLogType = "catalog" | "payments" | "manual";
export type SyncLogStatus = "success" | "error";

export interface SyncLog {
  id: ID;
  distributor_id: ID;
  type: SyncLogType;
  status: SyncLogStatus;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

// ---------------------------------------------------------------------------
// UI-only derived types (NOT contract entities — computed client-side)
// ---------------------------------------------------------------------------

/** Derived from Product.stock_qty / low_stock_threshold, per CONTRACT.md rule.
 * Never derived from or displayed as an exact quantity. */
export type AvailabilityStatus = "available" | "low_stock" | "out_of_stock";

/** A cart line is a client-side draft of what will become an OrderItem once
 * "Замовити" is pressed. It is intentionally not part of the domain model. */
export interface CartLine {
  product: Product;
  qty: number;
  /** Resolved unit price for the currently selected point (manual override
   * if one exists via PointProductPrice, else base_price_with_vat). */
  unit_price_with_vat: number;
}
