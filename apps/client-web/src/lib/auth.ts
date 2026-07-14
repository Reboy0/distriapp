"use client";

const TOKEN_KEY = "client_web_token";
const NAME_KEY = "client_web_name";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, name?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  if (name) window.localStorage.setItem(NAME_KEY, name);
}

export function getClientName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(NAME_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/** Reads the `sub` (client id) claim out of the JWT payload — no signature
 * check needed client-side, we only use this to address our own thread. */
export function getClientId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Unlike the distributor/admin panels, login/registration here never fall
 * back to a fake local session on network failure — this app has no
 * meaningful offline mode (every screen needs real catalog/order data), so
 * a real error is more honest than a session that immediately dead-ends.
 */
export async function login(phone: string, password: string): Promise<void> {
  const { API_BASE_URL } = await import("./api");
  const res = await fetch(`${API_BASE_URL}/auth/client/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Помилка входу (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string };
  setSession(data.access_token, undefined);
}

export async function register(
  invitationCode: string,
  name: string,
  phone: string,
  password: string
): Promise<void> {
  const { API_BASE_URL } = await import("./api");
  const res = await fetch(`${API_BASE_URL}/auth/client/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invitation_code: invitationCode, name, phone, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Помилка реєстрації (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string };
  setSession(data.access_token, name);
}
