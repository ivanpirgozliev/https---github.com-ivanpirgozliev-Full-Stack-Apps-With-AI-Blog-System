import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginInput, PublicUser, RegisterInput } from "@blog/shared";
import { api } from "./api";
import { tokenStorage } from "./token-storage";

// The KEY is just a lookup identifier — the actual JWT value is stored
// in Keychain/Keystore on native, or localStorage on web (see token-storage.ts
// for the trade-off rationale). It's safe to be a public constant.
const TOKEN_KEY = "blog_auth_token";

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface MeResponse {
  user: PublicUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (jwt: string) => {
    try {
      const me = await api<MeResponse>("/api/v1/auth/me", { token: jwt });
      setUser(me.user);
    } catch {
      setUser(null);
      await tokenStorage.remove(TOKEN_KEY);
      setToken(null);
    }
  }, []);

  // Hydrate token from storage on first mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await tokenStorage.get(TOKEN_KEY);
        if (!alive) return;
        if (stored) {
          setToken(stored);
          await fetchMe(stored);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchMe]);

  const login = useCallback(async (input: LoginInput) => {
    const result = await api<{ user: PublicUser; token: string }>("/api/v1/auth/login", {
      body: input,
    });
    await tokenStorage.set(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await api<{ user: PublicUser; token: string }>("/api/v1/auth/register", {
      body: input,
    });
    await tokenStorage.set(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.remove(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (token) await fetchMe(token);
  }, [token, fetchMe]);

  const value: AuthState = { user, token, loading, login, register, logout, refresh };
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
