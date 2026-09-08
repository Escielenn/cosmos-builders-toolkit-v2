// ---------------------------------------------------------------------------
// The render-quality override (G7).
//
// The rule that matters is what the setting CANNOT do. `decideTier` has always
// put reduced motion and light themes above any choice; these tests hold that
// line now that a choice actually exists to test it against.
// ---------------------------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  onQualityOverrideChange,
  readQualityOverride,
  resetQualityOverride,
  setQualityOverride,
} from "@/gl/engine/quality-override";
import { decideTier } from "@/gl/engine/tiers";

beforeEach(() => {
  resetQualityOverride();
  localStorage.clear();
});

describe("the stored preference", () => {
  it("is auto until something is chosen", () => {
    expect(readQualityOverride()).toBe("auto");
  });

  it("remembers a choice", () => {
    setQualityOverride("chart");
    expect(readQualityOverride()).toBe("chart");
    resetQualityOverride();
    localStorage.setItem("sf-render-quality", "chart");
    expect(readQualityOverride()).toBe("chart");
  });

  it("clears the stored value when set back to auto", () => {
    setQualityOverride("cinematic");
    setQualityOverride("auto");
    expect(localStorage.getItem("sf-render-quality")).toBeNull();
    expect(readQualityOverride()).toBe("auto");
  });

  it("ignores a stored value that is not a tier", () => {
    localStorage.setItem("sf-render-quality", "ultra");
    expect(readQualityOverride()).toBe("auto");
  });

  it("refuses to store a value that is not a tier", () => {
    setQualityOverride("nonsense" as never);
    expect(readQualityOverride()).toBe("auto");
  });

  it("survives storage that throws, which a private window does", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readQualityOverride()).toBe("auto");
    spy.mockRestore();
  });

  it("still applies this session when storage refuses to remember", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setQualityOverride("chart");
    expect(readQualityOverride()).toBe("chart");
    spy.mockRestore();
  });
});

describe("subscribers", () => {
  it("hear a change, so scenes already on screen move too", () => {
    const seen = vi.fn();
    onQualityOverrideChange(seen);
    setQualityOverride("standard");
    expect(seen).toHaveBeenCalledWith("standard");
  });

  it("stop hearing after unsubscribe", () => {
    const seen = vi.fn();
    onQualityOverrideChange(seen)();
    setQualityOverride("standard");
    expect(seen).not.toHaveBeenCalled();
  });
});

describe("what the setting cannot do", () => {
  const fast = { medianFrameMs: 6 };

  it("cannot buy back motion the reader switched off", () => {
    const d = decideTier({
      ...fast,
      prefersReducedMotion: true,
      isLightScheme: false,
      override: "cinematic",
    });
    expect(d.tier).toBe("chart");
    expect(d.forced).toBe(true);
  });

  it("cannot bloom a light theme", () => {
    const d = decideTier({
      ...fast,
      prefersReducedMotion: false,
      isLightScheme: true,
      override: "cinematic",
    });
    expect(d.tier).toBe("chart");
    expect(d.forced).toBe(true);
  });

  it("CAN ask a fast machine for less", () => {
    const d = decideTier({
      ...fast,
      prefersReducedMotion: false,
      isLightScheme: false,
      override: "chart",
    });
    expect(d.tier).toBe("chart");
    expect(d.forced).toBe(false);
    expect(d.reason).toMatch(/display settings/i);
  });

  it("CAN ask a machine that measured slow for more", () => {
    const d = decideTier({
      medianFrameMs: 40,
      prefersReducedMotion: false,
      isLightScheme: false,
      override: "cinematic",
    });
    expect(d.tier).toBe("cinematic");
  });

  it("auto defers to the measurement", () => {
    const d = decideTier({
      ...fast,
      prefersReducedMotion: false,
      isLightScheme: false,
      override: "auto",
    });
    expect(d.tier).toBe("cinematic");
    expect(d.reason).toMatch(/measured/i);
  });
});
