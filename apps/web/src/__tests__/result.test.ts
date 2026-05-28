import { describe, expect, it } from "vitest";
import { err, ok, statusForError } from "@/server/lib/result";

describe("ok", () => {
  it("wraps any value", () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
    expect(ok({ id: "abc" })).toEqual({ ok: true, data: { id: "abc" } });
    expect(ok(null)).toEqual({ ok: true, data: null });
  });
});

describe("err", () => {
  it("wraps code and message", () => {
    expect(err("NOT_FOUND", "missing")).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "missing" },
    });
  });
});

describe("statusForError", () => {
  it("maps known codes to correct HTTP status", () => {
    expect(statusForError("NOT_FOUND")).toBe(404);
    expect(statusForError("FORBIDDEN")).toBe(403);
    expect(statusForError("UNAUTHENTICATED")).toBe(401);
    expect(statusForError("INVALID_CREDENTIALS")).toBe(401);
    expect(statusForError("EMAIL_TAKEN")).toBe(409);
    expect(statusForError("SLUG_CONFLICT")).toBe(409);
    expect(statusForError("VALIDATION")).toBe(400);
  });

  it("defaults to 400 for unknown code", () => {
    expect(statusForError("TOTALLY_UNKNOWN")).toBe(400);
    expect(statusForError("")).toBe(400);
  });
});
