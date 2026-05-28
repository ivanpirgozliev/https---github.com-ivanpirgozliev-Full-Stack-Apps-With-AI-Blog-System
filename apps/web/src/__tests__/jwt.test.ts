import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/server/lib/jwt";

describe("signToken / verifyToken", () => {
  it("round-trips a user payload", async () => {
    const token = await signToken({ sub: "user-123", role: "user" });
    const payload = await verifyToken(token);
    expect(payload).toEqual({ sub: "user-123", role: "user" });
  });

  it("round-trips an admin payload", async () => {
    const token = await signToken({ sub: "admin-456", role: "admin" });
    const payload = await verifyToken(token);
    expect(payload).toEqual({ sub: "admin-456", role: "admin" });
  });
});

describe("verifyToken", () => {
  it("returns null for a random string", async () => {
    expect(await verifyToken("not.a.jwt")).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await verifyToken("")).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    // Manually crafted HS256 JWT with a different secret — signature won't verify.
    const fakeToken =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4IiwicGlsbCI6InVzZXIifQ.invalidsignature";
    expect(await verifyToken(fakeToken)).toBeNull();
  });
});
