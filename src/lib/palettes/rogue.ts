// ---------------------------------------------------------------------------
// Rogue simulator body colours: star discs by spectral class, the planets of
// the preset systems, and the three kinds of intruder.
//
// A DATA palette: these are how each body is drawn on the simulator canvas
// (Mars is rust, Neptune is blue). They are pictures of things, not theme
// colours, and do not follow the user's theme. The star set is deliberately
// more saturated than src/lib/palettes/spectral.ts: at a few pixels across on
// a busy orbit plot, the classes must still be told apart.
// ---------------------------------------------------------------------------

export const ROGUE_STAR_COLOURS = {
  O: "#aaccff",
  B: "#caddff",
  A: "#f0f0ff",
  F: "#fff8e0",
  G: "#ffd43b",
  K: "#ffaa44",
  M: "#ff6633",
} as const;

/** Preset planets, by the name they carry in src/lib/simulators/rogue-systems.ts. */
export const ROGUE_PLANET_COLOURS: Record<string, string> = {
  Mercury: "#a0a0a0",
  Venus: "#e8cda0",
  Earth: "#4a9eff",
  Mars: "#c1440e",
  Jupiter: "#c88b3a",
  Saturn: "#e8d08a",
  Uranus: "#7ec8c8",
  Neptune: "#4466ff",
  "T-1b": "#cc6644",
  "T-1c": "#cc8855",
  "T-1d": "#aa7744",
  "T-1e": "#5588cc",
  "T-1f": "#4a9eff",
  "T-1g": "#6699bb",
  "T-1h": "#8899aa",
  K90b: "#aa8866",
  K90c: "#bb9977",
  K90i: "#cc8855",
  K90d: "#7799bb",
  K90e: "#6688aa",
  K90f: "#88aacc",
  K90g: "#c88b3a",
  K90h: "#d4956a",
  "Prox d": "#aa8877",
  "Prox b": "#5588cc",
  "Prox c": "#7799bb",
  "α Cen Ab*": "#5588cc",
  "α Cen Ac*": "#88aacc",
};

/** Intruders: black hole, brown dwarf, rogue planet. */
export const ROGUE_INTRUDER_COLOURS = {
  bh: "#e74c3c",
  bd: "#c8553d",
  rp: "#8b6914",
} as const;
