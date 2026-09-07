// ---------------------------------------------------------------------------
// Token binding (Brief G1 §4).
//
// "No hardcoded colours anywhere in src/gl/." Every colour the engine draws
// comes from the same solved tokens the DOM uses, read off computed style, so
// a theme change moves the render with it. 70 themes, all contrast-solved by
// design/themes.py — an engine with its own palette would be a 71st that
// nobody solved.
//
// Parsing is separated from reading so the parsing is testable without a DOM.
// ---------------------------------------------------------------------------

/** Linear-space RGB in 0..1, which is what a shader uniform wants. */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** The tokens the engine binds. Names match tokens.css exactly. */
export const BOUND_TOKENS = [
  "--sf-void",
  "--sf-surface",
  "--sf-primary",
  "--sf-line",
  "--sf-amber",
  "--sf-stellar",
  "--sf-violet",
  "--sf-crimson",
] as const;

export type BoundToken = (typeof BOUND_TOKENS)[number];

export interface ThemeUniforms extends Record<string, unknown> {
  colours: Record<BoundToken, RGB>;
  /** --sf-ambient, the one dial that turns every decorative layer down. */
  ambient: number;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * sRGB hex → linear RGB.
 *
 * The renderer runs in linear space with ACES tone mapping, so a token handed
 * over raw would come out washed. This is the same transfer function three.js
 * applies via SRGBColorSpace; doing it here keeps the conversion in one place
 * and testable.
 */
export function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Parse a CSS colour token to linear RGB. Null when it is not a hex colour. */
export function parseTokenColour(raw: string | null | undefined): RGB | null {
  if (!raw) return null;
  const value = raw.trim();

  const hex = value.match(HEX);
  if (hex) {
    const h = hex[1];
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = Number.parseInt(full, 16);
    return {
      r: srgbToLinear(((n >> 16) & 255) / 255),
      g: srgbToLinear(((n >> 8) & 255) / 255),
      b: srgbToLinear((n & 255) / 255),
    };
  }

  // tokens.css also emits `--x-rgb: 21 193 123` triplets for Tailwind. Accept
  // them so a consumer can bind either form.
  const triplet = value.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
  if (triplet) {
    const [, r, g, b] = triplet;
    const to = (s: string) => srgbToLinear(Math.min(255, Number(s)) / 255);
    return { r: to(r), g: to(g), b: to(b) };
  }

  return null;
}

/** Fallback used only when a token is missing entirely — a black hole, visibly wrong. */
const MISSING: RGB = { r: 0, g: 0, b: 0 };

export function parseAmbient(raw: string | null | undefined): number {
  const n = Number.parseFloat((raw ?? "").trim());
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

/**
 * Read the bound tokens off an element's computed style.
 *
 * Takes the reader as a parameter rather than calling getComputedStyle
 * directly, so the whole binding can be exercised in a test.
 */
export function readThemeUniforms(
  read: (token: string) => string | null,
): ThemeUniforms {
  const colours = {} as Record<BoundToken, RGB>;
  for (const token of BOUND_TOKENS) {
    colours[token] = parseTokenColour(read(token)) ?? MISSING;
  }
  return {
    colours,
    ambient: parseAmbient(read("--sf-ambient")),
  };
}

/** The reader for a live document. */
export function domTokenReader(el: Element): (token: string) => string | null {
  const style = getComputedStyle(el);
  return (token) => style.getPropertyValue(token) || null;
}
