// ---------------------------------------------------------------------------
// Planetary reflectance palette, for forge-gl's procedural surfaces.
//
// A DATA palette, not a theme (CLAUDE.md: "Data palettes (spectral classes,
// albedos) are not theme colours and belong in src/lib/palettes/"). Each
// entry is a measured or well-attested visible reflectance of a real
// material, in LINEAR RGB (approximate band reflectance in R ~650, G ~550,
// B ~450 nm), so the renderer lights it physically and the star's colour
// tints it. None of these moves with the user's theme, because ice is not
// teal in a teal theme.
//
// SOURCES (geometric/Bond albedo and colour, visible band)
//   Open ocean ~0.06, blue: Payne 1972, J. Atmos. Sci. 29:959.
//   Fresh snow 0.8–0.9, sea ice 0.5–0.7: Perovich et al. 2002, JGR 107(C10).
//   Lunar regolith 0.12, slightly red: Lane & Irvine 1973, AJ 78:267.
//   Desert / iron-oxide soil ~0.3–0.4, red-orange (Sahara, Mars 0.25):
//     Tsvetsinskaya et al. 2002; Mustard & Bell 1994.
//   Vegetation (green peak ~0.12 at 550 nm, red-edge beyond 700 nm): Clark
//     et al. 2007, USGS Digital Spectral Library splib06.
//   Plant colour under other stars: Kiang et al. 2007, Astrobiology 7:252.
//     Photosynthetic pigments tune to the star's peak photon flux: under
//     M dwarfs plants may absorb the whole visible and look near-black;
//     under F stars they may reflect more blue and absorb toward yellow.
//   Venus cloud tops ~0.75, pale yellow: Pérez-Hoyos et al. 2018.
//   Giant-planet cloud classes by temperature: Sudarsky, Burrows & Pinto
//     2000, ApJ 538:885 (Class I ammonia < 150 K; II water 150–250 K;
//     III clear 350–800 K; IV alkali-metal 900–1500 K; V silicate > 1500 K).
//   Saturn's ring particles, water ice, slightly red ~0.5: Cuzzi et al.
//     2009, "Saturn from Cassini-Huygens", ch. 15. Dusty silicate rings
//     (Jupiter's, Uranus's) ~0.05: Burns et al. 2001.
// ---------------------------------------------------------------------------

export interface LinearRGB {
  r: number;
  g: number;
  b: number;
}

const c = (r: number, g: number, b: number): LinearRGB => ({ r, g, b });

export const SURFACE_REFLECTANCE = {
  oceanDeep: c(0.012, 0.03, 0.065),
  oceanShallow: c(0.03, 0.075, 0.095),
  seaIce: c(0.55, 0.6, 0.66),
  snow: c(0.8, 0.84, 0.88),
  regolith: c(0.12, 0.105, 0.09),
  soil: c(0.17, 0.14, 0.105),
  desert: c(0.38, 0.24, 0.13),
  evaporite: c(0.55, 0.52, 0.47),
  scorched: c(0.065, 0.055, 0.05),
  vegetationEarth: c(0.035, 0.08, 0.025),
  vegetationDark: c(0.025, 0.018, 0.02),
  vegetationWarm: c(0.12, 0.1, 0.04),
} as const;

export const CLOUD_REFLECTANCE = {
  water: c(0.78, 0.79, 0.8),
  sulphuric: c(0.8, 0.7, 0.48),
  ammonia: c(0.8, 0.73, 0.6),
  methaneIce: c(0.75, 0.82, 0.85),
} as const;

/** Sudarsky class → [zone, belt] reflectance. */
export const GIANT_BANDS: Record<"I" | "II" | "III" | "IV" | "V" | "ice", [LinearRGB, LinearRGB]> = {
  I: [c(0.8, 0.72, 0.58), c(0.42, 0.27, 0.16)],
  II: [c(0.82, 0.83, 0.85), c(0.6, 0.62, 0.66)],
  III: [c(0.1, 0.2, 0.48), c(0.05, 0.1, 0.3)],
  IV: [c(0.07, 0.05, 0.045), c(0.035, 0.028, 0.026)],
  V: [c(0.56, 0.5, 0.44), c(0.36, 0.3, 0.26)],
  // Methane-dominated ice giants: red absorbed, the rest scattered.
  ice: [c(0.34, 0.62, 0.74), c(0.2, 0.42, 0.62)],
};

export const RING_REFLECTANCE = {
  ice: c(0.56, 0.5, 0.42),
  silicate: c(0.065, 0.058, 0.05),
} as const;
