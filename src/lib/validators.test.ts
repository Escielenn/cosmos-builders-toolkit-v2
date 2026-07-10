import { describe, it, expect } from "vitest";
import { isValidEmail } from "./validators";

describe("isValidEmail (waitlist + forms)", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("jason@stellarforge.tools")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.domain.co")).toBe(true);
    expect(isValidEmail("  Mixed@Case.COM ")).toBe(true); // trimmed + lowered
  });
  it("rejects malformed addresses", () => {
    for (const bad of ["", "notanemail", "no@domain", "@domain.com", "a@b", "spaces in@x.com", "two@@x.com"]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
  it("rejects null/undefined and over-length", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail("x".repeat(250) + "@y.com")).toBe(false);
  });
});
