/**
 * Minimal auth state for the invitation-only registration flow
 * (docs/CONTRACT.md: "Auth: реєстрація лише за запрошенням ... без відкритої
 * реєстрації"). No real password/session security here — this is a skeleton
 * that stores a fake token in AsyncStorage so the app remembers "login"
 * across restarts, per the task brief ("don't over-engineer").
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearPersistedSession,
  loadPersistedSession,
  persistSession,
  registerClient,
  setAuthToken,
} from "../lib/api";
import type { Client } from "../types";

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  client: Client | null;
  token: string | null;
  registerWithInvitation: (args: { invitationCode: string; name: string; phone: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    (async () => {
      const session = await loadPersistedSession();
      if (session) {
        setToken(session.token);
        setClient(session.client);
        setAuthToken(session.token);
      }
      setIsLoading(false);
    })();
  }, []);

  const registerWithInvitation = async ({
    invitationCode,
    name,
    phone,
  }: {
    invitationCode: string;
    name: string;
    phone: string;
  }) => {
    // No password screen in this skeleton; a placeholder is sent so the
    // stub API shape matches CONTRACT.md's POST /auth/client/register.
    const result = await registerClient({
      invitation_code: invitationCode,
      name,
      phone,
      password: "placeholder",
    });
    await persistSession(result.token, result.client);
    setAuthToken(result.token);
    setToken(result.token);
    setClient(result.client);
  };

  const logout = async () => {
    await clearPersistedSession();
    setAuthToken(null);
    setToken(null);
    setClient(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: !!token && !!client,
      client,
      token,
      registerWithInvitation,
      logout,
    }),
    [isLoading, token, client]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
