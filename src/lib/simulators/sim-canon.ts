// ---------------------------------------------------------------------------
// sim-canon, the numbers a simulator run puts on the Canon Graph.
//
// simulation-facts.ts turns a save into DISPLAY rows ("1.00 g, heavy going").
// That is right for the rail and wrong for canon: a scene cannot cite a
// sentence, and two tools cannot agree on a string. This module reads the same
// payloads and returns typed FactValues on vocabulary predicates, in the units
// the vocabulary declares, so a publish can go through canon.assert with
// provenance (1.9 audit X6, X7).
//
// Rules this file keeps (08-VOCABULARY "Simulators are never second
// producers"; 1.9 brief contract with the sim lanes):
//   - Only inputs and quantities the sim computes exactly. Derived quantities
//     with a single owner (planet.surface_gravity, density, escape velocity:
//     Atlas; system.hz_inner/outer: Goldilocks) are NOT emitted here. The
//     publish runs the owner's registered derivation over the published
//     inputs, so there is one formula and one producer.
//   - Units are explicit and documented per sim against its CURRENT payload
//     (golden tests in src/lib/__tests__/sim-canon.test.ts):
//       Tidelock  orbPeriod DAYS, ocean 0-100 %, atmDens atm (≈bar), temps K
//       ExoForge  period DAYS, ocean/cloud 0-100 %, atmo bar, temp K,
//                 composition 0-100 (% gas), rotation = visual spin (EPHEMERAL)
//       Solaris   sf2System (lane S, 1.9): periods in days or years as keyed,
//                 luminosity L☉, mass M☉, Teff K, a AU
//       Rogue     host system presets only; aftermath is a Chronicle event
//   - Anything a sim posts that is neither a fact nor a decoration is listed
//     in `ephemeral`, so Law I ("fact or explicitly ephemeral") is checkable.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import type { FactValue } from "@/canon/types";
import type { Unit } from "@/canon/units";
import type { EntryType } from "@/services/world-data";
import { normaliseSpectralClass } from "@/canon/codecs";
import { equilibriumTemperature, stellarFlux } from "@/lib/habitable-zone/calculations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SimCanonFact {
  /** Canonical vocabulary predicate. Never a tool name, never a legacy key. */
  predicate: string;
  value: FactValue;
  unit?: Unit;
  /** Shown in the reviewable diff. */
  label: string;
  /** Display string for the diff and value_text. */
  display: string;
  /**
   * Which entity the fact is about: undefined = the entity being published;
   * otherwise the `key` of one of `children` (a Solaris planet).
   */
  child?: string;
}

export interface SimChildEntity {
  key: string;
  name: string;
  type: EntryType;
}

export interface SimCanon {
  /** The entity type a publish should default to (X8: never "custom" by default). */
  entityType: EntryType;
  facts: SimCanonFact[];
  children: SimChildEntity[];
  /** Payload keys deliberately not published, and why (Law I). */
  ephemeral: { key: string; why: string }[];
  /** Dated events for the Chronicle (Rogue's per-body outcomes), relative to the run. */
  events?: SimEvent[];
  /** Ship's Voice reason the run must not be published (Rogue energy error). */
  refusal?: string;
}

