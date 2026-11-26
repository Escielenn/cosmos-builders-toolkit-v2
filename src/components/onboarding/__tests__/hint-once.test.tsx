import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHintDismissed } from "@/hooks/use-hint-dismissed";
import { HINT_PREFIX, HINTS } from "@/lib/onboarding/hints";

describe("once hints (1.6 finding 11)", () => {
  beforeEach(() => localStorage.clear());

  it("the world index explainer shows on the first surface only", () => {
    expect(HINTS.codex.once).toBe(true);
    const first = renderHook(() => useHintDismissed("codex"));
    expect(first.result.current[0]).toBe(false);
    expect(localStorage.getItem(HINT_PREFIX + "codex")).toBe("true");
    first.unmount();
    const second = renderHook(() => useHintDismissed("codex"));
    expect(second.result.current[0]).toBe(true);
  });

  it("ordinary hints still wait for a dismiss", () => {
    const a = renderHook(() => useHintDismissed("tags"));
    expect(a.result.current[0]).toBe(false);
    a.unmount();
    const b = renderHook(() => useHintDismissed("tags"));
    expect(b.result.current[0]).toBe(false);
    act(() => b.result.current[1]());
    expect(b.result.current[0]).toBe(true);
  });

  it("the Chronicle duplicate is retired", () => {
    expect(HINTS.chronicle).toBeUndefined();
  });
});
