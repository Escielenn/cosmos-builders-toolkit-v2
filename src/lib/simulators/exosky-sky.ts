// ---------------------------------------------------------------------------
// exosky-sky, the sky from one place at one moment (1.9, N1 / N2 / N6 / E6).
//
// Takes a resolved vantage (where the observer is, what their planet does)
// plus the writer's controls (latitude, time of day, date, epoch) and returns
// everything the renderer and the readouts need: the display frame, the host
// star, the other bodies, the catalogue as seen from here, and the derived
// navigation and calendar facts. Pure; the tests drive it with Earth.
// ---------------------------------------------------------------------------

import {
  DEG,
  RAD,
  AU_KM,
  OWN_STAR_PC,
  EARTH_POLE,
  EARTH_ORBIT_NORMAL,
  angularDiameterDeg,
  angularSeparation,
  apparentMagAtAu,
  conventionalOrbitNormal,
  cross3,
  dot3,
  horizonFrame,
  hostStarDirection,
  illuminatedFraction,
  norm3,
  planetEquatorialFrame,
  planetRaDec,
  precessedPole,
  reflectedMagnitude,
  rotateAbout,
  siderealForSolarTime,
  solarDayLength,
  solarPrecessionPeriodYears,
  toFrame,
  unitFromRaDec,
  altAz,
  airmass,
  type Frame3,
  type Vec3,
} from "@/lib/simulators/astro";
import type { CatalogueStar } from "@/lib/simulators/exosky-catalogue";
import type { OrbitingBody } from "@/lib/simulators/exosky-systems";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** Where a value came from, shown beside it (Law II: provenance up). */
export type Source = "canon" | "preset" | "handoff" | "catalogue" | "writer" | "default" | "derived";

export interface Sourced<T> {
  value: T;
  source: Source;
  /** Short reason, e.g. "Earth's axis direction (not set)". */
  note?: string;
}

export interface ResolvedVantage {
  label: string;
  hostName: string;
  /** Heliocentric J2000 position, pc. Null: the system is not placed yet. */
  position: Sourced<Vec3> | null;
  /** HYG id of the host when it is a catalogue star. */
  hostId: string | null;
  host: {
    absMag: Sourced<number>;
    teffK: Sourced<number>;
    lumSolar: Sourced<number>;
    massSolar: Sourced<number>;
  };
  planet: {
    au: Sourced<number>;
    orbitDays: Sourced<number>;
    rotationHours: Sourced<number>;
    obliquityDeg: Sourced<number>;
    tidallyLocked: Sourced<boolean>;
    pole: Sourced<{ ra: number; dec: number }>;
    precessionYears: Sourced<number>;
    albedo: Sourced<number>;
  };
  /** Other planets of the same star. */
  siblings: OrbitingBody[];
  /** Moons of the observer's planet. */
  moons: OrbitingBody[];
  /** Earth's real orbit normal and equinox: only for the Earth vantage. */
  isEarth: boolean;
  /** Days since J2000 that "date 0" means (Earth: J2000). */
  hostLongitude0: number;
}

export interface SkyControls {
  /** Observer latitude, deg. */
  latitude: number;
  /** Local solar time, fraction of a solar day (0.5 = noon). Locked planets: longitude from the substellar point instead. */
  timeOfDay: number;
  /** Tidally locked planets: degrees east of the substellar point. */
  substellarLongitude: number;
  /** Days since the date origin (J2000 for Earth). */
  dayNumber: number;
  /** Years from J2000, drives precession. */
  epochYears: number;
}

// ---------------------------------------------------------------------------
// Geometry of the planet
// ---------------------------------------------------------------------------

export interface PlanetGeometry {
  pole: Vec3;
  orbitNormal: Vec3;
  eqFrame: Frame3;
  /** Host star's orbital longitude from the planet's equinox, deg. */
  sunLongitude: number;
  hostDir: Vec3;
  hostRaDec: { ra: number; dec: number };
  sidereal: number;
  horizon: Frame3;
  solarDayHours: number;
}

