// ---------------------------------------------------------------------------
// Entity colour swatches (the Codex entity colour picker) and the hex shown
// as the example in a colour text field.
//
// A DATA palette: the chosen colour is stored on the entity as a hex string
// and marks that entity in the graph, the atlas and the manuscript. The first
// eight are the system's named hues at their default-theme values, so a new
// entity starts in the family the cascade already uses; the last three are
// extra warm marks kept for entities coloured before 1.7.
// ---------------------------------------------------------------------------

import { tokens } from "@/styles/tokens";

export const ENTITY_COLOUR_SWATCHES: readonly string[] = [
  tokens.hue.amber,
  tokens.hue.azure,
  tokens.hue.violet,
  tokens.hue.magenta,
  tokens.hue.emerald,
  tokens.hue.teal,
  tokens.hue.crimson,
  tokens.hue.stellar,
  "#E74C3C",
  "#FFA500",
  "#FFD43B",
];

/** Example shown in a hex text field (placeholder, never applied). */
export const HEX_EXAMPLE: string = tokens.hue.teal;
