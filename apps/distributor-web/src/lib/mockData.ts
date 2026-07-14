import type {
  ChatMessage,
  ChatThread,
  Client,
  Invitation,
  Order,
  OrderItem,
  PointOfSale,
  PointProductPrice,
  Product,
  SyncLog,
} from "@/types";

/**
 * Placeholder/mock data used as a fallback whenever the real backend
 * (http://localhost:8000/api/v1) is not reachable yet. This lets every
 * screen render something meaningful during early development.
 */

const DISTRIBUTOR_ID = "dist-1";

export const mockClients: Client[] = [
  { id: "cli-1", distributor_id: DISTRIBUTOR_ID, name: "ТОВ Смачний Хліб", phone: "+380501112233", is_active: true, created_at: "2026-05-02T09:00:00Z" },
  { id: "cli-2", distributor_id: DISTRIBUTOR_ID, name: "ФОП Іваненко О.П.", phone: "+380672223344", is_active: true, created_at: "2026-05-10T09:00:00Z" },
  { id: "cli-3", distributor_id: DISTRIBUTOR_ID, name: "Мережа Гастроном+", phone: "+380933334455", is_active: true, created_at: "2026-06-01T09:00:00Z" },
];

export const mockPoints: PointOfSale[] = [
  { id: "pt-1", client_id: "cli-1", distributor_id: DISTRIBUTOR_ID, name: "Магазин на Шевченка", address: "м. Київ, вул. Шевченка, 12", is_active: true, deferment_until: null, created_at: "2026-05-02T09:00:00Z" },
  { id: "pt-2", client_id: "cli-1", distributor_id: DISTRIBUTOR_ID, name: "Магазин на Франка", address: "м. Київ, вул. Франка, 5", is_active: true, deferment_until: "2026-07-20", created_at: "2026-05-03T09:00:00Z" },
  { id: "pt-3", client_id: "cli-2", distributor_id: DISTRIBUTOR_ID, name: "Кіоск \"Ранок\"", address: "м. Львів, пр. Свободи, 20", is_active: true, deferment_until: null, created_at: "2026-05-10T09:00:00Z" },
  { id: "pt-4", client_id: "cli-3", distributor_id: DISTRIBUTOR_ID, name: "Гастроном+ №1", address: "м. Одеса, вул. Дерибасівська, 1", is_active: true, deferment_until: "2026-06-01", created_at: "2026-06-01T09:00:00Z" },
  { id: "pt-5", client_id: "cli-3", distributor_id: DISTRIBUTOR_ID, name: "Гастроном+ №2", address: "м. Одеса, вул. Пушкінська, 44", is_active: true, deferment_until: null, created_at: "2026-06-02T09:00:00Z" },
];

export const mockProducts: Product[] = [
  { id: "prod-1", distributor_id: DISTRIBUTOR_ID, external_code: "1С-001", name: "Хліб пшеничний, 500г", unit: "шт", base_price_with_vat: 32.5, stock_qty: 120, low_stock_threshold: 20, is_new: false },
  { id: "prod-2", distributor_id: DISTRIBUTOR_ID, external_code: "1С-002", name: "Батон нарізний, 400г", unit: "шт", base_price_with_vat: 28.0, stock_qty: 8, low_stock_threshold: 15, is_new: false },
  { id: "prod-3", distributor_id: DISTRIBUTOR_ID, external_code: "1С-003", name: "Здоба з маком, 300г", unit: "шт", base_price_with_vat: 24.9, stock_qty: 0, low_stock_threshold: 10, is_new: true },
  { id: "prod-4", distributor_id: DISTRIBUTOR_ID, external_code: "1С-004", name: "Круасан вершковий", unit: "шт", base_price_with_vat: 19.9, stock_qty: 60, low_stock_threshold: null, is_new: true },
  { id: "prod-5", distributor_id: DISTRIBUTOR_ID, external_code: "1С-005", name: "Хліб цільнозерновий, 450г", unit: "шт", base_price_with_vat: 38.0, stock_qty: 45, low_stock_threshold: 10, is_new: false },
];

export const mockPointProductPrices: PointProductPrice[] = [
  { id: "ppp-1", point_id: "pt-1", product_id: "prod-1", manual_price_with_vat: 30.0, updated_at: "2026-06-15T10:00:00Z" },
  { id: "ppp-2", point_id: "pt-4", product_id: "prod-3", manual_price_with_vat: 22.0, updated_at: "2026-06-20T10:00:00Z" },
];

