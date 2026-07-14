import type { CatalogItem, ChatMessage, Order, PointOfSale } from "@/types";

export const mockPoints: PointOfSale[] = [
  {
    id: "mock-point-1",
    client_id: "mock-client",
    name: "Магазин на Хрещатику",
    address: "вул. Хрещатик, 1",
    is_active: true,
    deferment_until: null,
    is_blocked: false,
    blocked_reason: null,
  },
];

export const mockCatalog: CatalogItem[] = [
  {
    id: "mock-product-1",
    name: "Товар 1",
    unit: "шт",
    price_with_vat: 100,
    is_manual_price: false,
    availability: "available",
    is_new: true,
  },
  {
    id: "mock-product-2",
    name: "Товар 2",
    unit: "кг",
    price_with_vat: 250.5,
    is_manual_price: false,
    availability: "out",
    is_new: false,
  },
];

export const mockOrders: Order[] = [];

export const mockChatMessages: ChatMessage[] = [];
