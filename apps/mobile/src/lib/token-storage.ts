import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Platform-aware token storage.
 *
 * Native (iOS/Android): expo-secure-store — JWT lives in Keychain / Keystore.
 * Web: window.localStorage — note that this is XSS-readable. For the web build
 * we accept this trade-off (the alternative is HttpOnly cookies, which the
 * mobile RN app can't easily share with native). The web export is primarily
 * for demo / preview; native is the production target.
 */

const SECURE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function isWeb(): boolean {
  return Platform.OS === "web";
}

export const tokenStorage = {
  async get(key: string): Promise<string | null> {
    if (isWeb()) {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(key, SECURE_OPTS);
  },

  async set(key: string, value: string): Promise<void> {
    if (isWeb()) {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      } catch {
        /* quota or private-mode — silently no-op */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, SECURE_OPTS);
  },

  async remove(key: string): Promise<void> {
    if (isWeb()) {
      try {
        if (typeof window !== "undefined") window.localStorage.removeItem(key);
      } catch {
        /* no-op */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key, SECURE_OPTS);
  },
};