export interface SimEvent {
  title: string;
  description: string;
  /** Years after the run's reference moment (Rogue: launch). */
  offsetYears: number;
  /** The body the event happened to, by name. */
  body: string;
  outcome: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function obj(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

function fin(raw: unknown): number | null {
  const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/** First finite number among several possible keys (sim lanes may add spellings). */
function pick(o: Record<string, unknown> | null, ...keys: string[]): number | null {
  if (!o) return null;
  for (const k of keys) {
    const n = fin(o[k]);
    if (n !== null) return n;
  }
  return null;
}

function round(n: number, sig = 6): number {
  if (n === 0) return 0;
  return Number(n.toPrecision(sig));
}

function fmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) return Math.round(n).toLocaleString("en-US");
  if (a >= 100) return n.toFixed(0);
  if (a >= 10) return n.toFixed(1);
  if (a >= 0.1) return n.toFixed(2);
  return n.toPrecision(2);
}

const SYMBOL: Partial<Record<Unit, string>> = {
  earth_radii: "R⊕",
  earth_masses: "M⊕",
  solar_masses: "M☉",
  solar_lum: "L☉",
  au: "AU",
  K: "K",
  bar: "bar",
  days: "days",
  km2: "km²",
  km: "km",
  earth_flux: "S⊕",
  hours: "h",
  deg: "°",
};

class Collector {
  facts: SimCanonFact[] = [];
  scalar(predicate: string, label: string, n: number | null, unit?: Unit, child?: string) {
    if (n === null) return;
    const v = round(n);
    const sym = unit ? SYMBOL[unit] : undefined;
    const display = unit === "fraction" ? `${Math.round(v * 100)}%` : `${fmt(v)}${sym ? ` ${sym}` : ""}`;
    this.facts.push({
      predicate,
      label,
      value: unit ? { kind: "scalar", value: v, unit } : { kind: "scalar", value: v },
      ...(unit ? { unit } : {}),
      display,
      ...(child ? { child } : {}),
    });
  }
  spectral(raw: string, child?: string) {
    const v = normaliseSpectralClass(raw);
    if (!v) return;
    this.facts.push({
      predicate: "star.spectral_class",
      label: "Spectral class",
      value: { kind: "enum", value: v },
      display: raw,
      ...(child ? { child } : {}),
    });
  }
  bool(predicate: string, label: string, b: boolean | null, child?: string) {
    if (b === null) return;
    this.facts.push({ predicate, label, value: { kind: "bool", value: b }, display: b ? "Yes" : "No", ...(child ? { child } : {}) });
  }
  struct(predicate: string, label: string, schema: string, value: Record<string, unknown>, display: string, child?: string) {
    this.facts.push({ predicate, label, value: { kind: "struct", schema, value }, display, ...(child ? { child } : {}) });
  }
  text(predicate: string, label: string, t: string, child?: string) {
    if (!t) return;
    this.facts.push({ predicate, label, value: { kind: "text", value: t }, display: t, ...(child ? { child } : {}) });
  }
}

/** Earth's mean radius, km (IAU nominal). For habitable_area. */
const EARTH_RADIUS_KM = 6371;

/**
 * Insolation and equilibrium temperature for a planet at `a` AU from a star of
 * `l` L☉, the two numbers 1.9 makes every placing sim publish.
 * S = L / a² (inverse square; Earth = 1). Teq = 278.5 K · L^¼ / √a · (1−A)^¼
 * (habitable-zone/calculations: Earth at A = 0.3 → 255 K).
 */
function placeAroundStar(c: Collector, l: number | null, a: number | null, albedo: number, child?: string) {
  if (l === null || a === null || l <= 0 || a <= 0) return;
  c.scalar("planet.insolation", "Insolation", stellarFlux(l, a), "earth_flux", child);
  c.scalar("planet.temp_equilibrium", "Equilibrium temperature", equilibriumTemperature(l, a, albedo), "K", child);
}

// ---------------------------------------------------------------------------
// Tidelock
// ---------------------------------------------------------------------------

export function tidelockCanon(raw: unknown): SimCanon {
  const out: SimCanon = { entityType: "planet", facts: [], children: [], ephemeral: [] };
  const payload = obj(raw);
  if (!payload) return out;
  const p = obj(payload.parameters) ?? {};
  const r = obj(payload.results) ?? {};
  const c = new Collector();

  c.scalar("planet.mass", "Mass", fin(p.planetMass), "earth_masses");
  c.scalar("planet.radius", "Radius", fin(p.planetRadius), "earth_radii");
  // atmDens is labelled "atm" in the sim; 1 atm = 1.013 bar.
  const atm = fin(p.atmDens);
  c.scalar("planet.atmo_pressure", "Atmospheric pressure", fin(r.pressureBar) ?? (atm === null ? null : atm * 1.01325), "bar");
  const albedo = fin(p.albedo);
  c.scalar("planet.albedo", "Albedo", albedo, "fraction");
  const ocean = fin(p.ocean);
  c.scalar("planet.hydrosphere_fraction", "Hydrosphere fraction", ocean === null ? null : ocean / 100, "fraction");
  c.text("planet.atmo_composition", "Atmospheric composition", str(p.composition));

  const a = fin(p.orbDist);
  c.scalar("orbit.semi_major_axis", "Orbital distance", a, "au");
  c.scalar("orbit.period", "Orbital period", fin(r.orbPeriod), "days");
  // Tidelock's own verdict, recorded as the bool the vocabulary declares.
  const lock = str(r.tidalLock);
  c.bool("orbit.tidally_locked", "Tidally locked", lock ? lock === "Confirmed" || lock === "Likely" : null);

  // The temperature profile is the tool's reason to exist; Tidelock owns
  // planet.temp_gradient[] (08 predicate-level exception).
  const ssp = fin(r.tSSP);
  const term = fin(r.tTerm);
  const asp = fin(r.tASP);
  if (ssp !== null && asp !== null) {
    c.struct(
      "planet.temp_gradient[]",
      "Temperature profile",
      "temp_gradient",
      { substellar_k: round(ssp), terminator_k: term === null ? null : round(term), antistellar_k: round(asp) },
      `${Math.round(ssp)} K day · ${term === null ? "?" : Math.round(term)} K terminator · ${Math.round(asp)} K night`,
    );
  }
  const habPct = fin(r.habPct);
  const radius = fin(p.planetRadius);
  if (habPct !== null && radius !== null) {
    const surface = 4 * Math.PI * (radius * EARTH_RADIUS_KM) ** 2;
    c.scalar("planet.habitable_area", "Habitable area", (habPct / 100) * surface, "km2");
  }

  // Host star, on the planet subject (the published-facts convention open-on
  // reads). Tidelock posts the spectral type; luminosity, mass and Teff only
  // if lane T adds them to the payload.
  c.spectral(str(r.starType));
  const lum = pick(r, "starLum", "starLuminosity", "luminosity");
  c.scalar("star.luminosity", "Stellar luminosity", lum, "solar_lum");
  c.scalar("star.mass", "Stellar mass", pick(r, "starMass"), "solar_masses");
  c.scalar("star.temp_effective", "Effective temperature", pick(r, "starTeff", "starTemp"), "K");
  // 1.9 lane T posts insolation and Teq itself (results.units: S_earth, K);
  // prefer the sim's numbers, compute only for older saves.
  const simS = fin(r.insolation);
  const simTeq = fin(r.teq);
  if (simS !== null || simTeq !== null) {
    c.scalar("planet.insolation", "Insolation", simS, "earth_flux");
    c.scalar("planet.temp_equilibrium", "Equilibrium temperature", simTeq, "K");
  } else {
    placeAroundStar(c, lum, a, albedo ?? 0.3);
  }
  // Tidelock owns the terminator band width (08).
  c.scalar("planet.terminator_band_width", "Terminator band width", fin(r.bandWidthKm), "km");

  out.facts = c.facts;
  out.ephemeral = [
    { key: "showClouds/showHab/showGrid/colorScale", why: "display toggles" },
    { key: "lockHZ", why: "a control mode, not a property of the world" },
    { key: "ghFactor", why: "a model knob; its effect is in the temperature profile" },
    { key: "moonCount", why: "rendering only; moons are entities, not a count" },
    { key: "habStatus/liquidWater/atmRetention", why: "verdicts restated from the temperature profile" },
  ];
  return out;
}

// ---------------------------------------------------------------------------
// ExoForge
// ---------------------------------------------------------------------------

export function exoforgeCanon(raw: unknown): SimCanon {
  const out: SimCanon = { entityType: "planet", facts: [], children: [], ephemeral: [] };
  const payload = obj(raw);
  if (!payload) return out;
  const p = obj(payload.parameters) ?? {};
  const r = obj(payload.results) ?? {};
  const c = new Collector();

  c.scalar("planet.radius", "Radius", fin(p.radius), "earth_radii");
  c.scalar("planet.mass", "Mass", fin(p.mass), "earth_masses");
  // 1.9 lane T: temp is the DERIVED surface temperature, period the derived
  // orbital period in days (results.units). Prefer results where posted.
  c.scalar("planet.temp_mean", "Mean surface temperature", fin(r.surfaceTemp) ?? fin(p.temp), "K");
  c.scalar("orbit.period", "Orbital period", fin(r.periodDays) ?? fin(p.period), "days");
  c.scalar("orbit.semi_major_axis", "Orbital distance", fin(r.orbDistAU) ?? fin(p.orbDistAU), "au");
  c.scalar("planet.insolation", "Insolation", fin(r.insolation), "earth_flux");
  c.scalar("planet.temp_equilibrium", "Equilibrium temperature", fin(r.teq), "K");
  c.scalar("star.luminosity", "Stellar luminosity", fin(r.starLum), "solar_lum");
  c.scalar("star.mass", "Stellar mass", fin(r.starMass) ?? fin(p.starMass), "solar_masses");
  const ocean = fin(p.ocean);
  c.scalar("planet.hydrosphere_fraction", "Hydrosphere fraction", ocean === null ? null : ocean / 100, "fraction");
  c.scalar("planet.atmo_pressure", "Atmospheric pressure", fin(p.atmo), "bar");
  c.scalar("star.temp_effective", "Effective temperature", fin(r.starTeff) ?? fin(p.starTemp), "K");
  const albedoX = fin(p.albedo);
  c.scalar("planet.albedo", "Albedo", albedoX, "fraction");

  // ExoForge owns planet.composition (08 predicate-level exception).
  const comp = fin(p.composition);
  const cls = str(r.classification);
  if (comp !== null || cls) {
    c.struct(
      "planet.composition",
      "Composition",
      "planet_composition",
      { gas_fraction: comp === null ? null : round(comp / 100), classification: cls || null },
      [cls, comp === null ? "" : `${Math.round(comp)}% gas envelope`].filter(Boolean).join(" · "),
    );
  }

  out.facts = c.facts;
  out.ephemeral = [
    { key: "rotation", why: "visual spin multiplier of the globe, not a day length (X2)" },
    { key: "cloud", why: "rendering cover; no vocabulary predicate" },
    { key: "roughness/ringOpacity/ringWidth/ringTilt/ringColor", why: "rendering" },
    { key: "starRadius", why: "rendering size of the star disc" },
    { key: "gravity/density/escapeVelocity", why: "derived by Atlas from mass and radius on publish" },
  ];
  return out;
}

// ---------------------------------------------------------------------------
// Solaris (sf2System, lane S 1.9; read defensively, works before it merges)
// ---------------------------------------------------------------------------

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "planet";
}

