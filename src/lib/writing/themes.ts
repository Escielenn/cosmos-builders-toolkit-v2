/**
 * Writing surface theme definitions for the RTF editor.
 * Each theme provides colors for background, text, caret, selection, and code blocks.
 */

import { LEGACY_WRITING_THEMES, PAPER_COLOURS } from "@/lib/palettes/writing-papers";

export interface WritingThemeColors {
  background: string;
  text: string;
  caret: string;
  selection: string;
  headingText: string;
  blockquoteBorder: string;
  blockquoteText: string;
  codeBackground: string;
}

export interface WritingTheme {
  id: string;
  name: string;
  description: string;
  colors: WritingThemeColors;
  /** Hex swatch shown in picker: [background, text, accent] */
  swatch: [string, string, string];
}

export const WRITING_THEMES: WritingTheme[] = LEGACY_WRITING_THEMES;

export function getWritingThemeById(id: string): WritingTheme {
  return WRITING_THEMES.find((t) => t.id === id) || WRITING_THEMES[0];
}

// ---------------------------------------------------------------------------
// PAPERS (1.7): the Manuscript's page, per device.
//
// A paper is the sheet the prose sits on inside the instrument chrome. "Void"
// follows the active instrument theme (its colours are tokens, solved by the
// generator). Every other paper is a fixed sheet with its own ink, stored
// here as hex the way WRITING_THEMES above stores its colours, and applied
// as `--room-*` custom properties on the Manuscript root (never as `--sf-*`
// or `--t*`: those names belong to tokens.css).
//
// The world's marks in the prose (links, cited facts, mentions, comments,
// contradiction marks) take the theme's own hues. The instrument has 60
// themes, bright hues on the dark ones and deep hues on the light ones, and
// a fixed sheet has to carry either: a bright hue vanishes on parchment, a
// deep one on black. So each paper says how much of its strongest ink to
// fold into a hue: `graphicMix` for lines and dots (3:1), `textMix` for
// coloured words (4.5:1). themes.test.ts measures every paper against
// every theme.
// ---------------------------------------------------------------------------

export type PaperId = "void" | "charcoal" | "black" | "parchment" | "cream" | "grey" | "terminal" | "signal";

export interface PaperColors {
  /** The sheet. */
  paper: string;
  /** Running prose. */
  ink: string;
  /** Title, headings, the selected text. */
  inkStrong: string;
  /** Eyebrow, quotes, captions. Still text: 4.5:1. */
  inkSoft: string;
  /** Placeholder and the quietest labels. Still text: 4.5:1. */
  inkFaint: string;
  /** Hairlines on the sheet. Decoration. */
  rule: string;
  /** Selection fill (solid). inkStrong sits on it. */
  selection: string;
  /** Comment wash (solid). ink sits on it. */
  wash: string;
}

export interface Paper {
  id: PaperId;
  name: string;
  description: string;
  tone: "dark" | "light";
  group: "paper" | "signal";
  /** null: follows the instrument theme (tokens). */
  colors: PaperColors | null;
  /** Share of ink folded into theme hues used as lines and dots (0..1). */
  graphicMix: number;
  /** Share of ink folded into theme hues used as text (0..1). */
  textMix: number;
}

