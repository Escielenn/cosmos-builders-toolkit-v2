import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { isTrustedSimMessage, useSimMessages } from "@/hooks/use-sim-messages";

describe("isTrustedSimMessage (X14)", () => {
  const origin = "https://stellarforge.tools";
  const frame = {} as Window;
  it("accepts the expected source from this origin", () => {
    expect(isTrustedSimMessage({ origin, source: frame }, frame, origin)).toBe(true);
  });
  it("rejects another origin, another window, or no expected source", () => {
    expect(isTrustedSimMessage({ origin: "https://evil.example", source: frame }, frame, origin)).toBe(false);
    expect(isTrustedSimMessage({ origin, source: {} as Window }, frame, origin)).toBe(false);
    expect(isTrustedSimMessage({ origin, source: frame }, null, origin)).toBe(false);
  });
});

describe("useSimMessages", () => {
  it("delivers same-window messages for component sims and drops foreign ones", () => {
    const seen: string[] = [];
    renderHook(() => useSimMessages((d) => seen.push(d.type)));
    window.dispatchEvent(new MessageEvent("message", { data: { type: "STELLARFORGE_SAVE" }, origin: window.location.origin, source: window }));
    window.dispatchEvent(new MessageEvent("message", { data: { type: "STELLARFORGE_PUBLISH" }, origin: "https://evil.example", source: window }));
    window.dispatchEvent(new MessageEvent("message", { data: "junk", origin: window.location.origin, source: window }));
    expect(seen).toEqual(["STELLARFORGE_SAVE"]);
  });
});
