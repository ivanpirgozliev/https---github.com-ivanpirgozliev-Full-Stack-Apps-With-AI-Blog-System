import { describe, expect, it } from "vitest";
import { slugify, slugifyWithSuffix } from "@/server/lib/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses consecutive special chars into one hyphen", () => {
    expect(slugify("a  --  b")).toBe("a-b");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello");
    expect(slugify("---hello---")).toBe("hello");
  });

  it("removes non-alphanumeric characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("C++ is great")).toBe("c-is-great");
  });

  it("returns empty string for blank input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("!!!")).toBe("");
  });

  it("truncates to 200 characters", () => {
    const long = "a".repeat(300);
    expect(slugify(long).length).toBe(200);
  });
});

describe("slugifyWithSuffix", () => {
  it("produces a non-empty slug", () => {
    const s = slugifyWithSuffix("My Post Title");
    expect(s.length).toBeGreaterThan(0);
  });

  it("contains the slugified base followed by a suffix", () => {
    const s = slugifyWithSuffix("Hello World");
    expect(s).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it("still returns a suffix when the input is blank", () => {
    const s = slugifyWithSuffix("!!!");
    // base is empty → result is just the random suffix
    expect(s.length).toBeGreaterThan(0);
    expect(s).not.toContain("-");
  });
});