/** The sf2System snapshot wherever a save carries it. */
export function findSf2System(payload: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!payload) return null;
  return obj(obj(payload.parameters)?.sf2System) ?? obj(obj(payload.results)?.sf2System) ?? obj(payload.sf2System);
}

/** Orbital period in days from whichever key the payload uses. */
export function periodDays(o: Record<string, unknown>): number | null {
  const d = pick(o, "periodDays", "orbitalPeriodDays", "yearDays");
  if (d !== null) return d;
  const y = pick(o, "periodYears", "orbitalPeriodYears");
  return y === null ? null : y * 365.25;
}

export function solarisCanon(raw: unknown): SimCanon {
  const out: SimCanon = { entityType: "star_system", facts: [], children: [], ephemeral: [] };
  const payload = obj(raw);
  const sys = findSf2System(payload);
  if (!sys) {
    out.ephemeral.push({ key: "parameters", why: "generator settings only; no sf2System snapshot in this save" });
    return out;
  }
  const c = new Collector();

  const stars = (Array.isArray(sys.stars) ? sys.stars : sys.star ? [sys.star] : [])
    .map(obj)
    .filter((s): s is Record<string, unknown> => s !== null);
  const primary = stars[0] ?? null;
  // A multi-star system's luminosity at the planets is the sum (Solaris
  // already does this; the audit confirmed it). Facts about "the star" are
  // the primary's.
  const totalL = stars.reduce((sum, s) => sum + (pick(s, "luminositySOL", "luminosityLsun", "luminosity", "lum") ?? 0), 0) || null;
  if (primary) {
    c.spectral(str(primary.spectralType) || str(primary.spectralClass) || str(primary.classification) || str(primary.type));
    c.scalar("star.luminosity", "Stellar luminosity", pick(primary, "luminositySOL", "luminosityLsun", "luminosity", "lum"), "solar_lum");
    c.scalar("star.mass", "Stellar mass", pick(primary, "massSOL", "massMsun", "mass"), "solar_masses");
    c.scalar("star.temp_effective", "Effective temperature", pick(primary, "temperatureK", "teffK", "teff", "temp"), "K");
  }

  const planets = (Array.isArray(sys.planets) ? sys.planets : [])
    .map(obj)
    .filter((p): p is Record<string, unknown> => p !== null);
  c.scalar("system.body_count", "Bodies in system", stars.length + planets.length || null);

  const seen = new Set<string>();
  planets.forEach((p, i) => {
    const name = str(p.name) || `Planet ${i + 1}`;
    let key = slug(name);
    while (seen.has(key)) key = `${key}-${i + 1}`;
    seen.add(key);
    out.children.push({ key, name, type: "planet" });
    const a = pick(p, "semiMajorAxisAU", "au", "a");
    c.scalar("orbit.semi_major_axis", "Orbital distance", a, "au", key);
    c.scalar("orbit.period", "Orbital period", periodDays(p), "days", key);
    c.scalar("orbit.eccentricity", "Eccentricity", pick(p, "eccentricity", "e"), undefined, key);
    c.scalar("planet.mass", "Mass", pick(p, "massEarth", "massEarths", "mass"), "earth_masses", key);
    c.scalar("planet.radius", "Radius", pick(p, "radiusEarth", "radiusEarths", "radius"), "earth_radii", key);
    c.scalar("planet.obliquity", "Axial tilt", pick(p, "axialTiltDeg", "obliquity"), "deg", key);
    if (typeof p.tidallyLocked === "boolean") c.bool("orbit.tidally_locked", "Tidally locked", p.tidallyLocked, key);
    const albedo = pick(p, "albedo") ?? 0.3;
    // Prefer the sim's own numbers when it posts them; compute otherwise.
    const s = pick(p, "insolation", "insolationEarth", "flux");
    const teq = pick(p, "teqK", "equilibriumTempK", "tEq");
    if (s !== null || teq !== null) {
      c.scalar("planet.insolation", "Insolation", s, "earth_flux", key);
      c.scalar("planet.temp_equilibrium", "Equilibrium temperature", teq, "K", key);
    } else {
      placeAroundStar(c, totalL, a, albedo, key);
    }
    // star.* of the host, on each planet too, so open-on and Goldilocks can
    // read a planet without walking to its system.
    if (primary) {
      c.scalar("star.luminosity", "Stellar luminosity", totalL, "solar_lum", key);
      c.scalar("star.temp_effective", "Effective temperature", pick(primary, "temperatureK", "teffK", "teff", "temp"), "K", key);
      c.scalar("star.mass", "Stellar mass", pick(primary, "massSOL", "massMsun", "mass"), "solar_masses", key);
    }
  });

  out.facts = c.facts;
  out.ephemeral = [
    { key: "starMode/arch/starChoices/spdIdx", why: "generator settings" },
    { key: "planet colours, ring art, render sizes", why: "rendering" },
  ];
  return out;
}

