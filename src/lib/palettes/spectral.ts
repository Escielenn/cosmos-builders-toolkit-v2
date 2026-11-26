// ---------------------------------------------------------------------------
// Stellar spectral-class colours (Harvard classes O B A F G K M).
//
// A DATA palette: this is the apparent colour of a star of that class, the
// way an albedo is the colour of a planet. It is physics, not theme, and does
// not move when the user changes theme. Used for star discs on canvas, the
// spectral-type pickers and the galaxy map legend.
// ---------------------------------------------------------------------------

export const SPECTRAL_LETTERS = ["O", "B", "A", "F", "G", "K", "M"] as const;
export type SpectralLetter = (typeof SPECTRAL_LETTERS)[number];

/** Disc colour per class. */
export const SPECTRAL_CLASS_COLOURS: Record<SpectralLetter, string> = {
  O: "#9BB0FF",
  B: "#AABFFF",
  A: "#CAD7FF",
  F: "#F8F7FF",
  G: "#FFF4EA",
  K: "#FFD2A1",
  M: "#FFCC6F",
};

/** Corona glow per class (already carries its alpha), for canvas halos. */
export const SPECTRAL_CLASS_GLOWS: Record<SpectralLetter, string> = {
  O: "rgba(155, 176, 255, 0.6)",
  B: "rgba(170, 191, 255, 0.5)",
  A: "rgba(202, 215, 255, 0.4)",
  F: "rgba(248, 247, 255, 0.35)",
  G: "rgba(255, 244, 234, 0.35)",
  K: "rgba(255, 210, 161, 0.3)",
  M: "rgba(255, 100, 50, 0.3)",
};

/**
 * The galaxy map draws thousands of stars a few pixels wide, so its red
 * dwarfs are pushed redder than the disc colour above to stay distinct from
 * K stars at that size.
 */
export const GALAXY_MAP_SPECTRAL_COLOURS: Record<SpectralLetter, string> = {
  ...SPECTRAL_CLASS_COLOURS,
  M: "#FFAA6F",
};

/** The white-hot core every star disc fades from. */
export const STAR_CORE_WHITE = "#FFFFFF";
