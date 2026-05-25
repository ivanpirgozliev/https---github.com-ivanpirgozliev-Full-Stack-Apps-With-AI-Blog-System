// Plain constants safe to import from middleware (edge runtime) and
// from any other context — no heavy deps, no `server-only`.
export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
