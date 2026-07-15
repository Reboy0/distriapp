import type { Distributor, SyncLog } from "@/types";
import { getToken } from "./auth";
import { mockDistributors, mockSyncLogs } from "./mockData";

/**
 * Thin typed API client for the admin web panel.
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

/* ------------------------------- Distributors ------------------------------ */

export function listDistributors(): Promise<Distributor[]> {
  return withFallback(
    () => request<Distributor[]>("/admin/distributors"),
    mockDistributors,
    "GET /admin/distributors"
  );
}

export function getDistributor(id: string): Promise<Distributor | undefined> {
  return withFallback(
    () => request<Distributor>(`/admin/distributors/${id}`),
    mockDistributors.find((d) => d.id === id),
    `GET /admin/distributors/${id}`
  );
}

export type DistributorInput = {
  name: string;
  contacts: string;
  onec_config: Record<string, unknown> | null;
};

export function createDistributor(input: DistributorInput): Promise<Distributor> {
  const fallback: Distributor = {
    id: `dist-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    contacts: input.contacts,
    onec_config: input.onec_config,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  return withFallback(
    () =>
      request<Distributor>("/admin/distributors", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    fallback,
    "POST /admin/distributors"
  );
}

export function updateDistributor(
  id: string,
  patch: Partial<DistributorInput & { is_active: boolean }>
): Promise<Distributor> {
  const existing = mockDistributors.find((d) => d.id === id);
  const fallback: Distributor = { ...(existing ?? mockDistributors[0]!), ...patch };
  return withFallback(
    () =>
      request<Distributor>(`/admin/distributors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    fallback,
    `PATCH /admin/distributors/${id}`
  );
}

export function deactivateDistributor(id: string): Promise<Distributor> {
  return updateDistributor(id, { is_active: false });
}

/* ------------------------------ Integrations -------------------------------- */

export function listAllSyncLogs(): Promise<SyncLog[]> {
  return withFallback(
    () => request<SyncLog[]>("/admin/integrations/sync-log"),
    mockSyncLogs,
    "GET /admin/integrations/sync-log"
  );
}