// ---------------------------------------------------------------------------
// Rogue, ExoSky
// ---------------------------------------------------------------------------

/**
 * Rogue stages an encounter. Its host systems are presets (the real Solar
 * System, TRAPPIST-1), so it asserts no planet facts; what it decides is what
 * HAPPENED, per body, at a date on the run's own clock (lane S, R4:
 * results.bodies / results.outcomes and results.epoch). Those become Chronicle
 * events once the writer anchors the encounter in their world's calendar.
 * A run whose relative energy error exceeds the sim's own limit
 * (publishMaxEnergyError, 1e-3) is refused: its outcomes are integration
 * error, not physics.
 */
export function rogueCanon(raw?: unknown): SimCanon {
  const out: SimCanon = {
    entityType: "milestone",
    facts: [],
    children: [],
    ephemeral: [{ key: "intruder settings", why: "the writer's invention, recorded with the run" }],
    events: [],
  };
  const r = obj(obj(raw)?.results);
  if (!r) return out;
  const err = fin(r.energyError);
  const max = fin(r.publishMaxEnergyError) ?? 1e-3;
  if (err !== null && Math.abs(err) > max) {
    out.refusal = `INTEGRATION ERROR ${Math.abs(err).toExponential(1)}, ABOVE ${max.toExponential(0)}. OUTCOMES NOT RELIABLE. LOWER THE TIME SCALE AND RUN AGAIN.`;
  }
  const epoch = obj(r.epoch);
  const at = fin(epoch?.encounterYears) ?? fin(epoch?.elapsedYears) ?? 0;
  const list = (Array.isArray(r.outcomes) ? r.outcomes : Array.isArray(r.bodies) ? r.bodies : [])
    .map(obj)
    .filter((b): b is Record<string, unknown> => b !== null);
  const verb: Record<string, string> = {
    ejected: "is thrown out of the system",
    captured: "is captured by the intruder",
    orbit_changed: "is knocked into a new orbit",
  };
  for (const b of list) {
    const outcome = str(b.outcome) || (b.ejected === true ? "ejected" : b.captured === true ? "captured" : "");
    if (!outcome || outcome === "retained") continue;
    const name = str(b.name) || "A planet";
    const a0 = fin(b.a0);
    const a1 = fin(b.a);
    const e1 = fin(b.e);
    const detail =
      outcome === "ejected"
        ? `Was at ${a0 === null ? "?" : fmt(a0)} AU. Now unbound.`
        : `${a0 === null ? "?" : fmt(a0)} AU before; ${a1 === null ? "?" : fmt(a1)} AU${e1 === null ? "" : `, e ${e1.toFixed(2)}`} after${str(b.boundTo) ? `, bound to ${str(b.boundTo)}` : ""}.`;
    out.events!.push({
      title: `${name} ${verb[outcome] ?? outcome}`,
      description: detail,
      offsetYears: at,
      body: name,
      outcome,
    });
  }
  return out;
}