/** Pole and orbit normal at J2000, before precession. */
export function poleAndNormal(v: ResolvedVantage): { pole: Vec3; normal: Vec3 } {
  if (v.isEarth) return { pole: EARTH_POLE, normal: EARTH_ORBIT_NORMAL };
  const pole = unitFromRaDec(v.planet.pole.value.ra, v.planet.pole.value.dec);
  const ob = v.planet.tidallyLocked.value ? 0 : v.planet.obliquityDeg.value;
  return { pole, normal: conventionalOrbitNormal(pole, ob) };
}

export function planetGeometry(v: ResolvedVantage, c: SkyControls): PlanetGeometry {
  const { pole: pole0, normal } = poleAndNormal(v);
  const pole = precessedPole(pole0, normal, v.planet.precessionYears.value, c.epochYears);
  const eqFrame = planetEquatorialFrame(pole, normal);
  const orbitDays = v.planet.orbitDays.value;
  const sunLongitude = (((v.hostLongitude0 + (360 * c.dayNumber) / orbitDays) % 360) + 360) % 360;
  const hostDir = hostStarDirection(eqFrame, normal, sunLongitude);
  const hostRaDec = planetRaDec(eqFrame, hostDir);
  const locked = v.planet.tidallyLocked.value;
  // Locked: the substellar point is fixed on the ground, so the sidereal
  // angle follows the star; a place is a longitude from it, not a time.
  const sidereal = locked
    ? (((hostRaDec.ra + c.substellarLongitude) % 360) + 360) % 360
    : siderealForSolarTime(hostRaDec.ra, c.timeOfDay);
  const horizon = horizonFrame(eqFrame, c.latitude, sidereal);
  const solarDayHours = locked
    ? Infinity
    : solarDayLength(v.planet.rotationHours.value, orbitDays * 24);
  return { pole, orbitNormal: normal, eqFrame, sunLongitude, hostDir, hostRaDec, sidereal, horizon, solarDayHours };
}

// ---------------------------------------------------------------------------
// The catalogue from here
// ---------------------------------------------------------------------------

export interface ObservedStars {
  /** Catalogue index per entry, sorted brightest first from this vantage. */
  index: Int32Array;
  /** Unit vectors (J2000) from the observer, per catalogue index. */
  ux: Float32Array;
  uy: Float32Array;
  uz: Float32Array;
  /** Apparent V magnitude from the observer, per catalogue index (NaN = own star). */
  mag: Float32Array;
  /** Distance from the observer, pc. */
  dist: Float32Array;
  /** Catalogue index of the observer's own star, if it is in the catalogue. */
  ownStar: number;
  /** Naked-eye (V <= 6.5) count, no atmosphere. Earth backdrop never counted (E6). */
  nakedEye: number;
  /** Observer's distance from the Sun, pc. */
  observerFromSunPc: number;
}

export const NAKED_EYE_LIMIT = 6.5;

/**
 * Translate every catalogue star to the observer (the whole of ExoSky in one
 * loop) and recompute direction and brightness. A star within OWN_STAR_PC of
 * the observer is the observer's own sun: it is excluded here and drawn as
 * the host disc instead (E2: 1.8 drew it as a phantom point at RA 0, Dec 0,
 * magnitude -26.7).
 */
export function observeCatalogue(stars: readonly CatalogueStar[], observer: Vec3, magLimit = 8): ObservedStars {
  const n = stars.length;
  const ux = new Float32Array(n), uy = new Float32Array(n), uz = new Float32Array(n);
  const mag = new Float32Array(n), dist = new Float32Array(n);
  let ownStar = -1;
  let ownD = OWN_STAR_PC;
  const keep: number[] = [];
  let nakedEye = 0;
  for (let i = 0; i < n; i++) {
    const s = stars[i];
    const dx = s.x - observer[0], dy = s.y - observer[1], dz = s.z - observer[2];
    const d = Math.hypot(dx, dy, dz);
    dist[i] = d;
    if (d < ownD) {
      if (ownStar >= 0) mag[ownStar] = NaN;
      ownStar = i;
      ownD = d;
      mag[i] = NaN;
      continue;
    }
    if (d < OWN_STAR_PC) { mag[i] = NaN; continue; }
    ux[i] = dx / d; uy[i] = dy / d; uz[i] = dz / d;
    const m = s.absMag + 5 * Math.log10(d / 10);
    mag[i] = m;
    if (m <= NAKED_EYE_LIMIT) nakedEye++;
    if (m <= magLimit) keep.push(i);
  }
  const filtered = keep.filter((i) => i !== ownStar);
  filtered.sort((a, b) => mag[a] - mag[b]);
  return {
    index: Int32Array.from(filtered),
    ux, uy, uz, mag, dist, ownStar, nakedEye,
    observerFromSunPc: Math.hypot(observer[0], observer[1], observer[2]),
  };
}

