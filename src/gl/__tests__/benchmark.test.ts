// ---------------------------------------------------------------------------
// The frame benchmark (G7).
//
// tiers.ts has been decided-but-unmeasured since G1: every session ran on
// "Not measured yet". These are the rules the measurement has to hold to be
// worth acting on.
// ---------------------------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SAMPLE_FRAMES,
  WARMUP_FRAMES,
  measuredMedianFrameMs,
  onBenchmarkSettled,
  recordFrame,
  resetBenchmark,
} from "@/gl/engine/benchmark";
import { decideTier } from "@/gl/engine/tiers";

const feed = (ms: number, count: number) => {
  for (let i = 0; i < count; i += 1) recordFrame(ms);
};

beforeEach(() => resetBenchmark());

describe("recordFrame", () => {
  it("reports nothing until it has enough samples", () => {
    expect(measuredMedianFrameMs()).toBeNull();
    feed(16, WARMUP_FRAMES + SAMPLE_FRAMES - 1);
    expect(measuredMedianFrameMs()).toBeNull();
  });

  it("settles once the samples are in", () => {
    feed(16, WARMUP_FRAMES + SAMPLE_FRAMES);
    expect(measuredMedianFrameMs()).toBeCloseTo(16, 6);
  });

  it("DISCARDS the warm-up frames — mount cost is not running cost", () => {
    // A scene's first frames are shader compiles. If they counted, every
    // machine would be demoted by the act of opening a scene.
    feed(200, WARMUP_FRAMES);
    feed(10, SAMPLE_FRAMES);
    expect(measuredMedianFrameMs()).toBeCloseTo(10, 6);
  });

  it("ignores a tab switch or a breakpoint rather than demoting for it", () => {
    feed(16, WARMUP_FRAMES);
    // One enormous frame among good ones must not move the verdict.
    recordFrame(4000);
    feed(10, SAMPLE_FRAMES);
    expect(measuredMedianFrameMs()).toBeCloseTo(10, 6);
  });

  it("ignores nonsense deltas", () => {
    feed(16, WARMUP_FRAMES);
    for (const bad of [0, -1, Number.NaN, Infinity]) recordFrame(bad);
    feed(12, SAMPLE_FRAMES);
    expect(measuredMedianFrameMs()).toBeCloseTo(12, 6);
  });

  it("takes the MEDIAN, so a few slow frames do not decide the session", () => {
    feed(16, WARMUP_FRAMES);
    // A third of the frames are terrible; two thirds are fine.
    feed(80, Math.floor(SAMPLE_FRAMES / 3));
    feed(9, SAMPLE_FRAMES);
    const median = measuredMedianFrameMs()!;
    expect(median).toBeLessThan(80);
    expect(median).toBeCloseTo(9, 6);
  });

  it("stops recording once settled — the verdict does not drift mid-session", () => {
    feed(10, WARMUP_FRAMES + SAMPLE_FRAMES);
    const settled = measuredMedianFrameMs();
    feed(200, SAMPLE_FRAMES * 2);
    expect(measuredMedianFrameMs()).toBe(settled);
  });
});

describe("onBenchmarkSettled", () => {
  it("fires once, with the median", () => {
    const seen = vi.fn();
    onBenchmarkSettled(seen);
    feed(14, WARMUP_FRAMES + SAMPLE_FRAMES);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen.mock.calls[0][0]).toBeCloseTo(14, 6);
  });

  it("fires immediately for a late subscriber", () => {
    feed(14, WARMUP_FRAMES + SAMPLE_FRAMES);
    const seen = vi.fn();
    onBenchmarkSettled(seen);
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it("does not fire after unsubscribe", () => {
    const seen = vi.fn();
    onBenchmarkSettled(seen)();
    feed(14, WARMUP_FRAMES + SAMPLE_FRAMES);
    expect(seen).not.toHaveBeenCalled();
  });
});

describe("what the measurement is FOR", () => {
  const base = { prefersReducedMotion: false, isLightScheme: false };

  it("a fast machine earns cinematic, a slow one gets chart", () => {
    feed(8, WARMUP_FRAMES + SAMPLE_FRAMES);
    expect(decideTier({ ...base, medianFrameMs: measuredMedianFrameMs() }).tier).toBe(
      "cinematic",
    );

    resetBenchmark();
    feed(40, WARMUP_FRAMES + SAMPLE_FRAMES);
    expect(decideTier({ ...base, medianFrameMs: measuredMedianFrameMs() }).tier).toBe(
      "chart",
    );
  });

  it("no measurement yet still gives a usable tier, and says so", () => {
    const decision = decideTier({ ...base, medianFrameMs: measuredMedianFrameMs() });
    expect(decision.tier).toBe("standard");
    expect(decision.reason).toMatch(/not measured/i);
  });

  it("cannot buy back motion the reader switched off, however fast the machine", () => {
    feed(4, WARMUP_FRAMES + SAMPLE_FRAMES);
    const decision = decideTier({
      medianFrameMs: measuredMedianFrameMs(),
      prefersReducedMotion: true,
      isLightScheme: false,
      override: "cinematic",
    });
    expect(decision.tier).toBe("chart");
    expect(decision.forced).toBe(true);
  });
});
