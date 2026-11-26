// Measures card text contrast over the worst world art: a pure white image.
// Colours are read from the generated tokens.css (default Void·Teal theme),
// so a retune of the tokens re-runs this check against the new values.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IMAGE_OPACITY, SMALL_TEXT_MAX_X, VEIL_STOPS, veilAlphaAt, veilBackground, imageOpacityCss } from "@/lib/world-art";

type RGB = [number, number, number];

const css = readFileSync(resolve(__dirname, "../../styles/tokens.css"), "utf8");
function token(name: string): RGB {
  const m = new RegExp(`--${name}-rgb:\\s*([^;]+);`).exec(css);
  if (!m) throw new Error(`token ${name} not found`);
  const ref = /var\(--([\w-]+)-rgb\)/.exec(m[1]);
  if (ref) return token(ref[1]);
  const [r, g, b] = m[1].trim().split(/\s+/).map(Number);
  return [r, g, b];
}

function lum([r, g, b]: RGB): number {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const over = (top: RGB, alpha: number, under: RGB): RGB =>
  top.map((t, i) => alpha * t + (1 - alpha) * under[i]) as RGB;

const surface = token("sf-surface");
const WHITE: RGB = [255, 255, 255];

/** The pixel behind text at x when the image there is pure white. */
function worstBackground(x: number): RGB {
  // Card body (surface; the real glass panel is darker) under the image,
  // then the veil on top. Browsers composite in gamma-encoded sRGB.
  const art = over(WHITE, IMAGE_OPACITY, surface);
  return over(surface, veilAlphaAt(x), art);
}

describe("world art veil", () => {
  it("keeps body and title text (t1, t2) at AA across the whole card", () => {
    for (let x = 0; x <= 1.0001; x += 0.05) {
      const bg = worstBackground(x);
      expect(contrast(token("t1"), bg), `t1 at ${x.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token("t2"), bg), `t2 at ${x.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps labels and timestamps (t3, t4) at AA in the text column", () => {
    for (let x = 0; x <= SMALL_TEXT_MAX_X + 0.0001; x += 0.05) {
      const bg = worstBackground(x);
      expect(contrast(token("t3"), bg), `t3 at ${x.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token("t4"), bg), `t4 at ${x.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps primary-tinted text (links, the world icon) at AA in the text column", () => {
    const primaryText = token("sf-primary-text");
    for (let x = 0; x <= SMALL_TEXT_MAX_X + 0.0001; x += 0.05) {
      expect(contrast(primaryText, worstBackground(x))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("still lets the picture through on the right", () => {
    // Effective visibility of the image at the right edge: (1 - veil) * opacity.
    const visible = (1 - veilAlphaAt(1)) * IMAGE_OPACITY;
    expect(visible).toBeGreaterThan(0.15);
  });

  it("emits CSS from the same numbers, via tokens only", () => {
    const bg = veilBackground();
    expect(bg).toContain("var(--sf-surface-rgb)");
    expect(bg).not.toMatch(/#[0-9a-f]{3,6}/i);
    for (const [, a] of VEIL_STOPS) expect(bg).toContain(`/ ${a})`);
    expect(imageOpacityCss()).toContain("var(--sf-ambient");
  });
});
