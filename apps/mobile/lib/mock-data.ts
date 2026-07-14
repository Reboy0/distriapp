/**
 * Placeholder/mock fixtures used as a fallback whenever the live backend
 * (http://localhost:8000/api/v1) is unreachable — expected while the backend
 * is being built in parallel. See lib/api.ts.
 *
 * The arrays below are intentionally `let`-mutable module state: they act as
 * a tiny in-memory pseudo-backend for the current app session so that, e.g.,
 * creating an order or sending a chat message is reflected immediately in
 * other screens even with no real API behind it.
 */
import type {
  ChatMessage,
  Client,
  Distributor,
  Order,
  OrderItem,
  PointOfSale,
  Product,
} from "../types";

export const MOCK_DISTRIBUTOR: Distributor = {
  id: "dist-1",
  name: "ТОВ Дистрибуція Плюс",
  contacts: "+380 44 000 00 00, sales@distribution-plus.ua",
  onec_config: null,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
};

export const MOCK_CLIENT: Client = {
  id: "client-1",
  distributor_id: MOCK_DISTRIBUTOR.id,
  name: "ФОП Іваненко (Магазин «Смачно»)",
  phone: "+380671234567",
  is_active: true,
  created_at: "2025-02-01T00:00:00Z",
};

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    distributor_id: MOCK_DISTRIBUTOR.id,
    external_code: "SKU-001",
    name: "Соняшникова олія 1л",
    unit: "шт",
    base_price_with_vat: 68.5,
    stock_qty: 120,
    low_stock_threshold: 20,
    is_new: false,
  },
  {
    id: "prod-2",
    distributor_id: MOCK_DISTRIBUTOR.id,
    external_code: "SKU-002",
    name: "Цукор-пісок 1кг",
    unit: "шт",
    base_price_with_vat: 32.9,
    stock_qty: 8,
    low_stock_threshold: 15,
    is_new: false,
  },
  {
    id: "prod-3",
    distributor_id: MOCK_DISTRIBUTOR.id,
    external_code: "SKU-003",
    name: "Гречка ядриця 900г",
    unit: "шт",
    base_price_with_vat: 44.0,
    stock_qty: 0,
    low_stock_threshold: 10,
    is_new: false,
  },
  {
    id: "prod-4",
    distributor_id: MOCK_DISTRIBUTOR.id,
    external_code: "SKU-004",
    name: "Кава розчинна 150г, нова рецептура",
    unit: "шт",
    base_price_with_vat: 129.0,
    stock_qty: 45,
    low_stock_threshold: null,
    is_new: true,
  },
  {
    id: "prod-5",
    distributor_id: MOCK_DISTRIBUTOR.id,
    external_code: "SKU-005",
    name: "Мінеральна вода 1.5л",
    unit: "шт",
    base_price_with_vat: 21.75,
    stock_qty: 300,
    low_stock_threshold: 50,
    is_new: false,
  },
  {
    id: "prod-6",
    distributor_id: MOCK_DISTRIBUTOR.id,
    external_code: "SKU-006",
    name: "Макарони спагетті 500г",
    unit: "шт",
    base_price_with_vat: 27.4,
    stock_qty: 0,
    low_stock_threshold: null,
    is_new: false,
  },
];

export const mockPoints: PointOfSale[] = [
  {
    id: "point-1",
    client_id: MOCK_CLIENT.id,
    distributor_id: MOCK_DISTRIBUTOR.id,
    name: "Магазин «Смачно», вул. Хрещатик 10",
    address: "м. Київ, вул. Хрещатик, 10",
    is_active: true,
    deferment_until: null,
    created_at: "2025-02-02T00:00:00Z",
  },
  {
    id: "point-2",
    client_id: MOCK_CLIENT.id,
    distributor_id: MOCK_DISTRIBUTOR.id,
    name: "Магазин «Смачно», вул. Січових Стрільців 5",
    address: "м. Київ, вул. Січових Стрільців, 5",
    is_active: true,
    deferment_until: null,
    created_at: "2025-03-10T00:00:00Z",
  },
];

export const mockOrders: Order[] = [
  {
    id: "order-1",
    point_id: "point-1",
    client_id: MOCK_CLIENT.id,
    distributor_id: MOCK_DISTRIBUTOR.id,
    status: "sent_to_1c",
    payment_status: "unpaid",
    payment_status_manual: false,
    cancel_comment: null,
    onec_document_id: "1C-DOC-000123",
    created_at: "2026-06-20T09:15:00Z",
    sent_at: "2026-06-20T09:15:05Z",
    cancelled_at: null,
  },
  {
    id: "order-2",
    point_id: "point-2",
    client_id: MOCK_CLIENT.id,
    distributor_id: MOCK_DISTRIBUTOR.id,
    status: "sent_to_1c",
    payment_status: "paid",
    payment_status_manual: true,
    cancel_comment: null,
    onec_document_id: "1C-DOC-000098",
    created_at: "2026-06-05T14:02:00Z",
    sent_at: "2026-06-05T14:02:03Z",
    cancelled_at: null,
  },
  {
    id: "order-3",
    point_id: "point-1",
    client_id: MOCK_CLIENT.id,
    distributor_id: MOCK_DISTRIBUTOR.id,
    status: "cancelled",
    payment_status: "none",
    payment_status_manual: false,
    cancel_comment: "Дублікат замовлення №order-1",
    onec_document_id: null,
    created_at: "2026-05-28T11:40:00Z",
    sent_at: null,
    cancelled_at: "2026-05-28T12:00:00Z",
  },
];

export const mockOrderItems: OrderItem[] = [
  { id: "item-1", order_id: "order-1", product_id: "prod-1", qty: 10, unit_price_with_vat: 68.5, sum: 685 },
  { id: "item-2", order_id: "order-1", product_id: "prod-5", qty: 24, unit_price_with_vat: 21.75, sum: 522 },
  { id: "item-3", order_id: "order-2", product_id: "prod-2", qty: 5, unit_price_with_vat: 32.9, sum: 164.5 },
  { id: "item-4", order_id: "order-3", product_id: "prod-1", qty: 3, unit_price_with_vat: 68.5, sum: 205.5 },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    thread_id: "thread-1",
    sender_type: "distributor",
    text: "Доброго дня! Чим можемо допомогти?",
    product_id: null,
    created_at: "2026-07-10T08:00:00Z",
  },
  {
    id: "msg-2",
    thread_id: "thread-1",
    sender_type: "client",
    text: "Коли буде гречка ядриця?",
    product_id: "prod-3",
    created_at: "2026-07-10T08:05:00Z",
  },
];

let idCounter = 1000;
export function nextMockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