export const mockOrders: Order[] = [
  {
    id: "ord-1", point_id: "pt-1", client_id: "cli-1", distributor_id: DISTRIBUTOR_ID,
    status: "sent_to_1c", payment_status: "paid", payment_status_manual: true,
    cancel_comment: null, onec_document_id: "1C-DOC-0098", payment_url: null,
    created_at: "2026-07-10T08:15:00Z", sent_at: "2026-07-10T08:16:00Z", cancelled_at: null,
  },
  {
    id: "ord-2", point_id: "pt-3", client_id: "cli-2", distributor_id: DISTRIBUTOR_ID,
    status: "sent_to_1c", payment_status: "unpaid", payment_status_manual: false,
    cancel_comment: null, onec_document_id: "1C-DOC-0101", payment_url: null,
    created_at: "2026-07-11T09:30:00Z", sent_at: "2026-07-11T09:31:00Z", cancelled_at: null,
  },
  {
    id: "ord-3", point_id: "pt-4", client_id: "cli-3", distributor_id: DISTRIBUTOR_ID,
    status: "sent_to_1c", payment_status: "unpaid", payment_status_manual: false,
    cancel_comment: null, onec_document_id: "1C-DOC-0110", payment_url: null,
    created_at: "2026-07-12T11:00:00Z", sent_at: "2026-07-12T11:01:00Z", cancelled_at: null,
  },
  {
    id: "ord-4", point_id: "pt-5", client_id: "cli-3", distributor_id: DISTRIBUTOR_ID,
    status: "pending_1c", payment_status: "none", payment_status_manual: false,
    cancel_comment: null, onec_document_id: null, payment_url: null,
    created_at: "2026-07-13T07:45:00Z", sent_at: null, cancelled_at: null,
  },
  {
    id: "ord-5", point_id: "pt-2", client_id: "cli-1", distributor_id: DISTRIBUTOR_ID,
    status: "cancelled", payment_status: "none", payment_status_manual: false,
    cancel_comment: "Клієнт помилково оформив замовлення двічі.", onec_document_id: null, payment_url: null,
    created_at: "2026-07-09T12:00:00Z", sent_at: null, cancelled_at: "2026-07-09T12:30:00Z",
  },
];

export const mockOrderItems: OrderItem[] = [
  { id: "oi-1", order_id: "ord-1", product_id: "prod-1", qty: 10, unit_price_with_vat: 30.0, sum: 300.0 },
  { id: "oi-2", order_id: "ord-1", product_id: "prod-4", qty: 5, unit_price_with_vat: 19.9, sum: 99.5 },
  { id: "oi-3", order_id: "ord-2", product_id: "prod-2", qty: 20, unit_price_with_vat: 28.0, sum: 560.0 },
  { id: "oi-4", order_id: "ord-3", product_id: "prod-3", qty: 15, unit_price_with_vat: 22.0, sum: 330.0 },
  { id: "oi-5", order_id: "ord-3", product_id: "prod-5", qty: 8, unit_price_with_vat: 38.0, sum: 304.0 },
  { id: "oi-6", order_id: "ord-4", product_id: "prod-1", qty: 12, unit_price_with_vat: 32.5, sum: 390.0 },
  { id: "oi-7", order_id: "ord-5", product_id: "prod-2", qty: 4, unit_price_with_vat: 28.0, sum: 112.0 },
];

export const mockInvitations: Invitation[] = [
  { id: "inv-1", distributor_id: DISTRIBUTOR_ID, code: "INV-7K2P9Q", status: "used", created_at: "2026-05-01T09:00:00Z", expires_at: "2026-05-08T09:00:00Z" },
  { id: "inv-2", distributor_id: DISTRIBUTOR_ID, code: "INV-3F8L1M", status: "active", created_at: "2026-07-10T09:00:00Z", expires_at: "2026-07-17T09:00:00Z" },
  { id: "inv-3", distributor_id: DISTRIBUTOR_ID, code: "INV-9X4T2Z", status: "expired", created_at: "2026-06-01T09:00:00Z", expires_at: "2026-06-08T09:00:00Z" },
];

export const mockChatThreads: ChatThread[] = [
  { id: "thr-1", client_id: "cli-1", distributor_id: DISTRIBUTOR_ID },
  { id: "thr-2", client_id: "cli-2", distributor_id: DISTRIBUTOR_ID },
  { id: "thr-3", client_id: "cli-3", distributor_id: DISTRIBUTOR_ID },
];

export const mockChatMessages: ChatMessage[] = [
  { id: "msg-1", thread_id: "thr-1", sender_type: "client", text: "Доброго дня! Коли буде здоба з маком?", product_id: "prod-3", created_at: "2026-07-12T10:00:00Z" },
  { id: "msg-2", thread_id: "thr-1", sender_type: "distributor", text: "Доброго дня! Орієнтовно завтра вранці, повідомимо додатково.", product_id: null, created_at: "2026-07-12T10:05:00Z" },
  { id: "msg-3", thread_id: "thr-2", sender_type: "client", text: "Чи можна відстрочку по оплаті на тиждень?", product_id: null, created_at: "2026-07-11T14:00:00Z" },
  { id: "msg-4", thread_id: "thr-3", sender_type: "client", text: "Батон нарізний закінчується, коли поповнення?", product_id: "prod-2", created_at: "2026-07-13T08:20:00Z" },
];

export const mockSyncLogs: SyncLog[] = [];

export const mockDistributorName = "Хлібзавод №3";
