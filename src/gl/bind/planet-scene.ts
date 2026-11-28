// ---------------------------------------------------------------------------
// bind/planet-scene — a planet's facts, as everything PlanetScene draws.
//
// 14-RENDER-ENGINE §1: "Every visual property is a function of canon.
// Nothing is hand-tuned per scene." This is where that is true for a planet.
// The scene receives a PlanetSceneBinding and nothing else: it cannot know
// where a number came from, so it cannot invent one.
//
// Inputs are the same quantities Tidelock and ExoForge take (star class or
// mass, orbit, planet mass and radius, albedo, pressure, composition,
// greenhouse, ocean, cloud, rings), as plain nullable values. They arrive
// either from canon (planetSceneFactsFromCanon, below) or from the preview
// controls. Every quantity that was not supplied is DERIVED here with
// src/lib/physics, and travels with a note saying so (the bind/index rule:
// uniforms, never facts; nothing derived here is ever written back).
//
// What the physics decides, visibly:
//   star colour and apparent size     Teff (black body), R★ / a
//   temperature at every point        locked: Cowan & Agol-type day–night
//                                     profile (lockedSurfaceTemperature);
//                                     turning: annual-mean insolation by
//                                     latitude with diffusive transport
//                                     (North, Cahalan & Coakley 1981)
//   where water is liquid, ice, gone  273.15 K to the Clausius–Clapeyron
//                                     boiling point at this pressure; sea
//                                     ice below 263 K (North 1975 ice line)
//   rim and terminator colours        Rayleigh optical depth (scattering.ts)
//   terminator width                  pressure (atmosphere.ts)
//   whether it turns                  canon, else the Gladman tidal-lock
//                                     timescale against the system's age
//   gas-giant banding colour          Sudarsky class from Teq
//   ring material                     ice beyond the snow line, dust inside
//   city lights                       only when canon says people live there
// ---------------------------------------------------------------------------

import {
  AU_M,
  R_EARTH_M,
  R_SUN_M,
  REDISTRIBUTION,
  SIGMA_SB,
  S_EARTH_WM2,
  WATER_TRIPLE_BAR,
  distanceForInsolation,
  equilibriumTemperature,
  greenhouseMultiplier,
  insolation,
  liquidWaterBand,
  lockedHemispheres,
  lockedSurfaceTemperature,
  mainSequenceStar,
  massFromRadius,
  radiusFromLuminosityTeff,
  radiusFromMass,
  redistributionEfficiency,
  starFromSpectralType,
  surfaceGravityMs2,
  tidalLockTimescaleYears,
  waterBoilingPoint,
} from "@/lib/physics";
import { adaptedLight, blackbodyHue, limbDarkening, spectralClassKelvin } from "../materials/blackbody";
import { rimThickness, terminatorSoftness } from "../materials/atmosphere";
import { parseGasMix, scattering, type Scattering } from "../materials/scattering";
import type { RGB } from "../engine/theme-uniforms";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface PlanetSceneFacts {
  name: string | null;
  spectralClass: string | null;
  starTeffK: number | null;
  starLuminosityLsun: number | null;
  starMassMsun: number | null;
  starRadiusRsun: number | null;
  /** Gyr. Used only to decide tidal locking when canon is silent. */
  starAgeGyr: number | null;
  aAU: number | null;
  massEarth: number | null;
  radiusEarth: number | null;
  albedo: number | null;
  pressureBar: number | null;
  composition: string | null;
  /** Grey infrared optical depth (Tidelock's greenhouse slider). */
  greenhouseTau: number | null;
  /** 0..1 of the surface under water. */
  hydrosphere: number | null;
  /** 0..1 cloud cover. */
  cloudCover: number | null;
  obliquityDeg: number | null;
  rotationHours: number | null;
  tidallyLocked: boolean | null;
  /** Ring extent in planet radii, or null for none. */
  rings: { inner: number; outer: number } | null;
  /** True when canon puts a civilisation on this world. */
  civilisation: boolean | null;
  /** True when canon puts photosynthetic life on this world. */
  life: boolean | null;
  /** Seeds the terrain so a world keeps its coastlines between visits. */
  seed: number;
}