export const PAPERS: Paper[] = [
  {
    id: "void",
    name: "Void",
    description: "The instrument's own dark. Follows the theme.",
    tone: "dark",
    group: "paper",
    colors: null,
    graphicMix: 0,
    textMix: 0,
  },
  {
    id: "charcoal",
    name: "Charcoal",
    description: "Soft neutral dark with warm ink.",
    tone: "dark",
    group: "paper",
    colors: PAPER_COLOURS.charcoal,
    graphicMix: 0.2,
    textMix: 0.5,
  },
  {
    id: "black",
    name: "Black",
    description: "True black for OLED and late nights.",
    tone: "dark",
    group: "paper",
    colors: PAPER_COLOURS.black,
    graphicMix: 0.15,
    textMix: 0.45,
  },
  {
    id: "parchment",
    name: "Parchment",
    description: "Warm paper, dark ink, inside the dark instrument.",
    tone: "light",
    group: "paper",
    colors: PAPER_COLOURS.parchment,
    graphicMix: 0.5,
    textMix: 0.68,
  },
  {
    id: "cream",
    name: "Cream",
    description: "A lighter, cooler sheet than parchment.",
    tone: "light",
    group: "paper",
    colors: PAPER_COLOURS.cream,
    graphicMix: 0.5,
    textMix: 0.62,
  },
  {
    id: "grey",
    name: "Soft grey",
    description: "Low-glare neutral paper.",
    tone: "light",
    group: "paper",
    colors: PAPER_COLOURS.grey,
    graphicMix: 0.55,
    textMix: 0.68,
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Green phosphor on dark.",
    tone: "dark",
    group: "signal",
    colors: PAPER_COLOURS.terminal,
    graphicMix: 0.2,
    textMix: 0.6,
  },
  {
    id: "signal",
    name: "Signal",
    description: "Deep blue with azure text.",
    tone: "dark",
    group: "signal",
    colors: PAPER_COLOURS.signal,
    graphicMix: 0.2,
    textMix: 0.6,
  },
];

export const DEFAULT_PAPER: PaperId = "void";

export function isPaperId(v: unknown): v is PaperId {
  return typeof v === "string" && PAPERS.some((p) => p.id === v);
}

export function getPaper(id: unknown): Paper {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0];
}

/** The paper a pre-1.7 page theme maps to, so nobody's page changes colour. */
export function paperForLegacyTheme(themeId: string | undefined): PaperId {
  switch (themeId) {
    case "captains-log":
      return "parchment";
    case "crt-terminal":
      return "terminal";
    case "comm-channel":
      return "signal";
    default:
      return "void";
  }
}

// ---- measurement -----------------------------------------------------------

export type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n) || full.length < 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `rgb(1 2 3)`, `rgb(1, 2, 3)`, `1 2 3` or hex, as browsers report tokens. */
export function parseColor(value: string): Rgb | null {
  const v = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return parseHex(v);
  const m = /(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function toHex([r, g, b]: Rgb): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** WCAG 2.x relative luminance. */
export function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio, 1..21. */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `color-mix(in srgb, a, b t)`: t of b folded into a. Also alpha compositing. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** A theme hue as drawn on this paper (line or dot). */
export function graphicOnPaper(hue: Rgb, paper: Paper, ink: Rgb): Rgb {
  return mix(hue, ink, paper.graphicMix);
}

/** A theme hue as written on this paper (coloured words). */
export function textOnPaper(hue: Rgb, paper: Paper, ink: Rgb): Rgb {
  return mix(hue, ink, paper.textMix);
}

// ---- atmosphere: how thin the sheet may get --------------------------------

/** The sheet is never thinner than this, whatever is stored. */
export const PAPER_OPACITY_MIN = 60;
export const AA_TEXT = 4.5;

/**
 * The lowest sheet opacity (percent) at which every text colour on the page
 * still clears AA over the worst backdrop a photograph could put behind it.
 *
 * Behind the sheet is the stage (the same paper colour) with a photograph
 * faded over it at `visibility` percent. The worst photograph pixel is pure
 * white under a dark sheet and pure black under a light one, so the backdrop
 * the text can meet is paper mixed with that pixel by visibility × (1 −
 * opacity). Pure and monotonic, so a binary search is exact enough.
 */
export function paperOpacityFloor(colors: PaperColors, tone: Paper["tone"], visibility: number): number {
  const v = Math.max(0, Math.min(100, visibility)) / 100;
  if (v === 0) return PAPER_OPACITY_MIN;
  const paper = parseHex(colors.paper);
  const worst: Rgb = tone === "dark" ? [255, 255, 255] : [0, 0, 0];
  const texts = [colors.ink, colors.inkStrong, colors.inkSoft, colors.inkFaint].map(parseHex);
  const ok = (opacity: number): boolean => {
    const backdrop = mix(paper, worst, v * (1 - opacity / 100));
    return texts.every((t) => contrast(t, backdrop) >= AA_TEXT);
  };
  if (ok(PAPER_OPACITY_MIN)) return PAPER_OPACITY_MIN;
  let lo = PAPER_OPACITY_MIN;
  let hi = 100;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid;
  }
  return Math.min(100, Math.ceil(hi));
}
