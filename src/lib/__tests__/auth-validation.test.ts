import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  passwordSchema,
  redirectFromSearch,
  safeRedirectPath,
} from "../auth-validation";

describe("safeRedirectPath", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(safeRedirectPath("/pricing")).toBe("/pricing");
    expect(safeRedirectPath("/worlds/abc/tools/lexdrift?x=1#top")).toBe("/worlds/abc/tools/lexdrift?x=1#top");
  });

  it("falls back for empty or missing values", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("   ", "/home")).toBe("/home");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example/x")).toBe("/");
    expect(safeRedirectPath("//evil.example/x")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeRedirectPath("pricing")).toBe("/");
  });

  it("rejects backslash and control-character tricks", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/");
    expect(safeRedirectPath("/\\/evil.example")).toBe("/");
    expect(safeRedirectPath("/\tevil")).toBe("/");
    expect(safeRedirectPath("/foo\nbar")).toBe("/");
  });

  it("refuses to bounce back into the auth pages", () => {
    expect(safeRedirectPath("/auth")).toBe("/");
    expect(safeRedirectPath("/auth/reset")).toBe("/");
    expect(safeRedirectPath("/auth?redirect=/auth")).toBe("/");
    expect(safeRedirectPath("/authors")).toBe("/authors");
  });

  it("normalises dot segments without escaping the origin", () => {
    expect(safeRedirectPath("/a/../pricing")).toBe("/pricing");
    expect(safeRedirectPath("/../../etc")).toBe("/etc");
  });
});

describe("redirectFromSearch", () => {
  it("prefers redirect over from, and validates both", () => {
    expect(redirectFromSearch(new URLSearchParams("redirect=/pricing&from=/worlds"))).toBe("/pricing");
    expect(redirectFromSearch(new URLSearchParams("from=/worlds"))).toBe("/worlds");
    expect(redirectFromSearch(new URLSearchParams("redirect=https://evil.example"))).toBe("/");
    expect(redirectFromSearch(new URLSearchParams("tab=login"))).toBe("/");
  });

  it("decodes an encoded path once", () => {
    const qs = `redirect=${encodeURIComponent("/worlds/w1/tools/timeline?x=1")}`;
    expect(redirectFromSearch(new URLSearchParams(qs))).toBe("/worlds/w1/tools/timeline?x=1");
  });
});

describe("passwordSchema", () => {
  it("enforces the sign-up minimum", () => {
    expect(passwordSchema.safeParse("a".repeat(PASSWORD_MIN_LENGTH - 1)).success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(PASSWORD_MIN_LENGTH)).success).toBe(true);
  });
});