export const EMPTY_FACTS: PlanetSceneFacts = {
  name: null,
  spectralClass: null,
  starTeffK: null,
  starLuminosityLsun: null,
  starMassMsun: null,
  starRadiusRsun: null,
  starAgeGyr: null,
  aAU: null,
  massEarth: null,
  radiusEarth: null,
  albedo: null,
  pressureBar: null,
  composition: null,
  greenhouseTau: null,
  hydrosphere: null,
  cloudCover: null,
  obliquityDeg: null,
  rotationHours: null,
  tidallyLocked: null,
  rings: null,
  civilisation: null,
  life: null,
  seed: 1,
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type PlanetKind = "rocky" | "gas" | "ice";
export type SudarskyClass = "I" | "II" | "III" | "IV" | "V";

export interface PlanetSceneBinding {
  name: string;
  kind: PlanetKind;
  sudarsky: SudarskyClass | null;
  star: {
    teffK: number;
    luminosityLsun: number;
    radiusRsun: number;
    massMsun: number;
    spectralClass: string | null;
    /** Black-body hue, max channel 1, linear. The photosphere's own colour. */
    hue: RGB;
    /** The hue as an adapted eye sees its light on a surface (adaptedLight). Lights the planet. */
    light: RGB;
    limbDarkening: number;
    /** Angular radius seen from the planet, radians: R★ / a. */
    angularRadius: number;
  };
  aAU: number;
  insolation: number;
  massEarth: number;
  radiusEarth: number;
  gravityMs2: number;
  albedo: number;
  pressureBar: number;
  greenhouseTau: number;
  /** Day–night (locked) or equator–pole (turning) heat transport, 0..1. */
  epsilon: number;
  tidallyLocked: boolean;
  /** Radians of axial tilt. 0 for a locked body. */
  tilt: number;
  /** Display radians/second; 0 when locked. Negative = retrograde. */
  spinRate: number;
  /** Hours per rotation (sets gas-giant band count and heat transport). */
  rotationHours: number;
  temperature: {
    equilibrium: number;
    mean: number;
    min: number;
    max: number;
    /** Surface temperature (K) at a latitude and longitude, degrees. Locked: lon 0 is substellar. */
    at: (latDeg: number, lonDeg: number) => number;
  };
  water: {
    /** 0..1 of the surface below sea level. */
    fraction: number;
    freezeK: number;
    /** Sea ice forms below this (North 1975: −10 °C annual mean). */
    seaIceK: number;
    /** Infinity when the pressure is below the triple point (no liquid at all). */
    boilK: number;
    liquidPossible: boolean;
    /** Locked worlds: the liquid band, degrees from the substellar point. */
    bandDeg: { inner: number; outer: number } | null;
  };
  atmosphere: {
    present: boolean;
    scattering: Scattering;
    /** Shell height, fraction of radius. */
    thickness: number;
    terminatorSoftness: number;
    label: string;
  };
  clouds: {
    coverage: number;
    colourKey: "water" | "sulphuric" | "ammonia" | "methaneIce";
    /** Locked: clouds pile up over the substellar point (Yang, Cowan & Abbot 2013). */
    substellarDeck: boolean;
    /** Display rad/s relative to the surface, so clouds visibly drift. */
    driftRate: number;
  };
  /** Vegetation is drawn only when canon says something photosynthesises. */
  life: boolean;
  cityLights: boolean;
  rings: { inner: number; outer: number; material: "ice" | "silicate" } | null;
  seed: number;
  /** Everything this render inferred rather than read. Shown, never stored. */
  notes: string[];
}

const EARTH_ROTATION_H = 23.934;
const DEFAULT_AGE_GYR = 4.5;
/** One display revolution per ~90 s: slow enough to read, never a spinner. */
const DISPLAY_SPIN = (2 * Math.PI) / 90;

const finite = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Grey IR opacity when canon gives none. Earth's 255 K → 288 K needs τ ≈ 0.84
 * (Catling & Kasting 2017 §2.5). Scaled with pressure, and more steeply for
 * CO₂ and CH₄ (pressure-broadened absorbers): Venus' 92 bar of CO₂ lands near
 * its observed 735 K. A render choice, labelled as one; it is never a fact.
 */
export function inferredGreenhouseTau(pressureBar: number, composition: string | null): number {
  if (!(pressureBar > 0)) return 0;
  const mix = parseGasMix(composition);
  const f = mix.fractions;
  const boost = 1 + 1.5 * (f.CO2 ?? 0) + 2 * (f.CH4 ?? 0) + 1 * (f.H2O ?? 0);
  return 0.84 * pressureBar * boost;
}

/**
 * Annual-mean insolation by latitude, the second-Legendre fit
 * s(x) = 1 + s₂·P₂(x), x = sin(lat), s₂ = −(5/8)·P₂(cos β) for obliquity β
 * (Ward 1974; North, Cahalan & Coakley 1981, Rev. Geophys. 19:91, eq. 9).
 * Earth (β 23.4°): s₂ = −0.477.
 */
export function annualInsolationShape(latDeg: number, obliquityDeg: number): number {
  const p2 = (u: number) => (3 * u * u - 1) / 2;
  const s2 = -(5 / 8) * p2(Math.cos((obliquityDeg * Math.PI) / 180));
  return 1 + s2 * p2(Math.sin((latDeg * Math.PI) / 180));
}

/**
 * Meridional diffusion coefficient, W m⁻² K⁻¹. Earth's D⊕ = 0.649 (North et
 * al. 1981), scaled after Williams & Kasting 1997 (Icarus 129:254, eq. 4):
 * D ∝ (p/p⊕)(μ⊕/μ)²(Ω⊕/Ω)². Faster rotation confines heat to its latitude.
 */
export function diffusionCoefficient(pressureBar: number, muGmol: number, rotationHours: number): number {
  if (!(pressureBar > 0)) return 0;
  const omegaRatio = EARTH_ROTATION_H / Math.max(Math.abs(rotationHours), 1);
  return 0.649 * pressureBar * (28.97 / Math.max(muGmol, 1)) ** 2 / omegaRatio ** 2;
}

function meanMolecularMass(composition: string | null): number {
  const mus: Record<string, number> = { N2: 28.01, O2: 32, Ar: 39.95, CO2: 44.01, CH4: 16.04, H2: 2.016, He: 4.003, H2O: 18.02, SO2: 64.07, NH3: 17.03 };
  const mix = parseGasMix(composition);
  if (!mix.recognised) return 28.97;
  return Object.entries(mix.fractions).reduce((s, [k, f]) => s + (mus[k] ?? 28.97) * (f ?? 0), 0);
}

export function sudarskyClass(teqK: number): SudarskyClass {
  if (teqK < 150) return "I";
  if (teqK < 350) return "II";
  if (teqK < 850) return "III";
  if (teqK < 1400) return "IV";
  return "V";
}

/** Water-ice snow line in a disc around a star: ~2.7 AU × √L (Hayashi 1981). */
export function snowLineAU(luminosityLsun: number): number {
  return 2.7 * Math.sqrt(Math.max(luminosityLsun, 1e-6));
}

export function bindPlanetScene(f: PlanetSceneFacts): PlanetSceneBinding {
  const notes: string[] = [];
  const note = (s: string) => notes.push(s);

  // -- Star ----------------------------------------------------------------
  const row = f.spectralClass ? starFromSpectralType(f.spectralClass) : null;
  const fromMass = finite(f.starMassMsun) ? mainSequenceStar(f.starMassMsun) : null;
  let teff: number;
  if (finite(f.starTeffK)) teff = f.starTeffK;
  else if (row) {
    teff = row.teff;
    note(`Star temperature taken from the main-sequence row for ${row.spt}.`);
  } else if (fromMass) {
    teff = fromMass.teff;
    note("Star temperature taken from its mass on the main sequence.");
  } else {
    const k = spectralClassKelvin(f.spectralClass);
    teff = k ?? 5772;
    note(k ? `Star temperature taken from its class ${f.spectralClass}.` : "No star set; lit as a Sun-like G2 star.");
  }
  const lum = finite(f.starLuminosityLsun)
    ? f.starLuminosityLsun
    : row?.luminosity ?? fromMass?.luminosity ?? mainSequenceStar(1).luminosity;
  if (!finite(f.starLuminosityLsun)) note("Star luminosity derived from the main sequence.");
  const rStar = finite(f.starRadiusRsun) ? f.starRadiusRsun : radiusFromLuminosityTeff(lum, teff);
  const mStar = finite(f.starMassMsun) ? f.starMassMsun : row?.mass ?? 1;

  // -- Planet bulk ---------------------------------------------------------
  let mass = finite(f.massEarth) ? f.massEarth : null;
  let radius = finite(f.radiusEarth) ? f.radiusEarth : null;
  if (radius === null && mass !== null) {
    radius = radiusFromMass(mass);
    note("Radius estimated from mass (Chen & Kipping 2017).");
  }
  if (mass === null && radius !== null) {
    // Above the Jovian break the relation is flat; a Jupiter mass is the
    // honest middle of everything that size.
    mass = massFromRadius(radius) ?? 318;
    note("Mass estimated from radius (Chen & Kipping 2017).");
  }
  if (mass === null || radius === null) {
    mass = 1;
    radius = 1;
    note("No mass or radius set; drawn at Earth's.");
  }
  const g = surfaceGravityMs2(mass, radius);

  // -- Orbit and insolation ------------------------------------------------
  let a: number;
  if (finite(f.aAU) && f.aAU > 0) a = f.aAU;
  else {
    a = distanceForInsolation(lum, 1);
    note("No orbit set; placed where it receives Earth's insolation.");
  }
  const S = insolation(lum, a);
  const albedo = finite(f.albedo) ? clamp(f.albedo, 0, 1) : 0.3;
  if (!finite(f.albedo)) note("No albedo set; 0.30 assumed.");

  const kind: PlanetKind = radius >= 2.5 ? "gas" : "rocky";
  const teq = equilibriumTemperature(S, albedo, REDISTRIBUTION.FULL);
  const isIceGiant = kind === "gas" && teq < 100 && mass < 60;
  const planetKind: PlanetKind = isIceGiant ? "ice" : kind;

  // -- Atmosphere ----------------------------------------------------------
  const pressure = finite(f.pressureBar) ? Math.max(0, f.pressureBar) : planetKind === "rocky" ? 0 : 1000;
  if (!finite(f.pressureBar)) {
    note(planetKind === "rocky" ? "No atmospheric pressure set; drawn airless." : "Giant planet: drawn with a deep envelope.");
  }
  const composition = f.composition ?? (planetKind === "rocky" ? null : planetKind === "ice" ? "H2 80%, He 17%, CH4 3%" : "H2 86%, He 14%");
  const tau = finite(f.greenhouseTau) ? Math.max(0, f.greenhouseTau) : planetKind === "rocky" ? inferredGreenhouseTau(pressure, composition) : 0;
  if (!finite(f.greenhouseTau) && planetKind === "rocky" && pressure > 0) {
    note("Greenhouse opacity scaled from pressure and composition, calibrated to Earth. A render choice, not a fact.");
  }
  const mu = meanMolecularMass(composition);

  // -- Rotation ------------------------------------------------------------
  let locked: boolean;
  if (f.tidallyLocked !== null) locked = f.tidallyLocked;
  else if (planetKind === "rocky") {
    const tLock = tidalLockTimescaleYears({ aAU: a, starMassMsun: mStar, planetMassEarth: mass, planetRadiusEarth: radius });
    const age = (finite(f.starAgeGyr) ? f.starAgeGyr : DEFAULT_AGE_GYR) * 1e9;
    locked = tLock < age;
    note(
      locked
        ? "Not set in canon; drawn tidally locked because the despin time is shorter than the system's age (Gladman et al. 1996)."
        : "Not set in canon; drawn turning because the despin time exceeds the system's age.",
    );
  } else locked = false;

  const rotationH = finite(f.rotationHours) && f.rotationHours !== 0 ? f.rotationHours : planetKind === "rocky" ? EARTH_ROTATION_H : 10;
  const obliquity = locked ? 0 : finite(f.obliquityDeg) ? f.obliquityDeg : 0;
  if (!locked && !finite(f.obliquityDeg)) note("No axial tilt set; drawn upright.");

  // -- Water ---------------------------------------------------------------
  const liquidPossible = pressure >= WATER_TRIPLE_BAR;
  const boilK = liquidPossible ? waterBoilingPoint(pressure) : Number.POSITIVE_INFINITY;
  let hydro = finite(f.hydrosphere) ? clamp(f.hydrosphere, 0, 1) : 0;
  if (!finite(f.hydrosphere) && planetKind === "rocky") note("No hydrosphere set; drawn dry.");
  if (planetKind !== "rocky") hydro = 0;

  // -- Temperature field ---------------------------------------------------
  const radiusM = radius * R_EARTH_M;
  const epsilon = locked
    ? redistributionEfficiency({ pressureBar: pressure, gravityMs2: g, radiusM, temperatureK: teq })
    : 0;
  const internal = 35; // geothermal floor: Earth's flux, (F/σ)^¼ (Davies & Davies 2010)
  let at: (lat: number, lon: number) => number;
  let tMean: number;
  let tMin: number;
  let tMax: number;
  let bandDeg: PlanetSceneBinding["water"]["bandDeg"] = null;
  if (planetKind !== "rocky") {
    // Giants: the visible cloud deck sits near Teq; latitudinal contrast is
    // tiny because the deep interior redistributes (Ingersoll 1990).
    tMean = teq;
    at = () => teq;
    tMin = tMax = teq;
  } else if (locked) {
    at = (lat, lon) => {
      const c = Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180);
      const theta = (Math.acos(clamp(c, -1, 1)) * 180) / Math.PI;
      return lockedSurfaceTemperature(S, albedo, epsilon, theta, tau, internal);
    };
    const h = lockedHemispheres(S, albedo, epsilon, tau, internal);
    tMean = ((h.day ** 4 + h.night ** 4) / 2) ** 0.25;
    tMax = h.substellar;
    tMin = lockedSurfaceTemperature(S, albedo, epsilon, 180, tau, internal);
    const band = liquidWaterBand({ sEarth: S, albedo, epsilon, pressureBar: pressure, radiusKm: radiusM / 1000, tau, internalK: internal, stepDeg: 1 });
    if (band.innerDeg !== null && band.outerDeg !== null) bandDeg = { inner: band.innerDeg, outer: band.outerDeg };
  } else {
    // Linear energy-balance model (North et al. 1981): T(x) = T₀ + T₂·P₂(x),
    // T₂ = Q(1−A)·s₂ / (B + 6D), B the linearised outgoing-flux slope at T₀.
    //
    // On a world with water, B is the EMPIRICAL slope (2.09 W m⁻² K⁻¹ for
    // Earth, North et al. 1981) rather than the grey no-feedback 4σT³/(1+¾τ)
    // (≈3.3 for Earth): the 0.63 ratio between them is the water-vapour and
    // lapse-rate feedback, which a dry world does not have.
    //
    // Ice–albedo feedback (North 1975, J. Atmos. Sci. 32:2033): where the
    // annual mean falls below freezing, perennial ice raises the local
    // albedo to 0.62 and the latitude cools by Q·s(x)·Δα / (B + 2D), the
    // local radiative-plus-diffusive response. One step, not iterated: the
    // ice line it draws is the one the EBM puts there, without its
    // hysteresis.
    const greenhouse = greenhouseMultiplier(tau);
    const wet = hydro > 0 && liquidPossible;
    const Q = (S * S_EARTH_WM2) / 4;
    const T0 = ((Q * (1 - albedo) / SIGMA_SB) * greenhouse + internal ** 4) ** 0.25;
    const B = ((4 * SIGMA_SB * T0 ** 3) / greenhouse) * (wet ? 0.63 : 1);
    const D = diffusionCoefficient(pressure, mu, rotationH);
    const p2 = (u: number) => (3 * u * u - 1) / 2;
    const s2 = -(5 / 8) * p2(Math.cos((obliquity * Math.PI) / 180));
    const T2 = (Q * (1 - albedo) * s2) / (B + 6 * D);
    const ICE_ALBEDO = 0.62;
    at = (lat) => {
      const x = Math.sin((lat * Math.PI) / 180);
      let T = T0 + T2 * p2(x);
      if (wet && ICE_ALBEDO > albedo) {
        const w = Math.min(1, Math.max(0, (278 - T) / 10));
        T -= (w * Q * (1 + s2 * p2(x)) * (ICE_ALBEDO - albedo)) / (B + 2 * D);
      }
      return Math.max(internal, T);
    };
    tMean = T0;
    tMax = Math.max(at(0, 0), at(90, 0));
    tMin = Math.min(at(0, 0), at(90, 0));
  }

  // -- Scattering ----------------------------------------------------------
  const hue = blackbodyHue(teff);
  const light = adaptedLight(hue);
  const sc = scattering({ composition, pressureBar: planetKind === "rocky" ? pressure : Math.min(pressure, 5), gravityMs2: g, starColour: light });
  if (pressure > 0 && f.composition === null && planetKind === "rocky") {
    note("No composition set; the sky is coloured as nitrogen–oxygen air.");
  }

  // -- Clouds --------------------------------------------------------------
  const mix = parseGasMix(composition).fractions;
  const anyLiquid = liquidPossible && hydro > 0 && tMax > 273.15;
  const venusDeck = planetKind === "rocky" && pressure >= 10 && tMean > 400 && (mix.CO2 ?? 0) > 0.5;
  let coverage: number;
  let colourKey: PlanetSceneBinding["clouds"]["colourKey"] = "water";
  if (planetKind !== "rocky") {
    coverage = 0;
  } else if (venusDeck) {
    coverage = 1;
    colourKey = "sulphuric";
    if (!finite(f.cloudCover)) note("Thick hot CO₂ atmosphere: drawn under a global sulphuric-acid deck, as Venus is.");
  } else if (finite(f.cloudCover)) {
    coverage = clamp(f.cloudCover, 0, 1);
  } else if (anyLiquid && pressure > 0.05) {
    // Cloud comes from evaporation, so it scales with OPEN water: the ocean
    // fraction times the share of the surface warm enough to keep it liquid
    // (area-weighted: dA ∝ d(sin lat), or ∝ d(cos θ) from the substellar
    // point). Earth: 0.2 + 0.65 × ~0.6 ≈ 0.6 against an observed ~0.67
    // (King et al. 2013, IEEE TGRS 51:3826). An eyeball world, open only
    // under its star, stays mostly clear.
    let warm = 0;
    const N = 90;
    for (let i = 0; i < N; i++) {
      const u = -1 + (2 * (i + 0.5)) / N; // sin(lat), or cos(θ) when locked
      const deg = (Math.asin(u) * 180) / Math.PI;
      const T = locked ? at(0, 90 - deg) : at(deg, 0);
      if (T >= 263 && T < boilK) warm += 1 / N;
    }
    coverage = clamp(0.2 + 0.65 * hydro * warm, 0, 0.85);
    note("Cloud cover estimated from the area of open water.");
  } else coverage = 0;
  if (venusDeck && finite(f.cloudCover)) coverage = Math.max(coverage, clamp(f.cloudCover, 0, 1));

  // -- Rings ---------------------------------------------------------------
  let rings: PlanetSceneBinding["rings"] = null;
  if (f.rings && f.rings.outer > f.rings.inner && f.rings.inner >= 1) {
    rings = { inner: f.rings.inner, outer: f.rings.outer, material: a > snowLineAU(lum) ? "ice" : "silicate" };
  }

  const spinDir = (finite(f.rotationHours) && f.rotationHours < 0) || obliquity > 90 ? -1 : 1;

  return {
    name: f.name ?? "Unnamed world",
    kind: planetKind,
    sudarsky: planetKind === "gas" ? sudarskyClass(teq) : null,
    star: {
      teffK: teff,
      luminosityLsun: lum,
      radiusRsun: rStar,
      massMsun: mStar,
      spectralClass: f.spectralClass ?? row?.spt ?? fromMass?.spt ?? null,
      hue,
      light,
      limbDarkening: limbDarkening(teff),
      angularRadius: (rStar * R_SUN_M) / (a * AU_M),
    },
    aAU: a,
    insolation: S,
    massEarth: mass,
    radiusEarth: radius,
    gravityMs2: g,
    albedo,
    pressureBar: pressure,
    greenhouseTau: tau,
    epsilon,
    tidallyLocked: locked,
    tilt: (obliquity * Math.PI) / 180,
    spinRate: locked ? 0 : spinDir * DISPLAY_SPIN,
    rotationHours: Math.abs(rotationH),
    temperature: { equilibrium: teq, mean: tMean, min: tMin, max: tMax, at },
    water: { fraction: hydro, freezeK: 273.15, seaIceK: 263, boilK, liquidPossible, bandDeg },
    atmosphere: {
      present: sc.present,
      scattering: sc,
      thickness: planetKind === "rocky" ? rimThickness(pressure) : 0.02,
      terminatorSoftness: planetKind === "rocky" ? terminatorSoftness(pressure) : 0.35,
      label: composition ?? "none",
    },
    clouds: {
      coverage,
      colourKey,
      substellarDeck: locked && coverage > 0 && !venusDeck,
      driftRate: locked ? 0 : spinDir * DISPLAY_SPIN * 0.18,
    },
    life: f.life === true && planetKind === "rocky",
    cityLights: f.civilisation === true && planetKind === "rocky",
    rings,
    seed: f.seed,
    notes,
  };
}
