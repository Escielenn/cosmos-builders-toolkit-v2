// ---------------------------------------------------------------------------
// exosky-systems, the vantages ExoSky ships with and the data each one needs
// to be a real place to stand (1.9, E8 / N1 / N2).
//
// Every preset says how sure science is that its planet exists (status), and
// every number cites where it came from in the `source` line. Hosts that are
// in the HYG catalogue are named by Hipparcos id, so the vantage sits exactly
// on the catalogue star and that star is recognised as the observer's own sun
// rather than drawn as a phantom point (E2). Hosts too faint for the catalogue
// carry their own position and photometry.
//
// Values checked 2026-11-26 against the NASA Exoplanet Archive and the papers
// named per row. Status changes since 1.8:
//   Barnard b: confirmed. Four sub-Earths, none in the habitable zone
//     (Basant et al. 2025, ApJL 982, L1; AAS Nova 2025-03-11).
//   Kapteyn b: refuted. NASA Exoplanet Archive lists it as a false positive
//     (Robertson et al. 2015); the vantage is kept as a hypothetical world.
//   Tau Ceti e, HD 40307 g: candidates, never independently confirmed.
//   Kepler-452b: disputed (Mullally et al. 2018, AJ 155, 210).
//   Betelgeuse: 168 pc (Joyce et al. 2020, ApJ 902, 63), not 197 pc.
// ---------------------------------------------------------------------------

import { stellarRadiusSolar, type Vec3 } from "@/lib/simulators/astro";

export type PlanetStatus = "home" | "confirmed" | "candidate" | "disputed" | "refuted" | "hypothetical" | "yours";

export const STATUS_LABEL: Record<PlanetStatus, string> = {
  home: "Home",
  confirmed: "Confirmed planet",
  candidate: "Candidate, unconfirmed",
  disputed: "Disputed",
  refuted: "Refuted, kept as a hypothetical world",
  hypothetical: "Hypothetical world",
  yours: "From your world",
};

export type AtmoKey = "none" | "thin_n2" | "thin_co2" | "earth_like" | "thick_n2" | "thick_co2" | "gas_giant" | "exotic";

export interface AtmoModel {
  name: string;
  /**
   * Extinction in V, magnitudes per airmass. Earth's clear-sky value at a good
   * site is ~0.15-0.25 (we use 0.20). The others are illustrative scalings by
   * column density, not radiative transfer, and the science page says so.
   */
  k: number;
  /** Sky tint index into the exosky palette (palettes/exosky.ts). */
  tint: AtmoKey;
  desc: string;
}

export const ATMO_MODELS: Record<AtmoKey, AtmoModel> = {
  none: { name: "No atmosphere", k: 0, tint: "none", desc: "Vacuum. Stars burn to the horizon and do not twinkle." },
  thin_n2: { name: "Thin N₂", k: 0.06, tint: "thin_n2", desc: "Faint indigo wash low down. Little dimming." },
  thin_co2: { name: "Thin CO₂", k: 0.08, tint: "thin_co2", desc: "Pale butterscotch horizon, as on Mars." },
  earth_like: { name: "Earth-like N₂/O₂", k: 0.2, tint: "earth_like", desc: "Rayleigh blue. Stars fade toward the horizon." },
  thick_n2: { name: "Dense N₂", k: 0.5, tint: "thick_n2", desc: "Deep azure. Faint stars lost below 30° altitude." },
  thick_co2: { name: "Dense CO₂", k: 0.8, tint: "thick_co2", desc: "Amber haze. Only bright stars clear the murk." },
  gas_giant: { name: "H₂/He (seen from a moon)", k: 0.04, tint: "gas_giant", desc: "Airless moon of a giant. The giant fills part of the sky." },
  exotic: { name: "Silicate vapour", k: 1.2, tint: "exotic", desc: "Ruddy haze over a lava world. Most stars invisible." },
};

export interface HostData {
  /** Absolute V magnitude. */
  absMag: number;
  teffK: number;
  lumSolar: number;
  massSolar: number;
}

