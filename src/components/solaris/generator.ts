/**
 * Solaris procedural system generator (native port of the original A sim).
 *
 * Ports A's star buckets, band-based orbital placement, planet archetypes,
 * and combined-luminosity habitable zone into a deterministic, typed module
 * that emits the StarSystem shape the R3F viewer consumes.
 *
 * Supports single- and multi-star (binary/trinary/quaternary) architectures.
 * The habitable band is anchored to the rigorous Kopparapu (2013) HZ
 * (kopparapu.ts), and companion stars orbit the barycenter (physics.ts).
 *
 * Determinism: same seed string -> same system (mulberry32 + string hash).
 */
import type {
  StarSystem,
  StarData,
  StarClass,
  PlanetData,
  PlanetType,
  MoonData,
  PlanetMeta,
} from "./types";
import { combinedHZ } from "./kopparapu";

// ── Seeded PRNG ──────────────────────────────────────────────────────────
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RNG = () => number;
const rnd = (r: RNG, a: number, b: number) => r() * (b - a) + a;
const rndInt = (r: RNG, a: number, b: number) => Math.floor(rnd(r, a, b + 1));
const pick = <T>(r: RNG, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

function toRoman(n: number): string {
  const v = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const s = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let r = "";
  for (let i = 0; i < v.length; i++) while (n >= v[i]) { r += s[i]; n -= v[i]; }
  return r;
}

// ── Star buckets (A's 5) mapped to spectral class + physical params ───────
type BucketKey = "blue" | "white" | "yellow" | "orange" | "red";
interface StarBucket {
  classification: StarClass;
  colorHex: string;
  lum: number;      // L☉
  massSOL: number;
  radiusSOL: number;
  temperatureK: number;
  hzAU: [number, number]; // A's per-bucket HZ constants
  weight: number;         // relative frequency (M dwarfs most common)
}
const STAR_BUCKETS: Record<BucketKey, StarBucket> = {
  blue:   { classification: "B", colorHex: "#9BB8FF", lum: 4.5,  massSOL: 3.2, radiusSOL: 2.4, temperatureK: 15000, hzAU: [3.5, 7.0], weight: 1 },
  white:  { classification: "A", colorHex: "#FFFDE7", lum: 2.2,  massSOL: 1.7, radiusSOL: 1.5, temperatureK: 8500,  hzAU: [2.4, 4.5], weight: 3 },
  yellow: { classification: "G", colorHex: "#FFF4E8", lum: 1.0,  massSOL: 1.0, radiusSOL: 1.0, temperatureK: 5778,  hzAU: [1.6, 3.0], weight: 6 },
  orange: { classification: "K", colorHex: "#FFD2A1", lum: 0.42, massSOL: 0.78, radiusSOL: 0.8, temperatureK: 4500, hzAU: [0.8, 1.7], weight: 8 },
  red:    { classification: "M", colorHex: "#FFB56C", lum: 0.08, massSOL: 0.35, radiusSOL: 0.4, temperatureK: 3200, hzAU: [0.2, 0.7], weight: 10 },
};
const BUCKET_KEYS = Object.keys(STAR_BUCKETS) as BucketKey[];

// Uniform across the five buckets — matches A's resolveStarKey -> pick(SKEYS).
function pickBucket(r: RNG): BucketKey {
  return BUCKET_KEYS[Math.floor(r() * BUCKET_KEYS.length)];
}

// ── Planet archetypes (ported from A's PTYPES) ───────────────────────────
type Band = "inner" | "habitable" | "outer" | "remote";
interface Archetype {
  render: PlanetType;   // B render type (drives material)
  color: string;
  alt: string;
  band: Band;
  rMin: number;         // physical radius range (Earth radii)
  rMax: number;
  tempK: number;
  rings: boolean;
  atmo: boolean;        // has a visible atmosphere shell
  name: string;         // display name
  life: string;
  atmosphere: string;
  water: string;
  hazard: string;
  resources: string;
  note: string;
}

const A: Record<string, Archetype> = {
  // Inner
  magma:      { render: "lava-world",  color: "#CC3300", alt: "#881100", band: "inner", rMin: 0.5, rMax: 1.1, tempK: 1300, rings: false, atmo: true,  name: "Magma", life: "None", atmosphere: "Dense Sulfuric", water: "None", hazard: "Volcanic", resources: "Rich", note: "Molten surface, glowing fissures, constant eruptions." },
  arid:       { render: "desert-world", color: "#C08040", alt: "#7A5228", band: "inner", rMin: 0.5, rMax: 1.0, tempK: 620, rings: false, atmo: true,  name: "Arid", life: "None", atmosphere: "Thin", water: "Trace", hazard: "Sandstorm", resources: "Average", note: "Hot desert winds, vast dune seas." },
  desert:     { render: "desert-world", color: "#C4914A", alt: "#8B6030", band: "inner", rMin: 0.5, rMax: 1.0, tempK: 620, rings: false, atmo: false, name: "Desert", life: "None", atmosphere: "Thin", water: "None", hazard: "Heat", resources: "Poor", note: "Parched cracked earth, scorched plains." },
  scarred:    { render: "rocky",       color: "#888070", alt: "#585048", band: "inner", rMin: 0.4, rMax: 0.9, tempK: 620, rings: false, atmo: false, name: "Scarred", life: "None", atmosphere: "None", water: "None", hazard: "Radiation", resources: "Scarce", note: "Impact-cratered, radiation-blasted, exposed rock." },
  lavaocean:  { render: "lava-world",  color: "#FF6600", alt: "#AA2200", band: "inner", rMin: 0.9, rMax: 1.6, tempK: 1400, rings: false, atmo: true,  name: "Lava Ocean", life: "None", atmosphere: "Thick Toxic", water: "None", hazard: "Volcanic", resources: "Rich Ore", note: "Global magma ocean — mineral-rich but lethal." },
  ironfist:   { render: "rocky",       color: "#9A6060", alt: "#6A3030", band: "inner", rMin: 0.6, rMax: 1.3, tempK: 620, rings: false, atmo: false, name: "Iron World", life: "None", atmosphere: "Thin Metal", water: "None", hazard: "Magnetic", resources: "Rich Iron", note: "Extreme-density iron-core world; hyper-gravity." },
  volcanic:   { render: "lava-world",  color: "#FF4500", alt: "#8B2200", band: "inner", rMin: 0.5, rMax: 1.1, tempK: 700, rings: false, atmo: true,  name: "Volcanic", life: "None", atmosphere: "Sulfuric", water: "None", hazard: "Extreme", resources: "Rich Mineral", note: "Extreme geologic activity, constant eruptions." },
  // Habitable
  terrestrial:{ render: "rocky",       color: "#4A90D9", alt: "#2ECC71", band: "habitable", rMin: 0.8, rMax: 1.3, tempK: 288, rings: false, atmo: true, name: "Terrestrial", life: "Complex", atmosphere: "Standard", water: "Abundant", hazard: "Low", resources: "Rich", note: "Earth-analog — diverse biomes, plate tectonics, civilization-possible." },
  ocean:      { render: "ocean-world", color: "#1A6FA8", alt: "#0D4F7A", band: "habitable", rMin: 0.8, rMax: 1.5, tempK: 280, rings: false, atmo: true, name: "Ocean World", life: "Marine", atmosphere: "Humid", water: "Global", hazard: "Storms", resources: "Average", note: "100% water coverage. No land civilization; radically different concept of territory." },
  superearth: { render: "super-earth", color: "#5A8A60", alt: "#3A5A40", band: "habitable", rMin: 1.4, rMax: 2.4, tempK: 285, rings: false, atmo: true, name: "Super-Earth", life: "Present", atmosphere: "Thick", water: "High", hazard: "Seismic", resources: "Rich", note: "1.5-10x Earth mass; high gravity reshapes biology, architecture, and technology." },
  jungle:     { render: "rocky",       color: "#228B22", alt: "#145214", band: "habitable", rMin: 0.7, rMax: 1.2, tempK: 300, rings: false, atmo: true, name: "Jungle", life: "Dense", atmosphere: "Thick", water: "High", hazard: "Fauna", resources: "Rich", note: "Hypervegetated, aggressive life, dense canopy." },
  tidallocked:{ render: "rocky",       color: "#C0784A", alt: "#2A4A8A", band: "habitable", rMin: 0.6, rMax: 1.3, tempK: 255, rings: false, atmo: true, name: "Tidal Lock", life: "Twilight", atmosphere: "Thin", water: "Moderate", hazard: "Wind Shear", resources: "Variable", note: "Eternal day/night hemispheres. Civilizations cluster in the perpetual twilight band." },
  greenhouse: { render: "rocky",       color: "#8BC34A", alt: "#C0392B", band: "habitable", rMin: 0.7, rMax: 1.2, tempK: 340, rings: false, atmo: true, name: "Greenhouse", life: "Microbial", atmosphere: "Thick CO2", water: "Moderate", hazard: "Storms", resources: "Average", note: "Runaway greenhouse in progress — Venus-analog developing." },
  twilight:   { render: "rocky",       color: "#7A6A9A", alt: "#4A3A6A", band: "habitable", rMin: 0.6, rMax: 1.1, tempK: 260, rings: false, atmo: true, name: "Twilight", life: "Sparse", atmosphere: "Moderate", water: "Ice Caps", hazard: "Low", resources: "Average", note: "Barely habitable zone edge; permanent dusk at terminator." },
  crystalline:{ render: "rocky",       color: "#C8D8F8", alt: "#8898C8", band: "habitable", rMin: 0.6, rMax: 1.1, tempK: 288, rings: false, atmo: false, name: "Crystalline", life: "Possible", atmosphere: "Thin Silicate", water: "Trace", hazard: "Crystals", resources: "Rare Crystal", note: "High silicate world; surface covered in towering crystal formations." },
  waterworld: { render: "ocean-world", color: "#00B4D8", alt: "#0077A8", band: "habitable", rMin: 0.9, rMax: 1.7, tempK: 280, rings: false, atmo: true, name: "Water World", life: "Rich", atmosphere: "Vapor Thick", water: "Global Deep", hazard: "Pressure", resources: "Biological", note: "Deep global ocean 100s of km deep. Continental shelves only." },
  hycean:     { render: "ocean-world", color: "#38B2AC", alt: "#1A8080", band: "habitable", rMin: 1.2, rMax: 2.2, tempK: 300, rings: false, atmo: true, name: "Hycean", life: "Microbial", atmosphere: "H2 Rich", water: "Global Hot", hazard: "Pressure", resources: "Average", note: "Hydrogen-atmosphere ocean world — potentially habitable per 2020s research." },
  // Outer
  gasgiant:   { render: "gas-giant",   color: "#D4875A", alt: "#9B5A2E", band: "outer", rMin: 9.0, rMax: 12.0, tempK: 150, rings: true, atmo: true, name: "Gas Giant", life: "None", atmosphere: "Massive H/He", water: "High", hazard: "Storms", resources: "Poor", note: "Jupiter-class; complex moon system; magnetic field; Great Storm analogs." },
  icegiant:   { render: "ice-giant",   color: "#7EC8E3", alt: "#4A98B5", band: "outer", rMin: 3.2, rMax: 4.6, tempK: 70, rings: true, atmo: true, name: "Ice Giant", life: "None", atmosphere: "Dense Methane", water: "Ice", hazard: "None", resources: "Average", note: "Uranus/Neptune analog; possible subsurface ocean; ring system." },
  rocky:      { render: "rocky",       color: "#8B7355", alt: "#5C4A35", band: "outer", rMin: 0.5, rMax: 1.1, tempK: 150, rings: false, atmo: false, name: "Rocky", life: "None", atmosphere: "Thin", water: "Trace", hazard: "Seismic", resources: "Average", note: "Rugged stone, mineral-rich surface, possible subsurface brines." },
  barren:     { render: "rocky",       color: "#7A7A7A", alt: "#4A4A4A", band: "outer", rMin: 0.4, rMax: 0.9, tempK: 150, rings: false, atmo: false, name: "Barren", life: "None", atmosphere: "None", water: "None", hazard: "None", resources: "Poor", note: "Desolate, airless, no geological activity." },
  stormworld: { render: "sub-neptune", color: "#6A5A8A", alt: "#3A3050", band: "outer", rMin: 2.0, rMax: 3.2, tempK: 150, rings: false, atmo: true, name: "Storm World", life: "None", atmosphere: "Violent", water: "Trace", hazard: "Extreme", resources: "Scarce", note: "Perpetual hyperstorm systems; 500+ mph winds, lightning constant." },
  diamond:    { render: "rocky",       color: "#808898", alt: "#505860", band: "outer", rMin: 0.6, rMax: 1.3, tempK: 150, rings: false, atmo: false, name: "Carbon World", life: "None", atmosphere: "CO2", water: "None", hazard: "None", resources: "Diamond", note: "High carbon ratio; possible diamond mantle layers." },
  binarycomp: { render: "rocky",       color: "#B8A040", alt: "#785E20", band: "outer", rMin: 0.7, rMax: 1.5, tempK: 150, rings: false, atmo: false, name: "Companion", life: "None", atmosphere: "Disrupted", water: "None", hazard: "Tidal", resources: "Poor", note: "Captured body in binary arrangement; extreme tidal forces." },
  // Remote
  glacial:    { render: "rocky",       color: "#A8D8EA", alt: "#6AADC8", band: "remote", rMin: 0.4, rMax: 0.9, tempK: 50, rings: false, atmo: false, name: "Glacial", life: "None", atmosphere: "None", water: "Ice", hazard: "Seismic", resources: "Scarce", note: "Deep frozen fractured ice surface, possible subsurface ocean." },
  airless:    { render: "rocky",       color: "#6B6B7A", alt: "#3A3A48", band: "remote", rMin: 0.3, rMax: 0.8, tempK: 40, rings: false, atmo: false, name: "Airless", life: "None", atmosphere: "None", water: "None", hazard: "None", resources: "Scarce", note: "Vacuum-exposed, no geological activity." },
  rogue:      { render: "rocky",       color: "#302840", alt: "#181020", band: "remote", rMin: 0.5, rMax: 1.4, tempK: 30, rings: false, atmo: true, name: "Rogue World", life: "Possible", atmosphere: "Thin Volcanic", water: "Subsurface", hazard: "None", resources: "Unknown", note: "No star. Life sustained by internal geothermal heat; eternal darkness shapes all culture." },
  comet:      { render: "rocky",       color: "#A0C0D8", alt: "#607890", band: "remote", rMin: 0.2, rMax: 0.4, tempK: 40, rings: false, atmo: false, name: "Comet Body", life: "None", atmosphere: "Coma Trace", water: "Ice Dust", hazard: "None", resources: "Trace", note: "Active outgassing ice and dust nucleus; possible amino acid carrier." },
  oortbody:   { render: "rocky",       color: "#8090A0", alt: "#506070", band: "remote", rMin: 0.2, rMax: 0.4, tempK: 20, rings: false, atmo: false, name: "Oort Body", life: "None", atmosphere: "None", water: "Ice", hazard: "None", resources: "Scarce", note: "Primordial body at extreme outer system; unperturbed since formation." },
};

const BAND_POOL: Record<Band, string[]> = {
  inner: ["magma", "arid", "desert", "scarred", "lavaocean", "ironfist", "volcanic"],
  habitable: ["terrestrial", "ocean", "superearth", "jungle", "tidallocked", "greenhouse", "twilight", "crystalline", "waterworld", "hycean"],
  outer: ["gasgiant", "icegiant", "rocky", "barren", "stormworld", "diamond", "binarycomp"],
  remote: ["glacial", "airless", "rogue", "comet", "oortbody"],
};

const SYS_NAMES = ["Xaelopec", "Vortimael", "Solnaris", "Caelundra", "Primaris", "Vaelthor", "Nocturus", "Drifaris", "Aethoria", "Keldruun", "Solvena", "Mytharan", "Peldrix", "Zentarion", "Orimuul", "Vykoraan", "Draethis", "Lumenvex", "Astravar", "Nytheron", "Celindra", "Korvaxis", "Veldruun", "Saethis"];

// ── Helpers ──────────────────────────────────────────────────────────────
function lighten(hex: string, amt: number): string {
  const n = (i: number) => Math.min(255, parseInt(hex.slice(i, i + 2), 16) + amt);
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(n(1))}${h(n(3))}${h(n(5))}`;
}

function massFromRadius(render: PlanetType, r: number): number {
  if (render === "gas-giant" || render === "hot-jupiter") return 2.5 * r * r;
  if (render === "ice-giant" || render === "sub-neptune") return 1.1 * r * r;
  return Math.pow(r, 3); // terrestrial mass-radius approximation
}

const MOON_TONES = ["#C8C8C8", "#B0A79A", "#9FB0BF", "#8B7355", "#D8CDBE"];

let _uid = 0;
const uid = () => `p${Date.now().toString(36)}${(_uid++).toString(36)}`;

function makePlanet(
  rng: RNG,
  archKey: string,
  au: number,
  idx: number,
  starMassSOL: number,
  hzInner: number,
  hzOuter: number
): PlanetData {
  const a = A[archKey];
  const radiusEarth = rnd(rng, a.rMin, a.rMax);
  const massEarth = massFromRadius(a.render, radiusEarth);
  const eMax = a.band === "outer" || a.band === "remote" ? 0.12 : 0.05;
  const eccentricity = rnd(rng, 0, eMax);
  const orbitalPeriodYears = Math.sqrt(Math.pow(au, 3) / Math.max(starMassSOL, 0.05));

  const giant = ["gas-giant", "ice-giant", "sub-neptune", "super-earth", "ocean-world"].includes(a.render);
  const moonCount = giant ? rndInt(rng, 1, 4) : rng() > 0.6 ? 1 : 0;
  const moons: MoonData[] = [];
  for (let m = 0; m < moonCount; m++) {
    moons.push({
      name: `Moon ${m + 1}`,
      radiusKM: rnd(rng, 200, 1900),
      orbitRadiusKM: rnd(rng, 20000, 600000),
      periodDays: rnd(rng, 1.5, 30),
      colorHex: pick(rng, MOON_TONES),
      tidally_locked: true,
    });
  }

  const meta: PlanetMeta = {
    archetype: archKey,
    displayName: a.name,
    band: a.band,
    life: a.life,
    atmosphere: a.atmosphere,
    water: a.water,
    hazard: a.hazard,
    resources: a.resources,
    note: a.note,
  };

  return {
    id: uid(),
    name: "",
    type: a.render,
    massEarth: Math.round(massEarth * 100) / 100,
    radiusEarth: Math.round(radiusEarth * 100) / 100,
    semiMajorAxisAU: Math.round(au * 1000) / 1000,
    eccentricity: Math.round(eccentricity * 1000) / 1000,
    orbitalPeriodYears: Math.round(orbitalPeriodYears * 1000) / 1000,
    axialTiltDeg: archKey === "tidallocked" ? 0 : Math.round(rnd(rng, 0, 35)),
    colorHex: a.color,
    atmosphereColorHex: a.atmo ? lighten(a.color, 60) : undefined,
    hasRings: a.rings,
    ringColorHex: a.rings ? (a.render === "ice-giant" ? "#BFD8E0" : "#D8C6A0") : undefined,
    moons,
    inHabitableZone: au >= hzInner && au <= hzOuter,
    surfaceTempK: a.tempK,
    meta,
  };
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

type Architecture = "single" | "binary" | "trinary" | "quaternary";

function makeStar(key: BucketKey, name: string, orbit: Partial<StarData>): StarData {
  const bk = STAR_BUCKETS[key];
  return {
    name,
    classification: bk.classification,
    massSOL: bk.massSOL,
    luminositySOL: bk.lum,
    radiusSOL: bk.radiusSOL,
    temperatureK: bk.temperatureK,
    colorHex: bk.colorHex,
    habitableZoneInnerAU: 0,
    habitableZoneOuterAU: 0,
    ...orbit,
  };
}

/**
 * Build the star list for an architecture. Companions orbit the barycenter on
 * analytic Keplerian orbits (mass-weighted). Returns the circumbinary inner
 * clearance and, for hierarchical systems, the outer stability limit imposed
 * by the nearest distant companion (Holman & Wiegert-style ~0.3× separation).
 */
function buildStars(
  rng: RNG,
  primaryKey: BucketKey,
  sysName: string,
  arch: Architecture
): { stars: StarData[]; innerClearAU: number; outerLimitAU: number } {
  if (arch === "single") {
    return { stars: [makeStar(primaryKey, `${sysName} A`, {})], innerClearAU: 0, outerLimitAU: Infinity };
  }

  const bKey = pickBucket(rng);
  const mA = STAR_BUCKETS[primaryKey].massSOL;
  const mB = STAR_BUCKETS[bKey].massSOL;
  const sepAB = rnd(rng, 0.2, 1.0);
  const Mab = mA + mB;
  const Pab = Math.sqrt(sepAB ** 3 / Mab);
  const stars: StarData[] = [
    makeStar(primaryKey, `${sysName} A`, { orbitRadiusAU: round3((sepAB * mB) / Mab), orbitPhase: Math.PI, orbitPeriodYears: round3(Pab) }),
    makeStar(bKey, `${sysName} B`, { orbitRadiusAU: round3((sepAB * mA) / Mab), orbitPhase: 0, orbitPeriodYears: round3(Pab) }),
  ];
  const innerClearAU = sepAB * 3.5;
  let outerLimitAU = Infinity;

  if (arch === "trinary" || arch === "quaternary") {
    const cKey = pickBucket(rng);
    const cSep = sepAB * rnd(rng, 8, 16);
    const Mabc = Mab + STAR_BUCKETS[cKey].massSOL;
    stars.push(makeStar(cKey, `${sysName} C`, { orbitRadiusAU: round3(cSep), orbitPhase: rnd(rng, 0, Math.PI * 2), orbitPeriodYears: round3(Math.sqrt(cSep ** 3 / Mabc)) }));
    outerLimitAU = cSep * 0.3;

    if (arch === "quaternary") {
      const dKey = pickBucket(rng);
      const dSep = cSep * rnd(rng, 2.5, 4.5);
      const Mall = Mabc + STAR_BUCKETS[dKey].massSOL;
      stars.push(makeStar(dKey, `${sysName} D`, { orbitRadiusAU: round3(dSep), orbitPhase: rnd(rng, 0, Math.PI * 2), orbitPeriodYears: round3(Math.sqrt(dSep ** 3 / Mall)) }));
    }
  }

  return { stars, innerClearAU, outerLimitAU };
}

export interface GenerateOptions {
  seed?: string;
  planetCount?: number;
  starBucket?: BucketKey;
  architecture?: Architecture;
  includeBelt?: boolean;
}

/** Deterministically generate a system (single- or multi-star). Same seed -> same system. */
export function generateSystem(opts: GenerateOptions | string = {}): StarSystem {
  const o: GenerateOptions = typeof opts === "string" ? { seed: opts } : opts;
  const seed = o.seed ?? Math.random().toString(36).slice(2, 10);
  const rng = mulberry32(hashSeed(seed));

  const bucketKey = o.starBucket ?? pickBucket(rng);
  const sysName = pick(rng, SYS_NAMES);

  // Architecture: mostly single, with a tail of multi-star systems.
  const arch: Architecture =
    o.architecture ??
    (() => {
      const x = rng();
      if (x < 0.7) return "single";
      if (x < 0.88) return "binary";
      if (x < 0.96) return "trinary";
      return "quaternary";
    })();

  const { stars, innerClearAU, outerLimitAU } = buildStars(rng, bucketKey, sysName, arch);
  const Mtot = stars.reduce((s, st) => s + st.massSOL, 0);

  // Rigorous Kopparapu (2013) HZ — combined for multi-star. Realigns the
  // habitable band with the real HZ (fixes M2's red-dwarf no-in-zone quirk).
  const [hzInner, hzOuter] = combinedHZ(stars);

  const star: StarData = { ...stars[0], habitableZoneInnerAU: round3(hzInner), habitableZoneOuterAU: round3(hzOuter) };
  stars[0] = star;

  // Bands anchored to the HZ; nothing inside the circumbinary clearance,
  // nothing outside the hierarchical stability limit.
  const floor = innerClearAU;
  const bandRanges: Record<Band, { min: number; max: number }> = {
    inner: { min: Math.max(floor, 0.35 * hzInner), max: Math.max(floor + 0.05, 0.9 * hzInner) },
    habitable: { min: Math.max(floor, hzInner), max: Math.max(floor + 0.1, hzOuter) },
    outer: { min: Math.max(floor, hzOuter * 1.2), max: hzOuter * 3 },
    remote: { min: Math.max(floor, hzOuter * 3), max: hzOuter * 6 },
  };
  (Object.values(bandRanges) as { min: number; max: number }[]).forEach((r) => {
    if (isFinite(outerLimitAU)) r.max = Math.min(r.max, outerLimitAU);
    if (r.min >= r.max) r.min = r.max * 0.85;
  });

  const num = o.planetCount ?? rndInt(rng, 4, 8);
  const bandOrder: Band[] = ["inner", "habitable", "outer", "remote"];
  const bands: Band[] = [];
  for (let i = 0; i < num; i++) {
    const t = i / num;
    bands.push(t < 0.18 ? "inner" : t < 0.45 ? "habitable" : t < 0.72 ? "outer" : "remote");
  }
  bands.sort((x, y) => bandOrder.indexOf(x) - bandOrder.indexOf(y));

  const usedAU: number[] = [];
  const planets: PlanetData[] = [];
  for (const band of bands) {
    const br = bandRanges[band];
    let au = 0;
    let tries = 0;
    do {
      au = rnd(rng, br.min, br.max);
      tries++;
    } while (usedAU.some((u) => Math.abs(u - au) < 0.12 * Math.max(hzInner, 0.1)) && tries < 30);
    usedAU.push(au);
    const archKey = pick(rng, BAND_POOL[band]);
    planets.push(makePlanet(rng, archKey, au, planets.length, Mtot, hzInner, hzOuter));
  }

  planets.sort((p, q) => p.semiMajorAxisAU - q.semiMajorAxisAU);
  planets.forEach((p, i) => (p.name = `${sysName}-${toRoman(i + 1)}`));

  // Optional asteroid belt between the last habitable and first outer planet.
  const asteroidBelts = [];
  const includeBelt = o.includeBelt ?? rng() > 0.4;
  if (includeBelt) {
    const hab = planets.filter((p) => p.meta?.band === "habitable");
    const out = planets.filter((p) => p.meta?.band === "outer");
    const center =
      hab.length && out.length
        ? (hab[hab.length - 1].semiMajorAxisAU + out[0].semiMajorAxisAU) / 2
        : hzOuter * rnd(rng, 1.2, 1.8);
    const spread = rnd(rng, 0.3, 0.6);
    asteroidBelts.push({
      innerAU: Math.round((center - spread / 2) * 1000) / 1000,
      outerAU: Math.round((center + spread / 2) * 1000) / 1000,
      density: pick(rng, ["sparse", "moderate", "dense"] as const),
      colorHex: "#8B7355",
    });
  }

  return {
    id: `gen-${seed}`,
    name: sysName,
    star,
    stars,
    architecture: arch,
    planets,
    asteroidBelts,
    generatedAt: new Date().toISOString(),
    seed,
  };
}

// ── Editing helpers (M4) ─────────────────────────────────────────────────
export interface PaletteItem {
  key: string;
  name: string;
  color: string;
  band: Band;
}

/** All planet archetypes, for the drag/click palette (grouped by band). */
export const PALETTE: PaletteItem[] = (Object.keys(A) as string[]).map((key) => ({
  key,
  name: A[key].name,
  color: A[key].color,
  band: A[key].band,
}));

export const PALETTE_BANDS: Band[] = ["inner", "habitable", "outer", "remote"];

/** Build a single planet of an archetype at a given orbit (for editor add-planet). */
export function createPlanet(
  archKey: string,
  sma: number,
  starMassSOL: number,
  hzInner: number,
  hzOuter: number
): PlanetData {
  const p = makePlanet(Math.random, archKey, sma, 0, starMassSOL, hzInner, hzOuter);
  p.name = A[archKey]?.name ?? "New Planet";
  return p;
}

/** A single moon with randomized parameters (for the moon panel add button). */
export function createMoon(): MoonData {
  return {
    name: "Moon",
    radiusKM: Math.round(200 + Math.random() * 1700),
    orbitRadiusKM: Math.round(20000 + Math.random() * 580000),
    periodDays: Math.round((1.5 + Math.random() * 28) * 10) / 10,
    colorHex: MOON_TONES[Math.floor(Math.random() * MOON_TONES.length)],
    tidally_locked: true,
  };
}
