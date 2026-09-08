// ---------------------------------------------------------------------------
// useQualityTier — the tier system's missing consumer (14-RENDER-ENGINE §3).
//
// G1 built `decideTier` and every scene since has ignored it: SystemScene,
// GalaxyScene and SkyScene each hardcoded `dpr={[1, 2]}` and took a
// `reducedMotion` prop that callers had to remember to pass. That is the
// declared-but-unwired pattern inside our own engine — the rules existed and
// nothing obeyed them.
//
// This gathers the three inputs `decideTier` asks for and watches all three,
// because every one of them can change while a scene is on screen: the reader
// can switch on reduced motion, switch to a light theme, or move a window to a
// slower display.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  TIER_SETTINGS,
  decideTier,
  resolvePixelRatio,
  type TierDecision,
  type TierSettings,
} from "./tiers";
import { measuredMedianFrameMs, onBenchmarkSettled } from "./benchmark";
import {
  onQualityOverrideChange,
  readQualityOverride,
  type QualityOverride,
} from "./quality-override";

/** The app marks a light base with `light` on the root element (use-theme.ts). */
function readLightScheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("light");
}

export interface QualityTierResult extends TierDecision {
  settings: TierSettings;
  /** `dpr` for a Canvas: [1, ceiling]. */
  dpr: [number, number];
  /**
   * True when the scene must hold still. Reduced motion forces `chart`, so
   * this is the tier speaking rather than a prop a caller might forget.
   */
  still: boolean;
}

/**
 * `override` is normally omitted: the stored preference is read for you, so a
 * scene picks it up without any caller passing it down. Pass one explicitly
 * only to preview a tier the reader has not chosen (the settings control does
 * exactly that).
 */
export function useQualityTier(
  override?: QualityOverride,
): QualityTierResult {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stored, setStored] = useState<QualityOverride>(readQualityOverride);
  const [isLightScheme, setLightScheme] = useState(readLightScheme);
  const [medianFrameMs, setMedianFrameMs] = useState<number | null>(
    measuredMedianFrameMs,
  );

  // The theme class lands on the root element, same as the token variables.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const reread = () => setLightScheme(readLightScheme());
    reread();
    const observer = new MutationObserver(reread);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  // The benchmark settles a second or so into the first scene. Until then
  // decideTier returns `standard` with "Not measured yet", which is the right
  // guess: it is the tier most machines land on.
  useEffect(() => onBenchmarkSettled(setMedianFrameMs), []);

  // Changing the preference must move every scene already on screen, not just
  // the next one to mount.
  useEffect(() => onQualityOverrideChange(setStored), []);

  const decision = decideTier({
    medianFrameMs,
    prefersReducedMotion,
    isLightScheme,
    override: override ?? stored,
  });

  const ceiling = resolvePixelRatio(
    decision.tier,
    typeof window === "undefined" ? 1 : window.devicePixelRatio,
  );

  return {
    ...decision,
    settings: TIER_SETTINGS[decision.tier],
    dpr: [1, ceiling],
    still: decision.tier === "chart",
  };
}