export interface PlanetData {
  /** Orbital distance, AU. */
  au: number;
  /** Orbital period, days. */
  orbitDays: number;
  /** Sidereal rotation, hours. Null when unknown (a default is shown as such). */
  rotationHours: number | null;
  obliquityDeg: number | null;
  tidallyLocked: boolean;
  /** Planet radius, Earth radii; null when unknown. */
  radiusEarth: number | null;
}

export interface VantagePreset {
  key: string;
  planet: string;
  host: string;
  status: PlanetStatus;
  /** HYG id of the host ("HIP 70890", "HYG 0" for the Sun). */
  hostId?: string;
  /** Position for hosts not in the catalogue: J2000 RA/Dec (deg), distance (pc). */
  ra?: number;
  dec?: number;
  distPc?: number;
  hostData?: HostData;
  planetData: PlanetData;
  atmo: AtmoKey;
  note: string;
  source: string;
}

const P = (au: number, orbitDays: number, opts: Partial<PlanetData> = {}): PlanetData => ({
  au,
  orbitDays,
  rotationHours: null,
  obliquityDeg: null,
  tidallyLocked: false,
  radiusEarth: null,
  ...opts,
});

/** Close-in planets of small stars are expected to be tidally locked. */
const LOCKED = { tidallyLocked: true, obliquityDeg: 0 } as const;