/**
 * How far the catalogue can be trusted from here. It holds every star within
 * 100 pc of the Sun plus anything naked-eye from Earth; an observer d pc from
 * the Sun therefore sees every neighbour within (100 - d) pc, and beyond that
 * only stars luminous enough to have been seen from Earth.
 */
export function catalogueReach(observerFromSunPc: number): { completePc: number; complete: boolean } {
  const completePc = Math.max(0, 100 - observerFromSunPc);
  return { completePc, complete: completePc >= 20 };
}

// ---------------------------------------------------------------------------
// Bodies: host star, siblings, moons (N2)
// ---------------------------------------------------------------------------

export interface SkyBody {
  id: string;
  name: string;
  kind: "host" | "planet" | "moon";
  dir: Vec3;
  mag: number;
  /** Angular diameter, deg. */
  sizeDeg: number;
  /** Illuminated fraction 0..1 (1 for the host). */
  phase: number;
  /** Distance from observer, km. */
  distKm: number;
  source: string;
}

function orbitBasis(g: PlanetGeometry): { e1: Vec3; q: Vec3 } {
  const e1 = g.eqFrame[0];
  return { e1, q: norm3(cross3(g.orbitNormal, e1)) };
}

/**
 * Host, siblings and moons as seen from the planet on `dayNumber`.
 *
 * Orbits are circular and share the planet's orbital plane: positions follow
 * Kepler's third law from the stated period and a starting longitude. For the
 * Solar System those longitudes are real (J2000); for a writer's world they
 * are not known, so they come from the body's id and the readout says so.
 */
