// Every paper, measured. A paper only ships if its prose, its quiet labels,
// its selection, its caret and every mark the world leaves in the prose
// clear WCAG AA on it, under every one of the instrument's themes.
import { describe, expect, it } from "vitest";
import themesJson from "@/styles/themes.json";
import { ENTITY_TYPE_COLORS } from "@/services/entity-graph-types";
import {
  AA_TEXT,
  PAPERS,
  PAPER_OPACITY_MIN,
  contrast,
  getPaper,
  graphicOnPaper,
  isPaperId,
  luminance,
  mix,
  paperForLegacyTheme,
  paperOpacityFloor,
  parseColor,
  parseHex,
  textOnPaper,
  toHex,
  type Paper,
  type PaperColors,
} from "@/lib/writing/themes";

const AA_GRAPHIC = 3;

interface ThemeRow {
  id: string;
  mode: "dark" | "light";
  primary: { base: string; text: string };
  planes: { void: string; surface: string; elevated: string };
  text: { t1: string; t2: string; t3: string; t4: string };
  accent: Record<string, string>;
  accent_text: Record<string, string>;
}
const THEMES = Object.values((themesJson as unknown as { themes: Record<string, ThemeRow> }).themes);

/** The hues the page draws: the cascade colours and the role colour. */
const HUES = ["amber", "azure", "emerald", "violet", "stellar", "magenta", "crimson", "teal"] as const;

const fixed = PAPERS.filter((p): p is Paper & { colors: PaperColors } => p.colors !== null);
const ratio = (fg: string, bg: string) => contrast(parseHex(fg), parseHex(bg));

describe("the paper table", () => {
  it("offers Void (default), Charcoal, Black and Parchment, plus tones", () => {
    const ids = PAPERS.map((p) => p.id);
    expect(ids.slice(0, 4)).toEqual(["void", "charcoal", "black", "parchment"]);
    expect(ids).toContain("cream");
    expect(ids).toContain("grey");
    expect(new Set(ids).size).toBe(ids.length);
    expect(getPaper("nope").id).toBe("void");
    expect(isPaperId("parchment")).toBe(true);
    expect(isPaperId("sepia")).toBe(false);
  });

  it("maps every pre-1.7 page theme to a paper, so nobody's page changes", () => {
    expect(paperForLegacyTheme("deep-space")).toBe("void");
    expect(paperForLegacyTheme("captains-log")).toBe("parchment");
    expect(paperForLegacyTheme("crt-terminal")).toBe("terminal");
    expect(paperForLegacyTheme("comm-channel")).toBe("signal");
    expect(paperForLegacyTheme(undefined)).toBe("void");
  });

  it("declares each fixed paper's tone truthfully", () => {
    for (const p of fixed) {
      const light = luminance(parseHex(p.colors.paper)) > 0.18;
      expect(`${p.id}:${light ? "light" : "dark"}`).toBe(`${p.id}:${p.tone}`);
    }
  });
});

