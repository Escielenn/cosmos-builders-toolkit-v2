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
