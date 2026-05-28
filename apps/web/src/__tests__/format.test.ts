import { describe, expect, it } from "vitest";
import { formatDate, formatNumber } from "@/lib/format";

describe("formatDate", () => {
  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("formats a Date object", () => {
    const d = new Date("2024-06-15T00:00:00Z");
    expect(formatDate(d)).toMatch(/Jun\s+\d+,?\s+2024/);
  });

  it("formats an ISO date string", () => {
    expect(formatDate("2024-01-01T00:00:00Z")).toMatch(/Jan\s+\d+,?\s+2024/);
  });
});

describe("formatNumber", () => {
  it("returns raw string for values under 1000", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with one decimal when < 10k", () => {
    expect(formatNumber(1000)).toBe("1.0k");
    expect(formatNumber(1500)).toBe("1.5k");
    expect(formatNumber(9999)).toBe("10.0k");
  });

  it("formats thousands without decimal when >= 10k", () => {
    expect(formatNumber(10000)).toBe("10k");
    expect(formatNumber(123456)).toBe("123k");
    expect(formatNumber(999999)).toBe("1000k");
  });

  it("formats millions", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(2_500_000)).toBe("2.5M");
  });
});
