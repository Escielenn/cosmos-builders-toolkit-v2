/**
 * Feature flags.
 *
 * Read from Vite env at build time (VITE_FLAG_* prefix) and expose as a
 * typed object. Flags should be boolean. Add new flags here rather than
 * reading import.meta.env directly in components.
 *
 * Flags default to `false` when the env var is unset or not the literal
 * string "true" — we only turn something on when explicitly asked.
 */

function readFlag(envKey: string): boolean {
  const raw = import.meta.env[envKey];
  return raw === "true" || raw === true;
}

export const FLAGS = {
  /**
   * Phase A1: unified entity model.
   * When true, surfaces that used to read from `world_entries` for
   * entity-like rows read from `entities` instead. When false, legacy
   * behavior is preserved.
   *
   * Turn on only after the `unify_entities` migration has been applied
   * and the downstream read paths have been rewritten to branch on
   * this flag.
   */
  UNIFIED_ENTITIES: readFlag("VITE_FLAG_UNIFIED_ENTITIES"),
} as const;

export type FeatureFlag = keyof typeof FLAGS;

/** Narrow helper for places where you want a plain boolean. */
export function isFlagOn(flag: FeatureFlag): boolean {
  return FLAGS[flag];
}
