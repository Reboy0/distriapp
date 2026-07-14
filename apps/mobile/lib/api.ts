/**
 * Thin typed API client stub.
 *
 * Points at the real backend (http://localhost:8000/api/v1, per
 * docs/CONTRACT.md). The backend is being built in parallel and is not
 * expected to respond yet, so every exported function below:
 *   1. Tries the real HTTP call first (short timeout, so the UI doesn't hang).
 *   2. On any failure (network error, non-2xx, timeout), logs a warning and
 *      falls back to mock/in-memory data so screens still render and are
 *      interactive during development.
 *
 * Swap this out for real error handling / caching (react-query, etc.) once
 * the backend is live — the function signatures are meant to stay stable.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage, Client, Order, OrderItem, PointOfSale, Product } from "../types";
import {
  MOCK_CLIENT,
  mockChatMessages,
  mockOrderItems,
  mockOrders,
  mockPoints,
  mockProducts,
  nextMockId,
} from "./mock-data";

export const API_BASE_URL = "http://localhost:8000/api/v1";

const REQUEST_TIMEOUT_MS = 4000;

let authToken: string | null = null;

/** Called by AuthContext once it knows the current session token. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new ApiError(`API ${path} responded with ${res.status}`, res.status);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function warnFallback(path: string, err: unknown) {
  // Expected while the backend isn't up yet — this is not a bug, just a
  // dev-time signal that we're rendering mock data instead of live data.
  console.warn(`[api] ${path} unavailable, using mock data fallback:`, err instanceof Error ? err.message : err);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface RegisterClientPayload {
  invitation_code: string;
  name: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  token: string;
  client: Client;
}

export async function registerClient(payload: RegisterClientPayload): Promise<AuthResult> {
  try {
    return await request<AuthResult>("/auth/client/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    warnFallback("/auth/client/register", err);
    // Mock fallback: "accept" any invitation code so the rest of the app is
    // explorable without a live backend. A real backend would validate the
    // invitation code/status/expiry per CONTRACT.md (Invitation entity).
    const client: Client = {
      ...MOCK_CLIENT,
      name: payload.name || MOCK_CLIENT.name,
      phone: payload.phone || MOCK_CLIENT.phone,
    };
    return { token: `mock-token-${nextMockId("session")}`, client };
  }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
export async function getCatalog(pointId: string | null): Promise<Product[]> {
  const query = pointId ? `?point_id=${encodeURIComponent(pointId)}` : "";
  try {
    return await request<Product[]>(`/catalog${query}`);
  } catch (err) {
    warnFallback("/catalog", err);
    return mockProducts;
  }
}

// ---------------------------------------------------------------------------
// Points of sale
// ---------------------------------------------------------------------------
export async function getPoints(): Promise<PointOfSale[]> {
  try {
    return await request<PointOfSale[]>("/points");
  } catch (err) {
    warnFallback("/points", err);
    return mockPoints;
  }
}

export interface CreatePointPayload {
  name: string;
  address: string;
}

export async function createPoint(payload: CreatePointPayload): Promise<PointOfSale> {
  try {
    return await request<PointOfSale>("/points", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    warnFallback("/points (create)", err);
    const point: PointOfSale = {
      id: nextMockId("point"),
      client_id: MOCK_CLIENT.id,
      distributor_id: MOCK_CLIENT.distributor_id,
      name: payload.name,
      address: payload.address,
      is_active: true,
      deferment_until: null,
      created_at: new Date().toISOString(),
    };
    mockPoints.push(point);
    return point;
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export interface OrdersFilter {
  pointId?: string | null;
}

export async function getOrders(filter: OrdersFilter = {}): Promise<Order[]> {
  const query = filter.pointId ? `?point_id=${encodeURIComponent(filter.pointId)}` : "";
  try {
    return await request<Order[]>(`/orders${query}`);
  } catch (err) {
    warnFallback("/orders", err);
    return filter.pointId ? mockOrders.filter((o) => o.point_id === filter.pointId) : mockOrders;
  }
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  // Not a separate top-level CONTRACT.md endpoint (items travel embedded with
  // the order in a real API); kept as its own function here for the mock
  // fallback path and to keep call sites simple.
  return mockOrderItems.filter((i) => i.order_id === orderId);
}

export interface CreateOrderPayload {
  point_id: string;
  items: { product_id: string; qty: number; unit_price_with_vat: number }[];
}

/**
 * CONTRACT.md: "Кошик -> «Замовити» одразу створює Order і шле в 1С - без
 * екрана підтвердження." No confirmation step here by design - this is
 * called directly from the cart screen's submit button.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  try {
    return await request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    warnFallback("/orders (create)", err);
    const order: Order = {
      id: nextMockId("order"),
      point_id: payload.point_id,
      client_id: MOCK_CLIENT.id,
      distributor_id: MOCK_CLIENT.distributor_id,
      status: "pending_1c",
      // New orders never get a payment status automatically (CONTRACT.md).
      payment_status: "none",
      payment_status_manual: false,
      cancel_comment: null,
      onec_document_id: null,
      created_at: new Date().toISOString(),
      sent_at: null,
      cancelled_at: null,
    };
    mockOrders.unshift(order);
    payload.items.forEach((line) => {
      mockOrderItems.push({
        id: nextMockId("item"),
        order_id: order.id,
        product_id: line.product_id,
        qty: line.qty,
        unit_price_with_vat: line.unit_price_with_vat,
        sum: line.qty * line.unit_price_with_vat,
      });
    });
    return order;
  }
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
export async function getChatMessages(clientId: string): Promise<ChatMessage[]> {
  try {
    return await request<ChatMessage[]>(`/chat/threads/${encodeURIComponent(clientId)}/messages`);
  } catch (err) {
    warnFallback("/chat/threads/{client_id}/messages", err);
    return mockChatMessages;
  }
}

export async function postChatMessage(clientId: string, text: string, productId: string | null = null): Promise<ChatMessage> {
  try {
    return await request<ChatMessage>(`/chat/threads/${encodeURIComponent(clientId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text, product_id: productId }),
    });
  } catch (err) {
    warnFallback("/chat/threads/{client_id}/messages (post)", err);
    const message: ChatMessage = {
      id: nextMockId("msg"),
      thread_id: "thread-1",
      sender_type: "client",
      text,
      product_id: productId,
      created_at: new Date().toISOString(),
    };
    mockChatMessages.push(message);
    return message;
  }
}

// ---------------------------------------------------------------------------
// Token persistence helpers (kept here to keep AsyncStorage usage in one
// place; AuthContext is the only consumer).
// ---------------------------------------------------------------------------
const TOKEN_STORAGE_KEY = "distriapp.auth.token";
const CLIENT_STORAGE_KEY = "distriapp.auth.client";

export async function persistSession(token: string, client: Client): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_STORAGE_KEY, token],
    [CLIENT_STORAGE_KEY, JSON.stringify(client)],
  ]);
}

export async function loadPersistedSession(): Promise<AuthResult | null> {
  const [[, token], [, clientJson]] = await AsyncStorage.multiGet([TOKEN_STORAGE_KEY, CLIENT_STORAGE_KEY]);
  if (!token || !clientJson) return null;
  try {
    return { token, client: JSON.parse(clientJson) as Client };
  } catch {
    return null;
  }
}

export async function clearPersistedSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, CLIENT_STORAGE_KEY]);
}
