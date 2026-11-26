// ---------------------------------------------------------------------------
// Galaxy map colours (Stellar Cartographer).
//
// A DATA palette: empires, trade routes and wormholes are things the writer
// puts on the map, and their colours are saved with the galaxy and exported
// to PNG / SVG. The map is a picture of space on the simulator canvas, so
// these do not follow the user's theme. The selection ring and the default
// empire's teal are the product accent and come from tokens.ts.
// ---------------------------------------------------------------------------

import { tokens } from "@/styles/tokens";

/** Colours offered when the writer adds an empire. */
export const EMPIRE_COLOURS: readonly string[] = [
  "#FFD43B",
  "#FF6B6B",
  "#9B59B6",
  "#1ABC9C",
  "#F39C12",
  "#3498DB",
  "#E67E22",
  "#00CEC9",
];

/** The four empires a new galaxy starts with, in order. */
export const DEFAULT_EMPIRE_COLOURS = [
  tokens.accent.base,
  "#E74C3C",
  "#E056FD",
  "#2ECC71",
] as const;

/** Trade routes cycle through these. */
export const ROUTE_COLOURS: string[] = [
  "#FFA500",
  "#FFD43B",
  tokens.accent.base,
  "#2ECC71",
  "#E056FD",
  "#FF6B6B",
];

/** Wormhole pairs cycle through these. */
export const WORMHOLE_COLOURS: string[] = ["#9B59B6", "#8E44AD", "#E056FD"];

/** Accretion glow of the central black hole, by activity. */
export const SMBH_COLOURS = {
  quiescent: tokens.hue.amber,
  active: "#FF6B35",
  quasar: tokens.accent.base,
} as const;

/** Fixed marks drawn over the star field. */
export const GALAXY_MARK = {
  /** Ring around a star with a habitable world. */
  habitable: "#2ECC71",
  /** Ring around the selected star: the product accent. */
  selection: tokens.accent.base,
  /** Route being drawn, and the stars already on it. */
  routeDraft: "#FFA500",
  /** Wormhole portal body and glow. */
  wormhole: "#9B59B6",
  /** Wormhole count in the readout. */
  wormholeReadout: "#E056FD",
  /** Event horizon. */
  eventHorizon: tokens.neutral.black,
  /** Star and portal cores, and the selected star's label. */
  core: tokens.neutral.white,
  /** Tooltip name for a star outside any empire. */
  unclaimedLabel: tokens.text.t1,
  /** Backdrop of an exported SVG (deeper than the live canvas). */
  exportBackdrop: "#050508",
} as const;
