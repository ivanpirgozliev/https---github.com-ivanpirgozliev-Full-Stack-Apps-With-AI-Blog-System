import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import type { LoginInput, PublicUser, RegisterInput } from "@blog/shared";
import { api } from "./api";

// The KEY is just a lookup identifier — the actual JWT value is stored
// encrypted (iOS Keychain / Android Keystore). It's safe to be a public
// constant; renaming it gives no security benefit.
const TOKEN_KEY = "blog_auth_token";

// WHEN_UNLOCKED_THIS_DEVICE_ONLY:
// - iOS: blocks the token from syncing to iCloud Keychain or being restored
//   from an iCloud backup to a different device.
// - Android: best-effort; expo-secure-store uses an Android Keystore-backed
//   key that's similarly device-bound.
// Trade-off: if the user restores from backup to a new phone, they'll need
// to sign in again — acceptable for our threat model.
const SECURE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

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
      await SecureStore.deleteItemAsync(TOKEN_KEY, SECURE_OPTS);
      setToken(null);
    }
  }, []);

  // Hydrate token from SecureStore on first mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY, SECURE_OPTS);
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
    await SecureStore.setItemAsync(TOKEN_KEY, result.token, SECURE_OPTS);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await api<{ user: PublicUser; token: string }>("/api/v1/auth/register", {
      body: input,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, result.token, SECURE_OPTS);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY, SECURE_OPTS);
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
