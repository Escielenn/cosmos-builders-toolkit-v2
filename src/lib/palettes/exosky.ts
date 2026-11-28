// ---------------------------------------------------------------------------
// ExoSky data palettes (1.9). Not theme colours: these describe light in an
// alien sky (atmospheric tints, ground, the Milky Way's glow) and the printed
// star chart, which is ink on paper and must not follow a dark theme.
// The canvas draws UI marks (labels, grid, horizon line) from
// src/styles/tokens.ts; only physical colours live here.
// ---------------------------------------------------------------------------

import type { AtmoKey } from "@/lib/simulators/exosky-systems";

/** Line colours a writer can give a constellation (saved with it). */
export const CONSTELLATION_COLOURS: ReadonlyArray<{ hex: string; name: string }> = [
  { hex: "#FFA500", name: "Amber" },
  { hex: "#FF6B8A", name: "Rose" },
  { hex: "#2ECC71", name: "Emerald" },
  { hex: "#B07CE0", name: "Violet" },
  { hex: "#FFD43B", name: "Gold" },
  { hex: "#FF7A5C", name: "Coral" },
  { hex: "#1ABC9C", name: "Teal" },
  { hex: "#FFFFFF", name: "White" },
];

/**
 * Daytime sky colour at the zenith (r, g, b), by atmosphere. Rayleigh blue
 * for N₂/O₂, butterscotch for thin CO₂ with dust (Mars), amber haze for
 * dense CO₂. Illustrative, not computed; the science page says so.
 */
export const SKY_DAY_RGB: Record<AtmoKey, [number, number, number]> = {
  none: [0, 0, 0],
  thin_n2: [70, 96, 160],
  thin_co2: [196, 150, 104],
  earth_like: [86, 140, 214],
  thick_n2: [62, 110, 196],
  thick_co2: [214, 150, 70],
  gas_giant: [120, 140, 170],
  exotic: [200, 96, 72],
};

/** Horizon glow at twilight, by atmosphere. */
export const SKY_TWILIGHT_RGB: Record<AtmoKey, [number, number, number]> = {
  none: [0, 0, 0],
  thin_n2: [60, 60, 120],
  thin_co2: [80, 110, 170],
  earth_like: [230, 120, 70],
  thick_n2: [200, 110, 90],
  thick_co2: [230, 110, 40],
  gas_giant: [90, 100, 130],
  exotic: [230, 80, 50],
};

/** Ground below the horizon: an unlit, unspecified surface. */
export const GROUND_RGB: [number, number, number] = [10, 9, 8];

/** Integrated starlight of the Milky Way band: warm toward the bulge, neutral in the disc. */
export const MILKY_WAY_DISC_RGB: [number, number, number] = [176, 178, 200];
export const MILKY_WAY_BULGE_RGB: [number, number, number] = [222, 204, 178];

/** The Sun marker (an index colour, so Sol is findable in any sky). */
export const SOL_MARKER = "#FFD73B";

/** Printed star chart: ink on white. */
export const PRINT = {
  paper: "#FFFFFF",
  ink: "#111111",
  inkSoft: "#555555",
  grid: "#BBBBBB",
  horizon: "#111111",
  line: "#3366AA",
  sol: "#B8860B",
  body: "#AA3300",
} as const;
