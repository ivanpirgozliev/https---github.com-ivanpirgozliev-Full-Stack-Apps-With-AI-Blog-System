import Constants from "expo-constants";

const FALLBACK_API_URL = "http://localhost:3000";

/**
 * Resolve the API base URL. `EXPO_PUBLIC_API_URL` is baked into the bundle.
 * In dev it should point at the developer's LAN IP (e.g. http://192.168.1.2:3000)
 * because the device sees `localhost` as itself.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Last resort for Expo Go dev: pull the bundler host.
  const hostUri = Constants.expoConfig?.hostUri ?? "";
  const host = hostUri.split(":")[0];
  if (host) return `http://${host}:3000`;
  return FALLBACK_API_URL;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  token?: string | null;
  /** Override JSON content-type and skip body serialization (for raw bodies). */
  raw?: boolean;
  headers?: Record<string, string>;
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path}`;
  const headers: Record<string, string> = { ...opts.headers };
  if (!opts.raw && opts.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (opts.token) {
    headers.authorization = `Bearer ${opts.token}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body === undefined
      ? undefined
      : opts.raw
        ? (opts.body as BodyInit)
        : JSON.stringify(opts.body),
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const code = isJson && payload?.error?.code ? payload.error.code : "REQUEST_FAILED";
    const message =
      isJson && payload?.error?.message
        ? payload.error.message
        : typeof payload === "string"
          ? payload.slice(0, 200)
          : `HTTP ${res.status}`;
    throw new ApiError(res.status, code, message);
  }

  // Our API envelope is `{ ok: true, data: ... }`. Unwrap when present.
  if (isJson && payload && typeof payload === "object" && "ok" in payload && payload.ok === true) {
    return payload.data as T;
  }
  return payload as T;
}
