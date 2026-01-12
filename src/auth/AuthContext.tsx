import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import queryClient from "@api/queryClient";
import api, { setAccessToken, setOnUnauthenticated } from "@api/client";
import { getApiBaseUrl } from "@api/baseUrl";
import { ROUTES } from "@routes/routes.config";
import type { User } from "@api/users/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (params: { accessToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// In dev, React.StrictMode intentionally runs mount/unmount cycles twice.
// This can cause duplicate bootstrap calls (refresh + /me). We gate it.
let bootstrapPromise: Promise<void> | null = null;

async function fetchMe(): Promise<User> {
  const resp = await api.get<User>("/users/me");
  return resp.data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(async () => {
    // Allow bootstrapping again after explicit logout.
    bootstrapPromise = null;
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();

    // IMPORTANT: the refresh token is an HttpOnly cookie, so we must let the server
    // clear it. If we navigate away too quickly, the request can be canceled and
    // the cookie remains, allowing an immediate re-auth via /auth/refresh.
    //
    // Use fetch keepalive and a short timeout to maximize reliability.
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 1500);
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
    } catch {
      // ignore
    }

    // Force a hard redirect to clear any in-memory state.
    window.location.assign(ROUTES.LOGIN);
  }, []);

  const bootstrap = useCallback(async () => {
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      setStatus("loading");
      try {
        // Attempt to load session using refresh cookie.
        // This will succeed if the user has a valid refresh cookie.
        const refreshResp = await api.post("/auth/refresh", null);
        const token = refreshResp.data?.accessToken as string | undefined;
        if (token) {
          setAccessToken(token);
        }

        const me = await fetchMe();
        setUser(me);
        setStatus("authenticated");
      } catch {
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    })();

    return bootstrapPromise;
  }, []);

  const login = useCallback(async ({ accessToken }: { accessToken: string }) => {
    setAccessToken(accessToken);
    // Make sure subsequent calls see user immediately.
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    const me = await fetchMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  // Wire axios unauth handler -> logout
  useEffect(() => {
    setOnUnauthenticated(() => {
      // Avoid throwing from interceptor; fire-and-forget.
      void logout();
    });
    return () => setOnUnauthenticated(null);
  }, [logout]);

  // Initial boot
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, bootstrap }),
    [status, user, login, logout, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
