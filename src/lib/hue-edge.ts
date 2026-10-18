/**
 * hueEdge: a soft edge in a named/data hue, without an alpha border.
 *
 * Alpha borders (`${color}30`) composite unpredictably over the starfield,
 * grain and video layers, so they are banned (10-LEGIBILITY rule 2). This
 * mixes the hue into a known plane instead: the result is a solid colour
 * whose contrast does not depend on what is behind it, and it stays as quiet
 * as the alpha version looked. (Softening pass, 2026-10-18.)
 *
 *   hueEdge(c)            → resting edge, recedes like sf-line
 *   hueEdge(c, "active")  → selected/active edge, clearly the hue
 */
export type HueEdgeStrength = "soft" | "active";

const MIX: Record<HueEdgeStrength, number> = { soft: 38, active: 72 };

export function hueEdge(color: string | undefined | null, strength: HueEdgeStrength = "soft"): string {
  if (!color) return "var(--sf-line)";
  return `color-mix(in oklab, ${color} ${MIX[strength]}%, var(--sf-surface))`;
}
