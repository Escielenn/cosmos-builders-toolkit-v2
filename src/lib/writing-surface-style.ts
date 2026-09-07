// ---------------------------------------------------------------------------
// The writer's surface preferences → CSS.
//
// Kept pure and separate from Write.tsx so the mapping is testable. The
// cascade half of this lives in `.sf-writing-serif .ProseMirror`
// (src/index.css): that rule reads these custom properties rather than
// hardcoding values, because a declaration on .ProseMirror always beats a
// value inherited from an ancestor. Setting `style={{ lineHeight }}` on a
// wrapper — which is what Write.tsx did until 2026-09-07 — could never win.
// ---------------------------------------------------------------------------

import type {
  LineSpacing,
  WritingFont,
  WritingMeasure,
} from "@/hooks/use-writing-preferences";

/** Leading per setting. 1.78 is the previous hardcoded value; it stays the 1.5 case. */
const LEADING: Record<LineSpacing, string> = {
  "1": "1.35",
  "1.5": "1.78",
  "2": "2.2",
};

/**
 * Font stacks. Every stack ends in a family the browser certainly has, so a
 * writer never loses their text to a missing webfont.
 */
const FONT_STACK: Record<WritingFont, string> = {
  "DM Sans": "'DM Sans', system-ui, sans-serif",
  Lora: "'Lora', Georgia, serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  Merriweather: "'Merriweather', Georgia, serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
};

/**
 * Column width. The default is the measure the design system prescribes
 * (`.sf-measure`, 68ch) — long lines genuinely hurt reading, and that rule is
 * not up for negotiation as a *default*. But a writer who wants a wider
 * column on a wide display should be able to have one, the way every serious
 * writing app allows: Law III, a shown property is a changeable one.
 */
const MEASURE: Record<WritingMeasure, string> = {
  narrow: "58ch",
  default: "68ch",
  wide: "84ch",
  full: "100%",
};

export interface WritingSurfaceStyle extends Record<string, string> {
  "--sf-writing-leading": string;
  "--sf-writing-font": string;
  "--sf-writing-measure": string;
}

export function writingSurfaceStyle(prefs: {
  lineSpacing: LineSpacing;
  writingFont: WritingFont;
  writingMeasure: WritingMeasure;
}): WritingSurfaceStyle {
  return {
    "--sf-writing-leading": LEADING[prefs.lineSpacing] ?? LEADING["1.5"],
    "--sf-writing-font": FONT_STACK[prefs.writingFont] ?? FONT_STACK.Lora,
    "--sf-writing-measure": MEASURE[prefs.writingMeasure] ?? MEASURE.default,
  };
}

export const MEASURE_LABELS: Record<WritingMeasure, string> = {
  narrow: "Narrow",
  default: "Default",
  wide: "Wide",
  full: "Full",
};

export const WRITING_FONTS = Object.keys(FONT_STACK) as WritingFont[];
export const WRITING_MEASURES = Object.keys(MEASURE) as WritingMeasure[];
