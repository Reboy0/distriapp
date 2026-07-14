"use client";

/**
 * Minimal client-side "auth" stub.
 * There is no real auth backend wired up yet — we just keep a fake JWT
 * in localStorage and gate routes with it. Good enough for a skeleton.
 */

const TOKEN_KEY = "admin_web_token";
const ADMIN_NAME_KEY = "admin_web_admin_name";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, adminName?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  if (adminName) {
    window.localStorage.setItem(ADMIN_NAME_KEY, adminName);
  }
}

export function getAdminName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_NAME_KEY);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_NAME_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

function fakeJwt(subject: string): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: subject, role: "admin", exp: Date.now() / 1000 + 60 * 60 * 8 })
  );
  return `${header}.${payload}.fake-signature`;
}

/**
 * Logs the admin in. Tries the real backend first; if it is not reachable
 * (expected during early development), falls back to a fake local session
 * so the UI stays navigable.
 */
export async function login(email: string, password: string): Promise<void> {
  const { API_BASE_URL } = await import("./api");
  try {
    const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`login failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string; admin_name?: string };
    setToken(data.access_token, data.admin_name);
    return;
  } catch {
    // Backend not available yet — fall back to a local fake session.
    setToken(fakeJwt(email), email.split("@")[0] || "Адміністратор");
  }
}