export const VANTAGES: readonly VantagePreset[] = [
  {
    key: "earth", planet: "Earth", host: "Sun", status: "home", hostId: "HYG 0",
    planetData: P(1, 365.256, { rotationHours: 23.9345, obliquityDeg: 23.4393, radiusEarth: 1 }),
    atmo: "earth_like", note: "The reference sky. Check any other vantage against it.",
    source: "IAU 2006 (obliquity), IERS (sidereal day).",
  },
  {
    key: "proxima-b", planet: "Proxima Centauri b", host: "Proxima Centauri", status: "confirmed", hostId: "HIP 70890",
    planetData: P(0.04857, 11.1868, { ...LOCKED, radiusEarth: 1.07 }),
    atmo: "thin_co2", note: "Nearest exoplanet. Alpha Centauri A and B shine as a pair of brilliant stars.",
    source: "Anglada-Escudé et al. 2016; Faria et al. 2022.",
  },
  {
    key: "trappist-1e", planet: "TRAPPIST-1e", host: "TRAPPIST-1", status: "confirmed",
    ra: 346.6223, dec: -5.0414, distPc: 12.47,
    hostData: { absMag: 18.3, teffK: 2566, lumSolar: 0.000553, massSolar: 0.0898 },
    planetData: P(0.02925, 6.0996, { ...LOCKED, radiusEarth: 0.92 }),
    atmo: "earth_like", note: "Habitable zone of an ultracool dwarf. Siblings hang in the sky larger than our Moon.",
    source: "Agol et al. 2021 (orbits, radius); Gillon et al. 2017.",
  },
  {
    key: "trappist-1f", planet: "TRAPPIST-1f", host: "TRAPPIST-1", status: "confirmed",
    ra: 346.6223, dec: -5.0414, distPc: 12.47,
    hostData: { absMag: 18.3, teffK: 2566, lumSolar: 0.000553, massSolar: 0.0898 },
    planetData: P(0.03849, 9.2067, { ...LOCKED, radiusEarth: 1.05 }),
    atmo: "thick_co2", note: "Outer habitable zone. A dimmer, redder sun.",
    source: "Agol et al. 2021.",
  },
  {
    key: "tau-ceti-e", planet: "Tau Ceti e", host: "Tau Ceti", status: "candidate", hostId: "HIP 8102",
    planetData: P(0.538, 162.87),
    atmo: "earth_like", note: "Sun-like host. Signal never independently confirmed.",
    source: "Feng et al. 2017.",
  },
  {
    key: "ross-128-b", planet: "Ross 128 b", host: "Ross 128", status: "confirmed", hostId: "HIP 57548",
    planetData: P(0.0496, 9.8658, { ...LOCKED, radiusEarth: 1.1 }),
    atmo: "thin_n2", note: "Quiet red dwarf, low flare activity.",
    source: "Bonfils et al. 2018.",
  },
  {
    key: "luyten-b", planet: "Luyten b (GJ 273 b)", host: "Luyten's Star", status: "confirmed", hostId: "HIP 36208",
    planetData: P(0.0911, 18.65, { ...LOCKED }),
    atmo: "earth_like", note: "Red dwarf, 12 light years from the Sun.",
    source: "Astudillo-Defru et al. 2017.",
  },
  {
    key: "teegarden-b", planet: "Teegarden's Star b", host: "Teegarden's Star", status: "confirmed",
    ra: 43.2540, dec: 16.8814, distPc: 3.83,
    hostData: { absMag: 17.2, teffK: 2904, lumSolar: 0.00073, massSolar: 0.097 },
    planetData: P(0.0259, 4.906, { ...LOCKED, radiusEarth: 1.02 }),
    atmo: "thin_co2", note: "Ultracool dwarf: most of its light is infrared.",
    source: "Zechmeister et al. 2019; Dreizler et al. 2024.",
  },
  {
    key: "gj-1061-d", planet: "GJ 1061 d", host: "GJ 1061", status: "confirmed",
    ra: 53.9992, dec: -44.5136, distPc: 3.67,
    hostData: { absMag: 15.2, teffK: 2953, lumSolar: 0.00165, massSolar: 0.12 },
    planetData: P(0.054, 13.03, { ...LOCKED }),
    atmo: "thin_n2", note: "Faint red dwarf, 12 light years away.",
    source: "Dreizler et al. 2020.",
  },
  {
    key: "kapteyn", planet: "Kapteyn's Star (hypothetical world)", host: "Kapteyn's Star", status: "refuted", hostId: "HIP 24186",
    planetData: P(0.168, 48.6, { ...LOCKED }),
    atmo: "thin_co2", note: "Kapteyn b was refuted as stellar activity; this is the sky an imagined planet there would see. An 11-billion-year-old halo star.",
    source: "NASA Exoplanet Archive: false positive (Robertson et al. 2015).",
  },
  {
    key: "wolf-1061-c", planet: "Wolf 1061 c", host: "Wolf 1061", status: "confirmed", hostId: "HIP 80824",
    planetData: P(0.089, 17.87, { ...LOCKED }),
    atmo: "thick_co2", note: "Possibly a runaway greenhouse.",
    source: "Wright et al. 2016.",
  },
  {
    key: "gj-667-cc", planet: "Gliese 667 Cc", host: "Gliese 667 C", status: "confirmed",
    ra: 259.7451, dec: -34.9968, distPc: 7.24,
    hostData: { absMag: 10.9, teffK: 3350, lumSolar: 0.0137, massSolar: 0.33 },
    planetData: P(0.125, 28.14, { ...LOCKED }),
    atmo: "earth_like", note: "Triple system: Gliese 667 A and B blaze as a bright orange pair.",
    source: "Anglada-Escudé et al. 2013.",
  },
  {
    key: "hd-40307-g", planet: "HD 40307 g", host: "HD 40307", status: "candidate", hostId: "HIP 27887",
    planetData: P(0.6, 197.8),
    atmo: "thick_n2", note: "K dwarf, warm orange sun. Signal unconfirmed.",
    source: "Tuomi et al. 2013.",
  },
  {
    key: "55-cnc-e", planet: "55 Cancri e", host: "55 Cancri A", status: "confirmed", hostId: "HIP 43587",
    planetData: P(0.01544, 0.7365, { ...LOCKED, radiusEarth: 1.88 }),
    atmo: "exotic", note: "Lava world 17 hours from its sun. The sun fills a patch of sky 30 times the Moon's width.",
    source: "Bourrier et al. 2018.",
  },
  {
    key: "eps-eri-b", planet: "Epsilon Eridani b (from a moon)", host: "Epsilon Eridani", status: "confirmed", hostId: "HIP 16537",
    planetData: P(3.52, 2692),
    atmo: "gas_giant", note: "Young system with debris belts. The Sun is a modest star here.",
    source: "Mawet et al. 2019.",
  },
  {
    key: "barnard-b", planet: "Barnard b", host: "Barnard's Star", status: "confirmed", hostId: "HIP 87937",
    planetData: P(0.0229, 3.1542, { ...LOCKED }),
    atmo: "none", note: "One of four sub-Earths, none in the habitable zone. Too hot for an atmosphere to be likely.",
    source: "González Hernández et al. 2024; Basant et al. 2025.",
  },
  {
    key: "pollux-b", planet: "Pollux b (Thestias), from a moon", host: "Pollux", status: "confirmed", hostId: "HIP 37826",
    planetData: P(1.64, 589.6),
    atmo: "gas_giant", note: "Orange giant host, 34 light years from the Sun.",
    source: "Hatzes et al. 2006.",
  },
  {
    key: "51-peg-b", planet: "51 Pegasi b (Dimidium)", host: "51 Pegasi", status: "confirmed", hostId: "HIP 113357",
    planetData: P(0.0527, 4.2308, { ...LOCKED }),
    atmo: "gas_giant", note: "The first exoplanet found around a Sun-like star (1995).",
    source: "Mayor & Queloz 1995.",
  },
  {
    key: "beta-pic-b", planet: "Beta Pictoris b (from a moon)", host: "Beta Pictoris", status: "confirmed", hostId: "HIP 27321",
    planetData: P(10.0, 8600),
    atmo: "gas_giant", note: "Young giant inside a debris disc.",
    source: "Lagrange et al. 2010; Nowak et al. 2020.",
  },
  {
    key: "hr-8799-e", planet: "HR 8799 e (from a moon)", host: "HR 8799", status: "confirmed", hostId: "HIP 114189",
    planetData: P(16.4, 16400),
    atmo: "gas_giant", note: "One of four directly imaged giants.",
    source: "Marois et al. 2010.",
  },
  {
    key: "kepler-186f", planet: "Kepler-186f", host: "Kepler-186", status: "confirmed",
    ra: 298.6527, dec: 43.9550, distPc: 177.6,
    hostData: { absMag: 8.8, teffK: 3755, lumSolar: 0.055, massSolar: 0.54 },
    planetData: P(0.432, 129.9, { radiusEarth: 1.17 }),
    atmo: "earth_like", note: "First Earth-sized planet found in a habitable zone. Our constellations are gone.",
    source: "Quintana et al. 2014; Gaia DR3 distance.",
  },
  {
    key: "kepler-442b", planet: "Kepler-442b", host: "Kepler-442", status: "confirmed",
    ra: 285.3666, dec: 39.2801, distPc: 366,
    hostData: { absMag: 6.9, teffK: 4402, lumSolar: 0.117, massSolar: 0.61 },
    planetData: P(0.409, 112.3, { radiusEarth: 1.34 }),
    atmo: "thick_n2", note: "Statistically validated super-Earth.",
    source: "Torres et al. 2015; Gaia DR3 distance.",
  },
  {
    key: "kepler-452b", planet: "Kepler-452b", host: "Kepler-452", status: "disputed",
    ra: 296.0037, dec: 44.2776, distPc: 552,
    hostData: { absMag: 4.7, teffK: 5757, lumSolar: 1.2, massSolar: 1.04 },
    planetData: P(1.046, 384.8, { radiusEarth: 1.63 }),
    atmo: "thick_n2", note: "\"Earth's cousin\", whose validation was later questioned.",
    source: "Jenkins et al. 2015; disputed by Mullally et al. 2018.",
  },
  // Famous stars with a hypothetical Earth-insolation planet (a = √L AU).
  { key: "alpha-cen-a", planet: "Alpha Centauri A (hypothetical world)", host: "Alpha Centauri A", status: "hypothetical", hostId: "HIP 71683", planetData: P(NaN, NaN), atmo: "earth_like", note: "Closest Sun-like star. Our constellations, barely moved; the Sun is a bright star in Cassiopeia.", source: "HYG v4.1." },
  { key: "sirius", planet: "Sirius (hypothetical world)", host: "Sirius A", status: "hypothetical", hostId: "HIP 32349", planetData: P(NaN, NaN), atmo: "none", note: "Brightest star in Earth's sky. The Sun is a modest star in Aquila from here.", source: "HYG v4.1." },
  { key: "vega", planet: "Vega (hypothetical world)", host: "Vega", status: "hypothetical", hostId: "HIP 91262", planetData: P(NaN, NaN), atmo: "none", note: "Young A star, 25 light years away.", source: "HYG v4.1." },
  { key: "fomalhaut", planet: "Fomalhaut (hypothetical world)", host: "Fomalhaut", status: "hypothetical", hostId: "HIP 113368", planetData: P(NaN, NaN), atmo: "none", note: "Young A star with a debris ring.", source: "HYG v4.1." },
  { key: "arcturus", planet: "Arcturus (hypothetical world)", host: "Arcturus", status: "hypothetical", hostId: "HIP 69673", planetData: P(NaN, NaN), atmo: "none", note: "Orange giant on a halo-like orbit through the disc.", source: "HYG v4.1." },
  { key: "aldebaran", planet: "Aldebaran (hypothetical world)", host: "Aldebaran", status: "hypothetical", hostId: "HIP 21421", planetData: P(NaN, NaN), atmo: "none", note: "Orange giant in front of the Hyades.", source: "HYG v4.1." },
  { key: "spica", planet: "Spica (hypothetical world)", host: "Spica", status: "hypothetical", hostId: "HIP 65474", planetData: P(NaN, NaN), atmo: "none", note: "Close binary of hot blue stars.", source: "HYG v4.1." },
  { key: "canopus", planet: "Canopus (hypothetical world)", host: "Canopus", status: "hypothetical", hostId: "HIP 30438", planetData: P(NaN, NaN), atmo: "none", note: "Bright giant about 95 pc away.", source: "HYG v4.1." },
  { key: "antares", planet: "Antares (hypothetical world)", host: "Antares", status: "hypothetical", hostId: "HIP 80763", planetData: P(NaN, NaN), atmo: "none", note: "Red supergiant in Scorpius.", source: "HYG v4.1." },
  { key: "betelgeuse", planet: "Betelgeuse (hypothetical world)", host: "Betelgeuse", status: "hypothetical", hostId: "HIP 27989", planetData: P(NaN, NaN), atmo: "none", note: "Red supergiant, 168 pc away (Joyce et al. 2020). Orion is gone.", source: "Joyce et al. 2020, ApJ 902, 63." },
  { key: "rigel", planet: "Rigel (hypothetical world)", host: "Rigel", status: "hypothetical", hostId: "HIP 24436", planetData: P(NaN, NaN), atmo: "none", note: "Blue supergiant. Hipparcos distance carries large errors.", source: "HYG v4.1." },
  { key: "deneb", planet: "Deneb (hypothetical world)", host: "Deneb", status: "hypothetical", hostId: "HIP 102098", planetData: P(NaN, NaN), atmo: "none", note: "Blue supergiant, very uncertain distance. The catalogue thins out this far from the Sun.", source: "HYG v4.1." },
];

