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
import { getToken } from "./auth";
import {
  mockChatMessages,
  mockChatThreads,
  mockClients,
  mockInvitations,
  mockOrderItems,
  mockOrders,
  mockPointProductPrices,
  mockPoints,
  mockProducts,
  mockSyncLogs,
} from "./mockData";

/**
 * Thin typed API client for the distributor web panel.
 *
 * The real backend (FastAPI) is being built in parallel and may not be
 * reachable yet. Every function here tries the real endpoint first and
 * transparently falls back to local mock data on network failure, so the
 * UI always renders something meaningful.
 */
function resolveApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    // Single-VPS deploy with no domain yet: reach the backend on the same
    // host the app was opened from, fixed port 8000 — works for localhost,
    // a bare IP, or a domain without any per-deploy env var.
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return "http://localhost:8000/api/v1";
}

export const API_BASE_URL = resolveApiBaseUrl();

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${path} responded with ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Runs `fn`; on any failure (network, timeout, non-2xx) logs a warning and returns `fallback`. */
async function withFallback<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[api] ${label} — backend unavailable, using mock data.`, err);
    return fallback;
  }
}

/* ---------------------------------- Points ------------------------------- */

export function listPoints(): Promise<PointOfSale[]> {
  return withFallback(() => request<PointOfSale[]>("/points"), mockPoints, "GET /points");
}

export function listClients(): Promise<Client[]> {
  return withFallback(() => request<Client[]>("/clients"), mockClients, "GET /clients");
}

export function setPointDeferment(pointId: string, defermentUntil: string | null): Promise<PointOfSale> {
  const fallback: PointOfSale = {
    ...(mockPoints.find((p) => p.id === pointId) ?? mockPoints[0]!),
    deferment_until: defermentUntil,
  };
  return withFallback(
    () =>
      request<PointOfSale>(`/points/${pointId}/deferment`, {
        method: "PATCH",
        body: JSON.stringify({ deferment_until: defermentUntil }),
      }),
    fallback,
    `PATCH /points/${pointId}/deferment`
  );
}

/* ---------------------------------- Orders ------------------------------- */

export function listOrders(): Promise<Order[]> {
  return withFallback(() => request<Order[]>("/orders"), mockOrders, "GET /orders");
}

export function getOrder(orderId: string): Promise<Order | undefined> {
  return withFallback(
    () => request<Order>(`/orders/${orderId}`),
    mockOrders.find((o) => o.id === orderId),
    `GET /orders/${orderId}`
  );
}

export function listOrderItems(orderId: string): Promise<OrderItem[]> {
  return withFallback(
    () => request<OrderItem[]>(`/orders/${orderId}/items`),
    mockOrderItems.filter((i) => i.order_id === orderId),
    `GET /orders/${orderId}/items`
  );
}

export function cancelOrder(orderId: string, comment: string): Promise<Order> {
  const existing = mockOrders.find((o) => o.id === orderId);
  const fallback: Order = {
    ...(existing ?? mockOrders[0]!),
    status: "cancelled",
    cancel_comment: comment,
    cancelled_at: new Date().toISOString(),
  };
  return withFallback(
    () =>
      request<Order>(`/orders/${orderId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
    fallback,
    `POST /orders/${orderId}/cancel`
  );
}