/**
 * ExoSky's sky.* facts are written by lane E (exosky-save / its manifest). The
 * publish dialog records the run on a planet; it asserts nothing here so there
 * is one producer of planet.sky.*.
 */
export function exoskyCanon(): SimCanon {
  return { entityType: "planet", facts: [], children: [], ephemeral: [] };
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export function simCanon(simulatorType: string, payload: unknown): SimCanon {
  switch (simulatorType) {
    case "tidelock":
      return tidelockCanon(payload);
    case "exoforge":
      return exoforgeCanon(payload);
    case "solaris":
      return solarisCanon(payload);
    case "rogue":
      return rogueCanon(payload);
    case "exosky":
      return exoskyCanon();
    default:
      return { entityType: "custom", facts: [], children: [], ephemeral: [] };
  }
}

/** X8: the entity type a publish from this simulator should default to. */
export function defaultEntityTypeFor(simulatorType: string): EntryType {
  return simCanon(simulatorType, null).entityType;
}

// ---------------------------------------------------------------------------
// Solaris per-planet publish (PublishPlanetDialog): PublishedFact → canon
// ---------------------------------------------------------------------------

const SYMBOL_TO_UNIT: Record<string, Unit> = {
  AU: "au",
  "L☉": "solar_lum",
  "M☉": "solar_masses",
  K: "K",
  "S⊕": "earth_flux",
};

/**
 * The typed half of a Solaris planet publish. Names and the display type
 * (planet.name, system.name, planet.type) are provisional predicates the
 * vocabulary keeps out of canon: they stay on the entity record and its cache.
 * A colour word ("orange") is not a spectral class, so it is not asserted.
 */
export function planetPublishCanon(facts: readonly { predicate: string; label: string; value: number | string; unit?: string }[]): SimCanon {
  const c = new Collector();
  for (const f of facts) {
    if (typeof f.value === "number") {
      c.scalar(f.predicate, f.label, f.value, f.unit ? SYMBOL_TO_UNIT[f.unit] : undefined);
    } else if (f.predicate === "star.spectral_class") {
      c.spectral(f.value);
    }
  }
  return { entityType: "planet", facts: c.facts, children: [], ephemeral: [] };
}
