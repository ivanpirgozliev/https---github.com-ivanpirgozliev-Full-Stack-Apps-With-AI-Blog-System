/**
 * Discriminated union returned by every service. Callers do `if (r.ok) …` and
 * TS narrows access to `data` / `error`. Never throw across service boundaries.
 */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export interface ServiceError {
  code: string;
  message: string;
}

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export function err(code: string, message: string): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

/**
 * Suggested HTTP status for each well-known error code. Route handlers can
 * lookup or default to 400.
 */
export const ERROR_STATUS: Readonly<Record<string, number>> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  EMAIL_TAKEN: 409,
  SLUG_CONFLICT: 409,
  CONFLICT: 409,
  VALIDATION: 400,
  BAD_JSON: 400,
  INVALID_CATEGORY: 400,
};

export function statusForError(code: string): number {
  return ERROR_STATUS[code] ?? 400;
}
