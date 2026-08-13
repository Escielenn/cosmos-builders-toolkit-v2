/**
 * rogueView, view-layer helpers shared by the canvas and the panels.
 *
 * Separate from the components so neither file exports a mix of components and
 * functions, which breaks fast refresh for the whole module.
 */

import { AU_PER_YEAR_TO_KM_S, type Body } from "@/lib/simulators/nbody";

/** Camera state: centre in AU, zoom in pixels per AU. */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface RogueDisplay {
  trails: boolean;
  labels: boolean;
  orbits: boolean;
  habitableZone: boolean;
  grid: boolean;
  gravityLines: boolean;
}

/**
 * Grid spacing that keeps roughly 40 to 200 px between lines at any zoom.
 *
 * Needed because the systems span four orders of magnitude: a fixed 1 AU grid is
 * invisible in TRAPPIST-1 and a solid wall in the outer Solar System.
 */
export function gridStep(zoom: number): number {
  const target = 90 / zoom;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const mult of [1, 2, 5, 10]) {
    if (magnitude * mult >= target) return magnitude * mult;
  }
  return magnitude * 10;
}

/** Speed in km/s, the unit a reader recognises. */
export function speedKmS(b: Body): number {
  return Math.hypot(b.vx, b.vy) * AU_PER_YEAR_TO_KM_S;
}