export function setOrderPaymentStatus(
  orderId: string,
  paymentStatus: "paid" | "unpaid"
): Promise<Order> {
  const existing = mockOrders.find((o) => o.id === orderId);
  const fallback: Order = {
    ...(existing ?? mockOrders[0]!),
    payment_status: paymentStatus,
    payment_status_manual: true,
  };
  return withFallback(
    () =>
      request<Order>(`/orders/${orderId}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: paymentStatus }),
      }),
    fallback,
    `PATCH /orders/${orderId}/payment-status`
  );
}

export function setOrderPaymentLink(orderId: string, paymentUrl: string | null): Promise<Order> {
  const existing = mockOrders.find((o) => o.id === orderId);
  const fallback: Order = { ...(existing ?? mockOrders[0]!), payment_url: paymentUrl };
  return withFallback(
    () =>
      request<Order>(`/orders/${orderId}/payment-link`, {
        method: "PATCH",
        body: JSON.stringify({ payment_url: paymentUrl }),
      }),
    fallback,
    `PATCH /orders/${orderId}/payment-link`
  );
}

/* --------------------------------- Catalog -------------------------------- */

export function listProducts(): Promise<Product[]> {
  return withFallback(() => request<Product[]>("/catalog/products"), mockProducts, "GET /catalog/products");
}

export function updateProduct(
  productId: string,
  patch: Partial<Pick<Product, "low_stock_threshold" | "is_new">>
): Promise<Product> {
  const existing = mockProducts.find((p) => p.id === productId);
  const fallback: Product = { ...(existing ?? mockProducts[0]!), ...patch };
  return withFallback(
    () =>
      request<Product>(`/catalog/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    fallback,
    `PATCH /catalog/products/${productId}`
  );
}

export function listPointProductPrices(): Promise<PointProductPrice[]> {
  return withFallback(
    () => request<PointProductPrice[]>("/catalog/point-prices"),
    mockPointProductPrices,
    "GET /catalog/point-prices"
  );
}

export function setManualPrice(
  pointId: string,
  productId: string,
  manualPriceWithVat: number
): Promise<PointProductPrice> {
  const fallback: PointProductPrice = {
    id: `ppp-${pointId}-${productId}`,
    point_id: pointId,
    product_id: productId,
    manual_price_with_vat: manualPriceWithVat,
    updated_at: new Date().toISOString(),
  };
  return withFallback(
    () =>
      request<PointProductPrice>(`/catalog/points/${pointId}/prices/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ manual_price_with_vat: manualPriceWithVat }),
      }),
    fallback,
    `PUT /catalog/points/${pointId}/prices/${productId}`
  );
}

export function resetManualPrice(pointId: string, productId: string): Promise<void> {
  return withFallback(
    () =>
      request<void>(`/catalog/points/${pointId}/prices/${productId}`, {
        method: "DELETE",
      }),
    undefined,
    `DELETE /catalog/points/${pointId}/prices/${productId}`
  );
}

/* ------------------------------- Invitations ------------------------------ */

export function listInvitations(): Promise<Invitation[]> {
  return withFallback(() => request<Invitation[]>("/invitations"), mockInvitations, "GET /invitations");
}

export function createInvitation(): Promise<Invitation> {
  const code = `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fallback: Invitation = {
    id: `inv-${Math.random().toString(36).slice(2, 8)}`,
    distributor_id: mockInvitations[0]?.distributor_id ?? "dist-1",
    code,
    status: "active",
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  return withFallback(
    () => request<Invitation>("/invitations", { method: "POST" }),
    fallback,
    "POST /invitations"
  );
}

/* ----------------------------------- Chat ---------------------------------- */

export function listChatThreads(): Promise<ChatThread[]> {
  return withFallback(() => request<ChatThread[]>("/chat/threads"), mockChatThreads, "GET /chat/threads");
}

export function listChatMessages(clientId: string): Promise<ChatMessage[]> {
  const thread = mockChatThreads.find((t) => t.client_id === clientId);
  return withFallback(
    () => request<ChatMessage[]>(`/chat/threads/${clientId}/messages`),
    mockChatMessages.filter((m) => m.thread_id === thread?.id),
    `GET /chat/threads/${clientId}/messages`
  );
}

export function sendChatMessage(
  clientId: string,
  text: string,
  productId: string | null = null
): Promise<ChatMessage> {
  const thread = mockChatThreads.find((t) => t.client_id === clientId);
  const fallback: ChatMessage = {
    id: `msg-${Math.random().toString(36).slice(2, 8)}`,
    thread_id: thread?.id ?? "thr-1",
    sender_type: "distributor",
    text,
    product_id: productId,
    created_at: new Date().toISOString(),
  };
  return withFallback(
    () =>
      request<ChatMessage>(`/chat/threads/${clientId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text, product_id: productId }),
      }),
    fallback,
    `POST /chat/threads/${clientId}/messages`
  );
}

/* ---------------------------------- Sync ----------------------------------- */

export function triggerSync(): Promise<SyncLog> {
  const now = new Date();
  const fallback: SyncLog = {
    id: `sync-${Math.random().toString(36).slice(2, 8)}`,
    distributor_id: "dist-1",
    type: "manual",
    status: "success",
    started_at: now.toISOString(),
    finished_at: new Date(now.getTime() + 1500).toISOString(),
    error_message: null,
  };
  return withFallback(
    () => request<SyncLog>("/integrations/sync", { method: "POST" }),
    fallback,
    "POST /integrations/sync"
  );
}

export function listSyncLogs(): Promise<SyncLog[]> {
  return withFallback(() => request<SyncLog[]>("/integrations/sync-log"), mockSyncLogs, "GET /integrations/sync-log");
}
