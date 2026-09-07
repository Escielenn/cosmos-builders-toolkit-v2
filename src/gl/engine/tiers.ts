// ---------------------------------------------------------------------------
// Quality tiers (Brief G1 §3, 14-RENDER-ENGINE §3).
//
//   cinematic  bloom, grain, full pixel ratio — a discrete GPU
//   standard   bloom at half res, capped pixel ratio — the common case
//   chart      no post at all, flat materials — an integrated GPU, a light
//              theme, or a reader who asked for reduced motion
//
// `chart` is not a punishment tier. §8: "Every scene has a Chart-tier fallback
// that is *good*, not apologetic." It is also the FORCED tier in two cases
// that have nothing to do with the GPU:
//
//   prefers-reduced-motion  — a moving starfield is exactly what that setting
//                             is asking us not to do.
//   a light colour scheme   — bloom over a paper background is a grey smear;
//                             the design system's light bases are solved for
//                             contrast, and blooming them destroys it.
//
// Pure and side-effect free so it is testable without a GPU.
// ---------------------------------------------------------------------------

export const QUALITY_TIERS = ["cinematic", "standard", "chart"] as const;
export type QualityTier = (typeof QUALITY_TIERS)[number];

export interface TierSettings {
  /** Device pixel ratio ceiling. Above ~2 the cost is real and the gain is not. */
  maxPixelRatio: number;
  bloom: boolean;
  /** Bloom render target scale. Half res is the §3 budget. */
  bloomResolutionScale: number;
  grain: boolean;
  /** Shadow maps are off everywhere until a scene proves it needs them. */
  shadows: boolean;
  /** Points in the ambient star field. */
  starCount: number;
}

export const TIER_SETTINGS: Record<QualityTier, TierSettings> = {
  cinematic: {
    maxPixelRatio: 2,
    bloom: true,
    bloomResolutionScale: 0.5,
    grain: true,
    shadows: false,
    starCount: 6000,
  },
  standard: {
    maxPixelRatio: 1.5,
    bloom: true,
    bloomResolutionScale: 0.5,
    grain: true,
    shadows: false,
    starCount: 2500,
  },
  chart: {
    maxPixelRatio: 1,
    bloom: false,
    bloomResolutionScale: 0,
    grain: false,
    shadows: false,
    starCount: 800,
  },
};

export interface TierInputs {
  /** Median frame time in ms from the startup benchmark, or null if not run. */
  medianFrameMs: number | null;
  prefersReducedMotion: boolean;
  /** True when the active theme is a light base. */
  isLightScheme: boolean;
  /** An explicit choice from Display settings. Beats the benchmark, not the overrides. */
  override?: QualityTier | "auto";
}

export interface TierDecision {
  tier: QualityTier;
  /** Why, in one clause — shown in Display settings so the choice is legible. */
  reason: string;
  /** True when an accessibility or legibility rule forced it. */
  forced: boolean;
}

/** 60fps is 16.7ms. These are the two thresholds §3 budgets against. */
export const CINEMATIC_MAX_FRAME_MS = 12;
export const STANDARD_MAX_FRAME_MS = 26;

export function decideTier(inputs: TierInputs): TierDecision {
  // Forced cases first. Neither is overridable — a reader who asked for less
  // motion does not get bloom back by picking "cinematic" in a menu.
  if (inputs.prefersReducedMotion) {
    return {
      tier: "chart",
      reason: "Reduced motion is on.",
      forced: true,
    };
  }
  if (inputs.isLightScheme) {
    return {
      tier: "chart",
      reason: "Light themes render flat — bloom over a light base destroys contrast.",
      forced: true,
    };
  }

  if (inputs.override && inputs.override !== "auto") {
    return {
      tier: inputs.override,
      reason: "Set in Display settings.",
      forced: false,
    };
  }

  if (inputs.medianFrameMs === null) {
    return {
      tier: "standard",
      reason: "Not measured yet.",
      forced: false,
    };
  }
  if (inputs.medianFrameMs <= CINEMATIC_MAX_FRAME_MS) {
    return {
      tier: "cinematic",
      reason: `Measured ${inputs.medianFrameMs.toFixed(1)}ms a frame.`,
      forced: false,
    };
  }
  if (inputs.medianFrameMs <= STANDARD_MAX_FRAME_MS) {
    return {
      tier: "standard",
      reason: `Measured ${inputs.medianFrameMs.toFixed(1)}ms a frame.`,
      forced: false,
    };
  }
  return {
    tier: "chart",
    reason: `Measured ${inputs.medianFrameMs.toFixed(1)}ms a frame.`,
    forced: false,
  };
}

/**
 * Median, not mean: one scheduler hiccup during a 1s benchmark should not
 * demote a capable machine for the rest of the session.
 */
export function medianFrameTime(samples: number[]): number | null {
  const usable = samples.filter((n) => Number.isFinite(n) && n > 0);
  if (usable.length === 0) return null;
  const sorted = [...usable].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The pixel ratio to hand the renderer. */
export function resolvePixelRatio(tier: QualityTier, devicePixelRatio: number): number {
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
  return Math.min(ratio, TIER_SETTINGS[tier].maxPixelRatio);
}
