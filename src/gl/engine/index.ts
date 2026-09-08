// ---------------------------------------------------------------------------
// forge-gl engine core (Block G1). See docs/stellarforge/14-RENDER-ENGINE.md.
//
// Nothing mounts this yet. The scenes that will (System, Galaxy, Sky,
// Encounter, and the Atlas's top level) are G3–G6; materials are G2. An
// engine mounted before it has something canon-bound to draw is exactly the
// tech demo §8 warns against.
// ---------------------------------------------------------------------------

export { DisposalRegistry } from "./disposal";
export type { Disposable, DisposalStats } from "./disposal";

export {
  QUALITY_TIERS,
  TIER_SETTINGS,
  CINEMATIC_MAX_FRAME_MS,
  STANDARD_MAX_FRAME_MS,
  decideTier,
  medianFrameTime,
  resolvePixelRatio,
} from "./tiers";
export type { QualityTier, TierSettings, TierInputs, TierDecision } from "./tiers";

export {
  BOUND_TOKENS,
  domTokenReader,
  parseAmbient,
  parseTokenColour,
  readThemeUniforms,
  srgbToLinear,
} from "./theme-uniforms";
export type { BoundToken, RGB, ThemeUniforms } from "./theme-uniforms";

export {
  CameraRig,
  DEFAULT_FLIGHT_MS,
  easeSfOut,
  isFlightDone,
  lerp,
  lerpVec3,
  poseAt,
} from "./camera-rig";
export type { CameraPose, Flight, Vec3 } from "./camera-rig";

export { createEngine } from "./renderer";
export type { Engine, EngineOptions } from "./renderer";

// The tier system's consumer (G7). `decideTier` existed from G1 and nothing
// called it; these are the pieces that make a measured tier reach a scene.
export {
  recordFrame,
  measuredMedianFrameMs,
  benchmarkProgress,
  onBenchmarkSettled,
  resetBenchmark,
  WARMUP_FRAMES,
  SAMPLE_FRAMES,
} from "./benchmark";
export { useQualityTier } from "./use-quality-tier";
export type { QualityTierResult } from "./use-quality-tier";
export { default as FrameBenchmark } from "./FrameBenchmark";
