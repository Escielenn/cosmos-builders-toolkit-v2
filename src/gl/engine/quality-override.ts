// ---------------------------------------------------------------------------
// The render-quality override (14-RENDER-ENGINE §3).
//
// `decideTier` has accepted an `override` since G1 and nothing ever passed
// one, so the tier was invisible and unchangeable: a reader on a fast machine
// could not ask for less, and a reader who wanted more had no way to say so.
//
// What it CANNOT do is the important part. The two forced cases in tiers.ts —
// reduced motion and a light theme — beat this. A reader who asked for less
// motion does not get bloom back by picking "cinematic" in a menu, and a
// setting that quietly failed to apply would be worse than no setting.
// `decideTier` enforces that; this only supplies the preference.
//
// Persisted, unlike the benchmark. A benchmark verdict outlives the conditions
// that produced it, but a stated preference is meant to.
// ---------------------------------------------------------------------------

import { QUALITY_TIERS, type QualityTier } from "./tiers";

export type QualityOverride = QualityTier | "auto";

const KEY = "sf-render-quality";

let current: QualityOverride | null = null;
const listeners = new Set<(value: QualityOverride) => void>();

function isOverride(value: unknown): value is QualityOverride {
  return (
    value === "auto" || (QUALITY_TIERS as readonly string[]).includes(value as string)
  );
}

/**
 * The stored preference, defaulting to "auto".
 *
 * Storage can throw outright in a private window or with site data blocked, so
 * every read is guarded: a browser that refuses to remember gets "auto", which
 * is the same as never having chosen.
 */
export function readQualityOverride(): QualityOverride {
  if (current !== null) return current;
  try {
    const raw = localStorage.getItem(KEY);
    current = isOverride(raw) ? raw : "auto";
  } catch {
    current = "auto";
  }
  return current;
}

export function setQualityOverride(value: QualityOverride): void {
  if (!isOverride(value)) return;
  current = value;
  try {
    if (value === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    // Not being able to remember it does not stop it applying this session.
  }
  for (const listener of listeners) listener(value);
}

export function onQualityOverrideChange(
  fn: (value: QualityOverride) => void,
): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Test seam. Never called by the app. */
export function resetQualityOverride(): void {
  current = null;
  listeners.clear();
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