/**
 * Catalogue corrections where a later measurement supersedes Hipparcos.
 * Applied to the catalogue star itself, so the point in the sky and the
 * vantage agree (one value, not two).
 */
export const DISTANCE_OVERRIDES_PC: Record<string, { distPc: number; source: string }> = {
  "HIP 27989": { distPc: 168, source: "Joyce et al. 2020, ApJ 902, 63" },
};

/**
 * Effective temperature from B-V, Ballesteros (2012), EPL 97, 34008:
 * T = 4600 (1 / (0.92 BV + 1.7) + 1 / (0.92 BV + 0.62)). Sun (0.65) -> ~5,780 K.
 */
export function teffFromBV(bv: number): number {
  return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
}

/** Host photometry for a catalogue star (luminosity from V, no bolometric correction). */
export function hostFromCatalogue(absMag: number, bv: number): HostData {
  const lum = Math.pow(10, (4.83 - absMag) / 2.5);
  // Mass from L ≈ M^3.5 on the main sequence; a rough figure for giants,
  // used only for sibling periods by Kepler's law.
  return { absMag, teffK: teffFromBV(bv), lumSolar: lum, massSolar: Math.pow(lum, 1 / 3.5) };
}

export function hostRadiusSolar(h: HostData): number {
  return stellarRadiusSolar(h.lumSolar, h.teffK);
}

