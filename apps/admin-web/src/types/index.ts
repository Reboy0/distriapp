/**
 * Domain types mirroring docs/CONTRACT.md entities 1:1 (field names & shapes).
 * Dates are ISO-8601 strings as sent by the backend (FastAPI/pydantic).
 */

export type ID = string;

export interface Distributor {
  id: ID;
  name: string;
  contacts: string;
  onec_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export type InvitationStatus = "active" | "used" | "expired";

export interface Invitation {
  id: ID;
  distributor_id: ID;
  code: string;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
}

export interface Client {
  id: ID;
  distributor_id: ID;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface PointOfSale {
  id: ID;
  client_id: ID;
  distributor_id: ID;
  name: string;
  address: string;
  is_active: boolean;
  deferment_until: string | null;
  created_at: string;
}

export interface Product {
  id: ID;
  distributor_id: ID;
  external_code: string;
  name: string;
  unit: string;
  base_price_with_vat: number;
  stock_qty: number;
  low_stock_threshold: number | null;
  is_new: boolean;
}

export interface PointProductPrice {
  id: ID;
  point_id: ID;
  product_id: ID;
  manual_price_with_vat: number;
  updated_at: string;
}

export type OrderStatus = "created" | "pending_1c" | "sent_to_1c" | "cancelled";
export type PaymentStatus = "none" | "unpaid" | "paid";

export interface Order {
  id: ID;
  point_id: ID;
  client_id: ID;
  distributor_id: ID;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_status_manual: boolean;
  cancel_comment: string | null;
  onec_document_id: string | null;
  created_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
}

export interface OrderItem {
  id: ID;
  order_id: ID;
  product_id: ID;
  qty: number;
  unit_price_with_vat: number;
  sum: number;
}

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

export type SyncType = "catalog" | "payments" | "manual";
export type SyncStatus = "success" | "error";

export interface SyncLog {
  id: ID;
  distributor_id: ID;
  type: SyncType;
  status: SyncStatus;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}