export function skyBodies(v: ResolvedVantage, g: PlanetGeometry, c: SkyControls, hostRadiusSolar: number): SkyBody[] {
  const out: SkyBody[] = [];
  const au = v.planet.au.value;
  const absMag = v.host.absMag.value;
  if (au > 0 && Number.isFinite(au)) {
    out.push({
      id: v.hostId ?? "host",
      name: v.hostName,
      kind: "host",
      dir: g.hostDir,
      mag: apparentMagAtAu(absMag, au),
      sizeDeg: angularDiameterDeg(hostRadiusSolar * 695700, au * AU_KM),
      phase: 1,
      distKm: au * AU_KM,
      source: v.host.absMag.source === "catalogue" ? "HYG v4.1 magnitude" : "luminosity, no bolometric correction",
    });
  }
  const { e1, q } = orbitBasis(g);
  const inPlane = (lonDeg: number, r: number): Vec3 => {
    const l = lonDeg * DEG;
    return [r * (Math.cos(l) * e1[0] + Math.sin(l) * q[0]), r * (Math.cos(l) * e1[1] + Math.sin(l) * q[1]), r * (Math.cos(l) * e1[2] + Math.sin(l) * q[2])];
  };
  // Observer's planet, star-centred, in AU: opposite the sun's direction.
  const obs: Vec3 = [-g.hostDir[0] * au, -g.hostDir[1] * au, -g.hostDir[2] * au];
  for (const b of v.siblings) {
    const lon = b.longitude0 + (360 * c.dayNumber) / b.periodDays;
    const p = inPlane(lon, b.au);
    const rel: Vec3 = [p[0] - obs[0], p[1] - obs[1], p[2] - obs[2]];
    const dAu = Math.hypot(...rel);
    if (dAu < 1e-6) continue;
    const dir = norm3(rel);
    // Phase angle at the body, between the star and the observer.
    const toStar = norm3([-p[0], -p[1], -p[2]]);
    const toObs = norm3([-rel[0], -rel[1], -rel[2]]);
    const alpha = Math.acos(Math.max(-1, Math.min(1, dot3(toStar, toObs)))) * RAD;
    out.push({
      id: b.id, name: b.name, kind: "planet", dir,
      mag: reflectedMagnitude({ starAbsMag: absMag, starBodyAu: b.au, observerBodyKm: dAu * AU_KM, radiusKm: b.radiusKm, albedo: b.albedo, phaseAngleDeg: alpha }),
      sizeDeg: angularDiameterDeg(b.radiusKm, dAu * AU_KM),
      phase: illuminatedFraction(alpha),
      distKm: dAu * AU_KM,
      source: b.source,
    });
  }
  for (const m of v.moons) {
    const lon = m.longitude0 + (360 * c.dayNumber) / m.periodDays;
    const dir = norm3(inPlane(lon, 1));
    // Moon's phase angle ≈ 180° minus its elongation from the star.
    const elong = Math.acos(Math.max(-1, Math.min(1, dot3(dir, g.hostDir)))) * RAD;
    const alpha = 180 - elong;
    const dKm = m.au * AU_KM;
    out.push({
      id: m.id, name: m.name, kind: "moon", dir,
      mag: reflectedMagnitude({ starAbsMag: absMag, starBodyAu: au, observerBodyKm: dKm, radiusKm: m.radiusKm, albedo: m.albedo, phaseAngleDeg: alpha }),
      sizeDeg: angularDiameterDeg(m.radiusKm, dKm),
      phase: illuminatedFraction(alpha),
      distKm: dKm,
      source: m.source,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Navigation and calendar readouts (N6)
// ---------------------------------------------------------------------------

export interface PoleStar {
  index: number;
  separationDeg: number;
  mag: number;
}

/**
 * The pole star: the brightest naked-eye star within 5° of the pole (Polaris
 * is 0.7° from Earth's; Thuban, 4,800 years ago, came within 0.1°). Returns
 * null when nothing qualifies, which is an answer: no star to steer by.
 */
export function findPoleStar(obs: ObservedStars, pole: Vec3, radiusDeg = 5, magLimit = 4.5): PoleStar | null {
  const cosR = Math.cos(radiusDeg * DEG);
  let best: PoleStar | null = null;
  for (let k = 0; k < obs.index.length; k++) {
    const i = obs.index[k];
    const m = obs.mag[i];
    if (m > magLimit) break; // sorted brightest first
    const c = obs.ux[i] * pole[0] + obs.uy[i] * pole[1] + obs.uz[i] * pole[2];
    if (c >= cosR) {
      const sep = Math.acos(Math.min(1, c)) * RAD;
      if (!best || m < best.mag) best = { index: i, separationDeg: sep, mag: m };
    }
  }
  return best;
}

/**
 * Circumpolar sky at latitude φ: the cap within |φ| of the visible pole never
 * sets. Fraction of the whole sphere = (1 - cos φ) / 2; of naked-eye stars,
 * counted.
 */
export function circumpolar(obs: ObservedStars, pole: Vec3, latitudeDeg: number): { skyFraction: number; starFraction: number } {
  const phi = Math.abs(latitudeDeg) * DEG;
  const skyFraction = (1 - Math.cos(phi)) / 2;
  const visiblePole: Vec3 = latitudeDeg >= 0 ? pole : [-pole[0], -pole[1], -pole[2]];
  const cosCap = Math.cos(phi);
  let total = 0, inCap = 0;
  for (let k = 0; k < obs.index.length; k++) {
    const i = obs.index[k];
    if (obs.mag[i] > NAKED_EYE_LIMIT) break;
    total++;
    const c = obs.ux[i] * visiblePole[0] + obs.uy[i] * visiblePole[1] + obs.uz[i] * visiblePole[2];
    // Within |φ| of the visible pole: never sets.
    if (phi > 0 && c >= cosCap) inCap++;
  }
  return { skyFraction, starFraction: total ? inCap / total : 0 };
}

/** Synodic month: 1 / (1/P_moon - 1/P_orbit), days. Earth: 29.53. */
export function synodicMonthDays(moonPeriodDays: number, orbitDays: number): number {
  return solarDayLength(moonPeriodDays, orbitDays);
}

/**
 * Arcus visionis rule of thumb: the host star must be at least 10° below the
 * horizon for a first-magnitude star to be seen rising, one degree more per
 * magnitude fainter. A convention, labelled as such; Schaefer (1985, 1987)
 * models it properly with sky brightness and extinction.
 */
export function arcusVisionisDeg(mag: number): number {
  return 10 + Math.max(0, mag - 1);
}

export interface HeliacalRising {
  /** Day of the local year (0 = date origin) on which it first shows at dawn. */
  dayOfYear: number;
  /** Sun's orbital longitude then, deg. */
  sunLongitude: number;
}

/**
 * Heliacal rising: the first dawn after its spell lost in the sun's glare on
 * which a star is seen rising before the sun. Scanned over two orbits in steps
 * of 1/720 of the year (the first orbit finds where the star is lost). Null for a star that never sets or
 * never rises at this latitude, and for a tidally locked world (no dawn).
 */
export function heliacalRising(
  v: ResolvedVantage,
  c: SkyControls,
  starDir: Vec3,
  starMag: number,
): HeliacalRising | null {
  if (v.planet.tidallyLocked.value) return null;
  const steps = 720;
  const orbitDays = v.planet.orbitDays.value;
  const av = arcusVisionisDeg(starMag);
  const h = 2 * DEG; // star must clear 2° to be seen through the murk
  const phi = c.latitude * DEG;
  let prevVisible: boolean | null = null;
  let first: HeliacalRising | null = null;
  for (let k = 0; k <= steps * 2 && !first; k++) {
    const day = c.dayNumber + k * (orbitDays / steps);
    const g = planetGeometry(v, { ...c, dayNumber: day });
    const { ra, dec } = planetRaDec(g.eqFrame, starDir);
    const d = dec * DEG;
    const cosH = (Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));
    if (cosH <= -1 || cosH >= 1) return null; // circumpolar or never rises
    const H = -Math.acos(cosH); // rising: east of the meridian
    const theta = ra * DEG + H;
    const hs = theta - g.hostRaDec.ra * DEG;
    const ds = g.hostRaDec.dec * DEG;
    const sunAlt = Math.asin(Math.sin(phi) * Math.sin(ds) + Math.cos(phi) * Math.cos(ds) * Math.cos(hs)) * RAD;
    const visible = sunAlt <= -av;
    if (prevVisible === false && visible) {
      first = { dayOfYear: ((day - c.dayNumber) % orbitDays + orbitDays) % orbitDays, sunLongitude: g.sunLongitude };
    }
    prevVisible = visible;
  }
  return first;
}

/** Altitude of a direction and the magnitudes the atmosphere takes from it there. */
export function atmosphericLoss(horizon: Frame3, dir: Vec3, k: number): { alt: number; az: number; lossMag: number } {
  const { alt, az } = altAz(horizon, dir);
  return { alt, az, lossMag: k > 0 ? k * airmass(alt) : 0 };
}

// ---------------------------------------------------------------------------
// Precession of the planet's own pole (N5)
// ---------------------------------------------------------------------------

/**
 * Angle the pole moves between two epochs: it slides along a cone of
 * half-angle ε about the orbit normal, so a turn of Δφ moves it by
 * 2 asin(sin ε sin(Δφ/2)).
 */
export function poleDriftDeg(obliquityDeg: number, periodYears: number, fromYears: number, toYears: number): number {
  if (!(periodYears > 0) || !Number.isFinite(periodYears)) return 0;
  const dphi = ((toYears - fromYears) / periodYears) * 2 * Math.PI;
  return 2 * Math.asin(Math.min(1, Math.abs(Math.sin(obliquityDeg * DEG) * Math.sin(dphi / 2)))) * RAD;
}

/** Default precession period: Earth's measured value, or the solar-torque estimate. */
export function defaultPrecessionYears(isEarth: boolean, rotationHours: number, orbitDays: number, obliquityDeg: number): number {
  if (isEarth) return 25772;
  return solarPrecessionPeriodYears(rotationHours, orbitDays, obliquityDeg);
}

export { angularSeparation, rotateAbout, toFrame };