// ---------------------------------------------------------------------------
// The Solar System, for the Earth vantage (N2's reference case)
// ---------------------------------------------------------------------------

export interface OrbitingBody {
  id: string;
  name: string;
  /** Semi-major axis around the host star (planets) or the planet (moons), AU. */
  au: number;
  periodDays: number;
  radiusKm: number;
  /** Geometric albedo. */
  albedo: number;
  /** Mean longitude at the date origin, deg. */
  longitude0: number;
  /** Where the numbers came from. */
  source: string;
}

/**
 * Mean longitudes at J2000 (Standish 1992, JPL "Keplerian elements for
 * approximate positions of the major planets"), geometric albedos from
 * Mallama et al. 2017 (Icarus 282, 19). Orbits are drawn circular and in
 * Earth's orbital plane, so positions are good to a few degrees (Mercury and
 * Mars worse), magnitudes to a few tenths.
 */
export const SOLAR_SYSTEM: readonly OrbitingBody[] = [
  { id: "mercury", name: "Mercury", au: 0.387098, periodDays: 87.969, radiusKm: 2439.7, albedo: 0.142, longitude0: 252.2503, source: "JPL approximate elements (Standish 1992); Mallama 2017." },
  { id: "venus", name: "Venus", au: 0.723332, periodDays: 224.701, radiusKm: 6051.8, albedo: 0.689, longitude0: 181.9791, source: "JPL approximate elements (Standish 1992); Mallama 2017." },
  { id: "mars", name: "Mars", au: 1.523679, periodDays: 686.98, radiusKm: 3389.5, albedo: 0.17, longitude0: 355.4533, source: "JPL approximate elements (Standish 1992); Mallama 2017." },
  { id: "jupiter", name: "Jupiter", au: 5.2026, periodDays: 4332.59, radiusKm: 69911, albedo: 0.538, longitude0: 34.3964, source: "JPL approximate elements (Standish 1992); Mallama 2017." },
  { id: "saturn", name: "Saturn", au: 9.5549, periodDays: 10759.22, radiusKm: 58232, albedo: 0.499, longitude0: 49.9543, source: "JPL approximate elements (Standish 1992); Mallama 2017 (globe only, no rings)." },
  { id: "uranus", name: "Uranus", au: 19.2184, periodDays: 30688.5, radiusKm: 25362, albedo: 0.488, longitude0: 313.2381, source: "JPL approximate elements (Standish 1992); Mallama 2017." },
  { id: "neptune", name: "Neptune", au: 30.1104, periodDays: 60182, radiusKm: 24622, albedo: 0.442, longitude0: 304.8800, source: "JPL approximate elements (Standish 1992); Mallama 2017." },
];

/** Earth's heliocentric mean longitude at J2000 (Standish 1992). */
export const EARTH_LONGITUDE0 = 100.4645;

/** The Moon: mean longitude at J2000 218.316° (Meeus, Astronomical Algorithms, ch. 47). */
export const MOON: OrbitingBody = {
  id: "moon", name: "Moon", au: 384400 / 149597870.7, periodDays: 27.321661, radiusKm: 1737.4, albedo: 0.12, longitude0: 218.3165,
  source: "Meeus ch. 47 (mean longitude); geometric albedo 0.12.",
};

export function presetByKey(key: string): VantagePreset | undefined {
  return VANTAGES.find((v) => v.key === key);
}

export type { Vec3 };