describe.each(fixed.map((p) => [p.id, p] as const))("paper %s", (_id, paper) => {
  const c = paper.colors;

  it("prose, title, eyebrow and placeholder clear AA on the sheet", () => {
    expect(ratio(c.ink, c.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(c.inkStrong, c.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(c.inkSoft, c.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(c.inkFaint, c.paper)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("selected text and commented text stay AA on their fills", () => {
    expect(ratio(c.inkStrong, c.selection)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(c.ink, c.wash)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(c.inkStrong, c.wash)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("the selection is visibly not the sheet", () => {
    expect(ratio(c.selection, c.paper)).toBeGreaterThan(1.15);
  });

  it("the caret, the title rule and every cascade line clear 3:1 under all 60 themes", () => {
    const strong = parseHex(c.inkStrong);
    const sheet = parseHex(c.paper);
    for (const t of THEMES) {
      const hues = [t.primary.base, ...HUES.map((h) => t.accent[h])];
      for (const hue of hues) {
        const drawn = graphicOnPaper(parseHex(hue), paper, strong);
        expect(contrast(drawn, sheet), `${t.id} ${hue} as a line on ${paper.id}`).toBeGreaterThanOrEqual(AA_GRAPHIC);
      }
    }
  });

  it("links, warnings and coloured words clear AA on the sheet and on a comment wash, under all 60 themes", () => {
    const strong = parseHex(c.inkStrong);
    const sheet = parseHex(c.paper);
    const wash = parseHex(c.wash);
    for (const t of THEMES) {
      // --room-link (stellar), --room-warn-text (amber), --room-stop-text
      // (crimson), --room-accent-text (the role colour).
      for (const hue of [t.accent.stellar, t.accent.amber, t.accent.crimson, t.primary.base]) {
        const written = textOnPaper(parseHex(hue), paper, strong);
        expect(contrast(written, sheet), `${t.id} ${hue} as text on ${paper.id}`).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(written, wash), `${t.id} ${hue} as text on ${paper.id} wash`).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  it("an entity's own colour reads as a dot and an underline (3:1)", () => {
    const strong = parseHex(c.inkStrong);
    const sheet = parseHex(c.paper);
    for (const hue of new Set(Object.values(ENTITY_TYPE_COLORS))) {
      const drawn = graphicOnPaper(parseHex(hue), paper, strong);
      expect(contrast(drawn, sheet), `entity ${hue} on ${paper.id}`).toBeGreaterThanOrEqual(AA_GRAPHIC);
    }
  });
});

describe("Void follows the instrument theme", () => {
  it("is solved by the theme itself: tiers and text stops clear AA on its void plane", () => {
    for (const t of THEMES) {
      const sheet = parseHex(t.planes.void);
      for (const tier of [t.text.t1, t.text.t2, t.text.t3, t.text.t4]) {
        expect(contrast(parseHex(tier), sheet), `${t.id} tier ${tier}`).toBeGreaterThanOrEqual(AA_TEXT);
      }
      for (const stop of [t.accent_text.stellar, t.accent_text.amber, t.accent_text.crimson, t.primary.text]) {
        expect(contrast(parseHex(stop), sheet), `${t.id} text stop ${stop}`).toBeGreaterThanOrEqual(AA_TEXT);
      }
      for (const hue of [t.primary.base, ...HUES.map((h) => t.accent[h])]) {
        expect(contrast(parseHex(hue), sheet), `${t.id} hue ${hue}`).toBeGreaterThanOrEqual(AA_GRAPHIC);
      }
    }
  });
});

describe("atmosphere: the sheet's opacity floor", () => {
  const worstBackdrop = (c: PaperColors, tone: Paper["tone"], visibility: number, opacity: number) =>
    mix(parseHex(c.paper), tone === "dark" ? [255, 255, 255] : [0, 0, 0], (visibility / 100) * (1 - opacity / 100));

  it("keeps every ink AA over the worst photograph, at every visibility", () => {
    for (const p of fixed) {
      for (const visibility of [0, 10, 20, 35, 50, 60]) {
        const floor = paperOpacityFloor(p.colors, p.tone, visibility);
        expect(floor).toBeGreaterThanOrEqual(PAPER_OPACITY_MIN);
        expect(floor).toBeLessThanOrEqual(100);
        const backdrop = worstBackdrop(p.colors, p.tone, visibility, floor);
        for (const ink of [p.colors.ink, p.colors.inkStrong, p.colors.inkSoft, p.colors.inkFaint]) {
          expect(contrast(parseHex(ink), backdrop), `${p.id} ${ink} at ${visibility}% / ${floor}%`).toBeGreaterThanOrEqual(AA_TEXT);
        }
      }
    }
  });

  it("holds for Void under every theme, light or dark", () => {
    for (const t of THEMES) {
      const c: PaperColors = {
        paper: t.planes.void,
        ink: t.text.t2,
        inkStrong: t.text.t1,
        inkSoft: t.text.t3,
        inkFaint: t.text.t4,
        rule: t.text.t4,
        selection: t.planes.elevated,
        wash: t.planes.surface,
      };
      const floor = paperOpacityFloor(c, t.mode, 60);
      const backdrop = worstBackdrop(c, t.mode, 60, floor);
      for (const ink of [c.ink, c.inkStrong, c.inkSoft, c.inkFaint]) {
        expect(contrast(parseHex(ink), backdrop), `${t.id} ${ink}`).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  it("asks for no more paper than the photograph needs", () => {
    for (const p of fixed) {
      expect(paperOpacityFloor(p.colors, p.tone, 0)).toBe(PAPER_OPACITY_MIN);
      let last = 0;
      for (let v = 0; v <= 60; v += 5) {
        const floor = paperOpacityFloor(p.colors, p.tone, v);
        expect(floor).toBeGreaterThanOrEqual(last);
        last = floor;
      }
    }
  });
});

describe("colour maths", () => {
  it("measures contrast as WCAG does", () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrast([255, 255, 255], [255, 255, 255])).toBe(1);
    expect(ratio("#767676", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(ratio("#777777", "#FFFFFF")).toBeLessThan(4.5);
  });

  it("parses what browsers report and mixes like color-mix(in srgb)", () => {
    expect(parseHex("#0A0E17")).toEqual([10, 14, 23]);
    expect(parseHex("abc")).toEqual([170, 187, 204]);
    expect(parseColor("rgb(10, 14, 23)")).toEqual([10, 14, 23]);
    expect(parseColor("10 14 23")).toEqual([10, 14, 23]);
    expect(parseColor(" #0a0e17 ")).toEqual([10, 14, 23]);
    expect(parseColor("")).toBeNull();
    expect(toHex(mix([0, 0, 0], [255, 255, 255], 0.5))).toBe("#808080");
    expect(toHex(mix([10, 20, 30], [200, 100, 50], 0))).toBe("#0A141E");
    expect(toHex(mix([10, 20, 30], [200, 100, 50], 1))).toBe("#C86432");
  });
});
