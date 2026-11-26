// ---------------------------------------------------------------------------
// Label swatches: the fixed set of named colours a writer can hang on their
// own data (tags, timeline tracks and events, collaborator cursors).
//
// A DATA palette, not a theme palette (CLAUDE.md, Simulator Colors). These
// values are persisted with the user's records as hex strings and call sites
// append hex alpha to them (`${colour}20`), so they stay concrete hex and do
// not follow the theme. Never use one for chrome: buttons, focus, selection
// and links are `sf-primary`; cascade and status meanings are the named hues.
//
// `stellar` is the system's own blue (tokens.hue.stellar). It replaces the
// stray indigo (#6366f1) that used to be the default here and was never part
// of the palette.
// ---------------------------------------------------------------------------

import { tokens } from "@/styles/tokens";

export const SWATCH = {
  stellar: tokens.hue.stellar,
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  red: "#ef4444",
  redDeep: "#dc2626",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  aqua: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  grey: "#6b7280",
  greyLight: "#9ca3af",
} as const;

export type SwatchName = keyof typeof SWATCH;

/** Shown when a record carries no colour of its own. */
export const DEFAULT_SWATCH: string = SWATCH.stellar;
