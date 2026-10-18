// ---------------------------------------------------------------------------
// Map sheets: what an uploaded image must look like to be read as a planet.
//
// The sheet is a TEXTURE (owner, 2026-09-07). Nothing here reads a number off
// it. What we can check is its shape, because the shape is what makes a pin
// land where the writer meant:
//
//   equirectangular   exactly 2:1. Anything else stretches every latitude.
//   mercator          wider than tall is fine and sets how far toward the
//                     poles it reaches; taller than wide reaches past 89° and
//                     is almost certainly not a Mercator sheet at all.
//
// A mismatch WARNS. It never blocks: a writer's 1.9:1 scan of a hand-drawn map
// is still their map, and refusing it would be the software deciding.
// ---------------------------------------------------------------------------

import type { MapProjection } from "@/lib/atlas/placement";
import { mercatorLatLimit } from "./geo";

/** How far from 2:1 an equirect sheet may be before pins visibly drift. */
export const EQUIRECT_TOLERANCE = 0.03;

export interface SheetCheck {
  ok: boolean;
  aspect: number;
  /** Ship's-Voice warning when not ok. */
  warning: string | null;
  /** For Mercator: the latitude the sheet reaches. */
  latLimit: number | null;
}

export function formatAspect(aspect: number): string {
  return `${aspect.toFixed(2)}:1`;
}

export function checkSheet(width: number, height: number, projection: MapProjection): SheetCheck {
  if (!(width > 0) || !(height > 0)) {
    return { ok: false, aspect: NaN, warning: "IMAGE HAS NO DIMENSIONS. RE-EXPORT AND ATTACH AGAIN.", latLimit: null };
  }
  const aspect = width / height;
  if (projection === "equirectangular") {
    const ok = Math.abs(aspect - 2) / 2 <= EQUIRECT_TOLERANCE;
    return {
      ok,
      aspect,
      warning: ok
        ? null
        : `ASPECT ${formatAspect(aspect)}. EQUIRECTANGULAR SHEETS ARE 2:1. PINS WILL DRIFT FROM THE DRAWING UNTIL THE SHEET IS RE-EXPORTED.`,
      latLimit: null,
    };
  }
  const latLimit = mercatorLatLimit(aspect);
  const ok = aspect >= 0.95;
  return {
    ok,
    aspect,
    warning: ok
      ? null
      : `ASPECT ${formatAspect(aspect)}. A MERCATOR SHEET TALLER THAN IT IS WIDE IS UNUSUAL. CHECK THE PROJECTION.`,
    latLimit,
  };
}

/** The upload cap, shared with the Codex map-sheet section. */
export const MAX_SHEET_BYTES = 12 * 1024 * 1024;

/*
 * Storage lives in src/services/storage-urls.ts (uploadMapSheet): the private
 * `map-sheets` bucket at <user>/<world>/<entity>-<ts>.<ext>, shared with the
 * Codex map-sheet section, under the same entity keys (map_sheet_url,
 * map_sheet_projection), so a sheet attached here is the sheet the Atlas shows
 * and vice versa.
 */
