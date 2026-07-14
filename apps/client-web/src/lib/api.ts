import type { CatalogItem, ChatMessage, Order, PointOfSale } from "@/types";
import { getToken } from "./auth";
import { mockCatalog, mockChatMessages, mockOrders, mockPoints } from "./mockData";

/**
 * Thin typed API client for the client-facing (store representative) app.
 * Same request/fallback shape as distributor-web/admin-web for consistency.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
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
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? `API ${path} responded with ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Runs `fn`; on network/timeout failure logs a warning and returns `fallback`.
 * Does NOT swallow real API errors (4xx/5xx with a body) — those are
 * thrown as ApiError so callers can show the actual reason (e.g. "точка
 * заблокована"), only genuine unreachability falls back to mock data. */
async function withFallback<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn(`[api] ${label} — backend unavailable, using mock data.`, err);
    return fallback;
  }
}

export { ApiError };

/* --------------------------------- Catalog -------------------------------- */

export function listCatalog(pointId: string): Promise<CatalogItem[]> {
  return withFallback(
    () => request<CatalogItem[]>(`/catalog?point_id=${encodeURIComponent(pointId)}`),
    mockCatalog,
    "GET /catalog"
  );
}

/* --------------------------------- Points --------------------------------- */

export function listPoints(): Promise<PointOfSale[]> {
  return withFallback(() => request<PointOfSale[]>("/points"), mockPoints, "GET /points");
}

export function createPoint(name: string, address: string): Promise<PointOfSale> {
  return request<PointOfSale>("/points", {
    method: "POST",
    body: JSON.stringify({ name, address }),
  });
}

/* --------------------------------- Orders --------------------------------- */

export function listOrders(pointId?: string): Promise<Order[]> {
  const query = pointId ? `?point_id=${encodeURIComponent(pointId)}` : "";
  return withFallback(() => request<Order[]>(`/orders${query}`), mockOrders, "GET /orders");
}

export interface OrderItemInput {
  product_id: string;
  qty: number;
}

/** ORD-3/4: submitting IS the confirmation — no separate "are you sure?" step. */
export function submitOrder(pointId: string, items: OrderItemInput[]): Promise<Order> {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ point_id: pointId, items }),
  });
}

/* ---------------------------------- Chat ---------------------------------- */

export function listChatMessages(clientId: string): Promise<ChatMessage[]> {
  return withFallback(
    () => request<ChatMessage[]>(`/chat/threads/${clientId}/messages`),
    mockChatMessages,
    "GET /chat/threads/:id/messages"
  );
}

export function sendChatMessage(
  clientId: string,
  text: string,
  productId?: string
): Promise<ChatMessage> {
  return request<ChatMessage>(`/chat/threads/${clientId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text, product_id: productId ?? null }),
  });
}
