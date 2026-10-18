import { describe, expect, it } from "vitest";
import {
  dismissWelcome,
  isWelcomeDismissed,
  shouldShowWelcome,
  welcomeDismissKey,
} from "@/lib/onboarding/welcome-gate";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

const throwing = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
} as unknown as Storage;

describe("shouldShowWelcome", () => {
  const base = { userId: "u1", worldsLoaded: true, worldCount: 0, dismissed: false };

  it("shows for a signed-in writer with zero worlds who has not dismissed it", () => {
    expect(shouldShowWelcome(base)).toBe(true);
  });

  it("does not depend on account age", () => {
    // No created_at input exists any more; a week-old account still qualifies.
    expect(shouldShowWelcome({ ...base })).toBe(true);
  });

  it("hides when signed out, still loading, with any world, or dismissed", () => {
    expect(shouldShowWelcome({ ...base, userId: null })).toBe(false);
    expect(shouldShowWelcome({ ...base, worldsLoaded: false })).toBe(false);
    expect(shouldShowWelcome({ ...base, worldCount: 1 })).toBe(false);
    expect(shouldShowWelcome({ ...base, dismissed: true })).toBe(false);
  });
});

describe("dismissal storage", () => {
  it("persists per user", () => {
    const s = memoryStorage();
    expect(isWelcomeDismissed("u1", s)).toBe(false);
    dismissWelcome("u1", s);
    expect(isWelcomeDismissed("u1", s)).toBe(true);
    expect(isWelcomeDismissed("u2", s)).toBe(false);
    expect(s.getItem(welcomeDismissKey("u1"))).toBeTruthy();
  });

  it("never throws when storage is blocked or absent", () => {
    expect(() => dismissWelcome("u1", throwing)).not.toThrow();
    expect(isWelcomeDismissed("u1", throwing)).toBe(false);
    expect(isWelcomeDismissed("u1", null)).toBe(false);
    expect(isWelcomeDismissed(null, memoryStorage())).toBe(false);
  });
});
