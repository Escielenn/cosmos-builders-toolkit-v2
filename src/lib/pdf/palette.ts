/**
 * STELLARFORGE II — GENERATED PRINT PALETTE (plan §3.5)
 *
 * PDFs cannot read CSS custom properties, so the print palette is
 * DERIVED from the canonical Tier-1 primitives in src/styles/tokens.ts
 * at module load — never hand-copied. The old cyan-era values
 * (#007a7a primary / #00E5E5 accent) predated the teal brand and are
 * replaced by these derivations.
 *
 * Print-legibility transforms:
 *   primary      — accent darkened for white paper (AA ≥ 4.5:1 as text)
 *   primaryLight — near-white accent tint for fills behind dark text
 *   accent       — the product accent verbatim (highlights, rules)
 *
 * This module is an ALLOWED hex home for the CI hex ratchet
 * (.github/workflows/sf2-guardrails.yml) — but only derivation math
 * and neutral print grays live here; brand hues come from tokens.ts.
 */

import { tokens } from "@/styles/tokens";

// ── tiny color math (hex ↔ HSL) ─────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Darken an accent for text/rules on white paper (clamps lightness). */
function darkenForPrint(hex: string, targetL = 0.27): string {
  const { h, s } = hexToHsl(hex);
  return hslToHex(h, Math.min(s, 0.85), targetL);
}

/** Near-white tint of an accent, for fills behind dark print text. */
function tintForPaper(hex: string, targetL = 0.96): string {
  const { h } = hexToHsl(hex);
  return hslToHex(h, 0.35, targetL);
}

// ── the palette ─────────────────────────────────────────────────────

export const printPalette = {
  /** Teal darkened for white paper (headings, section titles, rules). */
  primary: darkenForPrint(tokens.accent.base),
  /** Very light teal tint (result boxes, table headers). */
  primaryLight: tintForPaper(tokens.accent.base),
  /** Product accent verbatim — small highlights only. */
  accent: tokens.accent.base,
  /** Neutral print grays (paper-legible; not brand hues). */
  text: {
    primary: "#1a1a1a",
    secondary: "#4a4a4a",
    muted: "#6a6a6a",
  },
  border: "#cccccc",
  borderLight: "#e5e5e5",
  background: "#ffffff",
} as const;

export type PrintPalette = typeof printPalette;

// ── fixed print inks (not derived, not theme) ───────────────────────

/**
 * Inks and fills the report templates use on top of the palette above:
 * shaded boxes, pass / caution / fail marks, and the wordmark cube. They are
 * print colours chosen for paper and do not follow the on-screen theme.
 */
export const printInk = {
  /** Shaded box behind a block of body text. */
  panel: "#f5f5f5",
  /** Lighter shaded box (notes, nested blocks). */
  panelSoft: "#fafafa",
  /** Alternating table row. */
  zebra: "#f9f9f9",
  /** Text on a filled dark or accent block. */
  onFill: "#ffffff",
  /** Pass / consistent. */
  ok: "#22c55e",
  /** Gas retained (atmosphere tables). */
  retained: "#2ECC71",
  /** Marginal, over a warning threshold. */
  warn: "#FFA500",
  /** Soft caution note. */
  caution: "#F59E0B",
  /** Fail, over budget, gas escapes. */
  danger: "#E74C3C",
  /** The three visible faces of the header cube mark. */
  cube: { top: "#1a1a1a", left: "#0d0d0d", right: "#141414" },
} as const;

/** Colour sets for the non-default export themes (see src/lib/export/themes.ts). */
export const exportThemeInks = {
  darkNebula: {
    primary: "#2dd4bf",
    primaryLight: "#1e293b",
    text: { primary: "#f1f5f9", secondary: "#94a3b8", muted: "#64748b" },
    border: "#334155",
    borderLight: "#1e293b",
    background: "#0f172a",
    accent: "#5eead4",
  },
  solarFlare: {
    primary: "#b45309",
    primaryLight: "#fffbeb",
    text: { primary: "#1c1917", secondary: "#44403c", muted: "#78716c" },
    border: "#d6d3d1",
    borderLight: "#e7e5e4",
    background: "#ffffff",
    accent: "#f59e0b",
  },
  cosmicViolet: {
    primary: "#7c3aed",
    primaryLight: "#f5f3ff",
    text: { primary: "#1e1b4b", secondary: "#4c1d95", muted: "#6d28d9" },
    border: "#c4b5fd",
    borderLight: "#ede9fe",
    background: "#ffffff",
    accent: "#a78bfa",
  },
} as const;
