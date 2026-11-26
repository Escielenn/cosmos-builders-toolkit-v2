// ---------------------------------------------------------------------------
// Planet and atmosphere colours for the gravity tools.
//
// A DATA palette: these picture a kind of planet (a rocky world is tan, an
// ocean world is deep blue) or tell gases apart in a chart. They are not
// theme colours and do not follow the user's theme.
// ---------------------------------------------------------------------------

import { tokens } from "@/styles/tokens";

/** Earth, the fixed reference body in every size comparison. */
export const EARTH_REFERENCE_COLOUR = "#3B82F6";

export type CompositionId =
  | "custom"
  | "iron-rich"
  | "rocky"
  | "ocean"
  | "ice"
  | "super-earth"
  | "mini-neptune";

/** Disc colour per bulk composition. "custom" has no look of its own. */
export const COMPOSITION_COLOURS: Record<CompositionId, string> = {
  custom: tokens.accent.base,
  "iron-rich": "#8B8682",
  rocky: "#C4956A",
  ocean: "#1E6091",
  ice: "#A8D8EA",
  "super-earth": "#D4A574",
  "mini-neptune": "#5B7FBF",
};

/** Used when a composition id is unknown. */
export const DEFAULT_COMPOSITION_COLOUR: string = COMPOSITION_COLOURS.custom;

export type GasId = "h2" | "he" | "h2o" | "n2" | "o2" | "co2";

/** Series colour per gas in the atmospheric retention chart. */
export const GAS_COLOURS: Record<GasId, string> = {
  h2: "#60A5FA",
  he: "#A78BFA",
  h2o: "#22D3EE",
  n2: "#34D399",
  o2: "#2ECC71",
  co2: "#F59E0B",
};
