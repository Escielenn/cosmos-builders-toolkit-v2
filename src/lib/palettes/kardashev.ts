// ---------------------------------------------------------------------------
// Kardashev band colours: one per rung of the scale, Sub-Type I to Omega.
//
// A DATA palette (a chart series). The scale is drawn as a ladder and each
// rung keeps its colour so a civilisation's marker can be read against it.
// Call sites append hex alpha (`${colour}08`), so these stay concrete hex.
// ---------------------------------------------------------------------------

import { tokens } from "@/styles/tokens";
import { SWATCH } from "./swatches";

/** In scale order: Sub-I, I, I-II, II, II-III, III, III+, Omega. */
export const KARDASHEV_BAND_COLOURS = [
  SWATCH.grey,
  SWATCH.blue,
  SWATCH.violet,
  SWATCH.amber,
  SWATCH.red,
  SWATCH.pink,
  SWATCH.teal,
  tokens.text.t1,
] as const;
