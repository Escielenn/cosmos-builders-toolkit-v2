import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml (stored-XSS defense)", () => {
  it("strips script tags and event handlers", () => {
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).not.toContain("onerror");
    expect(sanitizeHtml('<script>alert(1)</script>hi')).not.toContain("<script");
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });
  it("keeps safe rich-text markup", () => {
    const out = sanitizeHtml("<p>Hello <strong>world</strong> <em>italic</em></p>");
    expect(out).toContain("<strong>");
    expect(out).toContain("<em>");
    expect(out).toContain("Hello");
  });
  it("handles empty/null input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
  });
});
