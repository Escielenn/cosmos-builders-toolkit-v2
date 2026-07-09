/**
 * STELLARFORGE II — CANONICAL TOKENS, TypeScript mirror (Phase 0 scaffold)
 *
 * For consumers that cannot read CSS custom properties:
 *   - 2D canvas draw loops (ExoSky, Tidelock, Exoforge, Rogue)
 *   - three.js materials (Solaris)
 *   - @react-pdf/renderer print palette derivation (Phase 5)
 *
 * Status: scaffold — nothing imports this yet. Surfaces adopt it
 * during their re-skin phase (plan §3.3). Keep in sync with
 * src/styles/tokens.css by hand until the Phase-1 generator lands
 * (one source generates the other; which direction is a Phase-1
 * implementation detail).
 *
 * SETTLED: legacy cyan retired — it intentionally does not exist
 * here. Simulator accents resolve to the product accent.
 *
 * Rule: THEME colors live here. DATA palettes (star spectral classes,
 * planet albedos, timeline event-category colors) are not theme — they
 * move to src/lib/palettes/* during the relevant surface re-skin.
 */

/** Hex forms — for canvas fillStyle, three.js Color, PDF. */
export const tokens = {
  surface: {
    void: "#0A0E17",
    panel: "#0E1320",
    elevated: "#161C2B",
    /** Simulator canvas — deeper than site void, by design. */
    simCanvas: "#09090B",
    /** Simulator floating panel fill (use with simPanelAlpha). */
    simPanel: "#0F0F10",
  },

  text: {
    /** Tier 1 — titles, result values only. */
    t1: "#FAFAFA",
    /** Tier 2 — body text ceiling. */
    t2: "#C8C8C8",
    /** Tiers 3–5 are alpha-on-white; use rgba() helpers below. */
    t3: "rgba(255, 255, 255, 0.45)",
    t4: "rgba(255, 255, 255, 0.28)",
    t5: "rgba(255, 255, 255, 0.15)",
  },

  accent: {
    /** Solid fills, borders, CTAs. */
    base: "#15C17B",
    /** Glow/shadow/arc ONLY — never a solid fill. */
    glow: "#3DFFCD",
    /** Text on solid accent. */
    onAccent: "#08110C",
  },

  category: {
    stars: "#FFB800",
    worlds: "#4D9FFF",
    life: "#00FF88",
    civ: "#9B5DE5",
    myth: "#5B8DEF",
    integration: "#15C17B",
  },

  status: {
    ok: "#00FF88",
    warn: "#FFB800",
    danger: "#FF3366",
    info: "#4D9FFF",
  },

  /** Simulators resolve to the product accent (cyan retired 2026-06-11). */
  sim: {
    accent: "#15C17B",
    accentGlow: "#3DFFCD",
    panelAlpha: 0.92,
    radius: 8,
  },

  /** The 0.06 / 0.15 / 1.0 glow pattern (+ 0.2 shadow). */
  glowAlpha: {
    tint: 0.06,
    border: 0.15,
    shadow: 0.2,
  },

  motion: {
    instant: 100,
    fast: 150,
    normal: 200,
    smooth: 300,
    dramatic: 500,
  },
} as const;

export type Tokens = typeof tokens;

/** `rgba()` string for a hex token at a given alpha — the common
 *  canvas need (e.g. glow borders at tokens.glowAlpha.border). */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------------
 * Runtime CSS-variable reader — for code that must track the LIVE
 * cascade (e.g. a surface with a Tier-3 override active). Reads
 * computed style once and caches; never call per-frame.
 * ------------------------------------------------------------------ */
const tokenCache = new Map<string, string>();

/** Read a CSS custom property (e.g. "--accent") from :root, cached. */
export function getToken(name: string): string {
  const cached = tokenCache.get(name);
  if (cached !== undefined) return cached;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  tokenCache.set(name, value);
  return value;
}

/** Invalidate the cache (call on theme change, if themes ever vary at runtime). */
export function invalidateTokenCache(): void {
  tokenCache.clear();
}
