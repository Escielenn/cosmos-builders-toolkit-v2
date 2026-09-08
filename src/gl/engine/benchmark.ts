// ---------------------------------------------------------------------------
// The frame benchmark (Brief G1 §3 / 14-RENDER-ENGINE §3).
//
// tiers.ts decides a tier from a median frame time, and until now NOTHING
// MEASURED ONE — every session ran on the "Not measured yet" fallback. This is
// the missing half.
//
// It measures from REAL FRAMES rather than a synthetic spinner. A spinner
// benchmarks a spinner; the first scene the writer opens benchmarks the thing
// they are actually about to look at, on the machine they are actually using,
// and costs nothing extra to run.
//
// The first frames after a mount are shader compiles, texture uploads and
// layout — the slowest a scene will ever be, and not what it will feel like.
// Those are discarded. Median, not mean, for the reason tiers.ts already
// gives: one scheduler hiccup must not demote a capable machine for a session.
//
// Session-scoped and deliberately not persisted. A stored verdict outlives
// the conditions that produced it — a laptop on battery, a machine that was
// compiling — and a wrong stored tier is worse than measuring again.
// ---------------------------------------------------------------------------

import { medianFrameTime } from "./tiers";

/** Frames thrown away before sampling starts. Mount cost, not running cost. */
export const WARMUP_FRAMES = 20;
/** Enough to have a stable median without holding the tier open for seconds. */
export const SAMPLE_FRAMES = 60;

let warmupSeen = 0;
let samples: number[] = [];
let settled: number | null = null;
const listeners = new Set<(median: number) => void>();

/**
 * Record one frame's duration. Cheap enough to call every frame, and a no-op
 * once the benchmark has settled.
 */
export function recordFrame(deltaMs: number): void {
  if (settled !== null) return;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
  // A frame longer than a quarter second is a tab switch, a breakpoint or a
  // garbage pause. Including it would demote a machine for something that is
  // not the machine's fault.
  if (deltaMs > 250) return;

  if (warmupSeen < WARMUP_FRAMES) {
    warmupSeen += 1;
    return;
  }

  samples.push(deltaMs);
  if (samples.length >= SAMPLE_FRAMES) {
    settled = medianFrameTime(samples);
    if (settled !== null) {
      for (const listener of listeners) listener(settled);
    }
  }
}

/**
 * How far the measurement has got, 0..1. A Display settings panel needs this
 * to say "measuring" rather than showing a verdict that is about to change.
 */
export function benchmarkProgress(): number {
  if (settled !== null) return 1;
  const seen = warmupSeen + samples.length;
  return Math.min(1, seen / (WARMUP_FRAMES + SAMPLE_FRAMES));
}

/** The measured median, or null while the benchmark is still running. */
export function measuredMedianFrameMs(): number | null {
  return settled;
}

/** Called once when the benchmark settles. Returns an unsubscribe. */
export function onBenchmarkSettled(fn: (median: number) => void): () => void {
  if (settled !== null) {
    fn(settled);
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Test seam. Never called by the app. */
export function resetBenchmark(): void {
  warmupSeen = 0;
  samples = [];
  settled = null;
  listeners.clear();
}
