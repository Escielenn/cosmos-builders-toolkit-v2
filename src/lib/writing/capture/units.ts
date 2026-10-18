// ---------------------------------------------------------------------------
// capture/units, the units prose uses, converted to the vocabulary's.
//
// Storage units are canon/units.ts (one registry). This file only reads the
// surface forms writers type ("miles", "°C", "atmospheres", "gees") and the
// display forms facts already carry ("1.4 g", "288 K", "0.95 R⊕"), and
// converts between them so a claim and a fact are compared in one unit.
//
// A conversion that has no meaning (hours to metres) returns null, and the
// caller treats the pair as not comparable rather than as a contradiction.
// Pure, tested.
// ---------------------------------------------------------------------------

import { UNITS } from "@/canon/units";

type Dim = "accel" | "time" | "length" | "pressure" | "temp" | "mass" | "angle" | "speed" | "count" | "local";

interface UnitDef {
  dim: Dim;
  /** Multiplier to the dimension's base (temperature uses toBase/fromBase). */
  factor: number;
}

/** Units the capture rules can produce or read, including non-storage ones. */
const DEFS: Record<string, UnitDef> = {
  // acceleration, base g
  g: { dim: "accel", factor: 1 },
  m_s2: { dim: "accel", factor: 1 / 9.80665 },
  // time, base seconds
  s: { dim: "time", factor: 1 },
  min: { dim: "time", factor: 60 },
  hours: { dim: "time", factor: 3600 },
  days: { dim: "time", factor: 86400 },
  yr: { dim: "time", factor: 31_557_600 },
  kyr: { dim: "time", factor: 31_557_600e3 },
  myr: { dim: "time", factor: 31_557_600e6 },
  gyr: { dim: "time", factor: 31_557_600e9 },
  // length, base metres
  m: { dim: "length", factor: 1 },
  km: { dim: "length", factor: 1000 },
  ft: { dim: "length", factor: 0.3048 },
  mi: { dim: "length", factor: 1609.344 },
  earth_radii: { dim: "length", factor: 6.371e6 },
  au: { dim: "length", factor: 1.495978707e11 },
  ly: { dim: "length", factor: 9.4607304725808e15 },
  pc: { dim: "length", factor: 3.0856775814913e16 },
  // pressure, base bar
  bar: { dim: "pressure", factor: 1 },
  mbar: { dim: "pressure", factor: 1e-3 },
  atm: { dim: "pressure", factor: 1.01325 },
  kPa: { dim: "pressure", factor: 0.01 },
  Pa: { dim: "pressure", factor: 1e-5 },
  psi: { dim: "pressure", factor: 0.0689476 },
  // temperature (special-cased)
  K: { dim: "temp", factor: 1 },
  C: { dim: "temp", factor: 1 },
  F: { dim: "temp", factor: 1 },
  // mass, base kg
  kg: { dim: "mass", factor: 1 },
  earth_masses: { dim: "mass", factor: 5.9722e24 },
  solar_masses: { dim: "mass", factor: 1.98847e30 },
  // angle
  deg: { dim: "angle", factor: 1 },
  // speed, base c
  c: { dim: "speed", factor: 1 },
  // dimensionless counts
  individuals: { dim: "count", factor: 1 },
  // in-world units: comparable only with themselves
  local_days: { dim: "local", factor: 1 },
  local_years: { dim: "local", factor: 1 },
};

function toKelvin(v: number, u: string): number {
  if (u === "C") return v + 273.15;
  if (u === "F") return (v - 32) * (5 / 9) + 273.15;
  return v;
}
function fromKelvin(v: number, u: string): number {
  if (u === "C") return v - 273.15;
  if (u === "F") return (v - 273.15) * (9 / 5) + 32;
  return v;
}

/** Convert between two unit ids. Null when they measure different things. */
export function convert(value: number, from: string, to: string): number | null {
  if (from === to) return value;
  const a = DEFS[from];
  const b = DEFS[to];
  if (!a || !b || a.dim !== b.dim || a.dim === "local") return null;
  if (a.dim === "temp") return fromKelvin(toKelvin(value, from), to);
  return (value * a.factor) / b.factor;
}

/** Scale a precision (half-step) between units. Temperature offsets drop out. */
export function convertSpan(span: number, from: string, to: string): number | null {
  if (from === to) return span;
  const a = DEFS[from];
  const b = DEFS[to];
  if (!a || !b || a.dim !== b.dim || a.dim === "local") return null;
  if (a.dim === "temp") {
    const k = from === "F" ? 5 / 9 : 1;
    const back = to === "F" ? 9 / 5 : 1;
    return span * k * back;
  }
  return (span * a.factor) / b.factor;
}

// ---------------------------------------------------------------------------
// Surface forms
// ---------------------------------------------------------------------------

/** Lowercased surface token → unit id. "c" is resolved by context (below). */
const SURFACE: Record<string, string> = {
  g: "g", gs: "g", "g's": "g", gee: "g", gees: "g", gravity: "g", gravities: "g",
  "standard gravity": "g", "standard gravities": "g", "earth gravity": "g", "earth gravities": "g",
  "m/s²": "m_s2", "m/s2": "m_s2", "m/s^2": "m_s2",
  s: "s", sec: "s", secs: "s", second: "s", seconds: "s",
  min: "min", mins: "min", minute: "min", minutes: "min",
  h: "hours", hr: "hours", hrs: "hours", hour: "hours", hours: "hours",
  d: "days", day: "days", days: "days", "standard days": "days", "earth days": "days", "standard day": "days", "earth day": "days",
  "local days": "local_days", "local day": "local_days",
  yr: "yr", yrs: "yr", year: "yr", years: "yr", "standard years": "yr", "earth years": "yr", "standard year": "yr", "earth year": "yr",
  "local years": "local_years", "local year": "local_years",
  kyr: "kyr", myr: "myr", gyr: "gyr", ga: "gyr",
  m: "m", meter: "m", meters: "m", metre: "m", metres: "m",
  km: "km", kilometer: "km", kilometers: "km", kilometre: "km", kilometres: "km",
  ft: "ft", foot: "ft", feet: "ft",
  mi: "mi", mile: "mi", miles: "mi",
  au: "au", "a.u.": "au", "astronomical unit": "au", "astronomical units": "au",
  ly: "ly", "light-year": "ly", "light-years": "ly", "light year": "ly", "light years": "ly",
  pc: "pc", parsec: "pc", parsecs: "pc",
  bar: "bar", bars: "bar", mbar: "mbar", millibar: "mbar", millibars: "mbar",
  atm: "atm", atmosphere: "atm", atmospheres: "atm",
  kpa: "kPa", pa: "Pa", psi: "psi",
  k: "K", kelvin: "K", "°k": "K",
  "°c": "C", celsius: "C", "degrees celsius": "C", "degrees c": "C", centigrade: "C", "degrees centigrade": "C",
  "°f": "F", fahrenheit: "F", "degrees fahrenheit": "F", "degrees f": "F",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  "earth mass": "earth_masses", "earth masses": "earth_masses", "terran masses": "earth_masses",
  "solar mass": "solar_masses", "solar masses": "solar_masses",
  "earth radius": "earth_radii", "earth radii": "earth_radii", "terran radii": "earth_radii",
  "°": "deg", deg: "deg", degree: "deg", degrees: "deg",
  lightspeed: "c", "light-speed": "c", "light speed": "c", "speed of light": "c", "the speed of light": "c",
};

// Display symbols facts already carry (canon/units UNITS), read back.
for (const [id, sym] of Object.entries(UNITS)) {
  if (sym && !(sym.toLowerCase() in SURFACE) && DEFS[id]) SURFACE[sym.toLowerCase()] = id;
}

/**
 * A surface unit token as a unit id. `target` disambiguates the letter "c"
 * (Celsius on a temperature, lightspeed on a velocity). Unknown → null.
 */
export function unitFromToken(token: string, target?: string): string | null {
  const t = token.trim().toLowerCase().replace(/\s+/g, " ").replace(/\.$/, "");
  if (!t) return null;
  if (t === "c") return target && DEFS[target]?.dim === "temp" ? "C" : "c";
  const id = SURFACE[t];
  return id ?? null;
}

const NUM_IN_FACT =
  /(-?(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+))(?:\s*(hundred|thousand|million|billion|trillion))?\s*([^\s\d,;()]*)(?:\s+([A-Za-z]+(?:\s+[A-Za-z]+)?))?/;

const SCALE_WORD: Record<string, number> = { hundred: 1e2, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 };

/**
 * The number a fact's display value records, in `target` units.
 *
 *   "1.4 g" → 1.4 · "288 K" (target C) → 14.85 · "26" (hours) → 26 ·
 *   "8.7e9" → 8.7e9 · "12 billion" → 1.2e10 · "M4V" → null
 *
 * A value with no recognisable unit is read in the target unit (worksheet
 * fields store the bare number and name the unit in the label). A value whose
 * unit measures something else returns null: not comparable, not wrong.
 */
export function readFactNumber(text: string, target?: string | null): number | null {
  if (!text) return null;
  const m = text.replace(/−/g, "-").match(NUM_IN_FACT);
  if (!m) return null;
  let n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  if (m[2]) n *= SCALE_WORD[m[2].toLowerCase()];
  if (!target) return n;
  const sym = (m[3] ?? "").trim();
  const words = (m[4] ?? "").trim();
  // Longest match first: "earth radii" before "earth"; "°c" before "°".
  const candidates = [
    sym && words ? `${sym} ${words}` : "",
    words && !sym ? words : "",
    words && !sym ? words.split(" ")[0] : "",
    sym,
  ].filter(Boolean);
  for (const c of candidates) {
    const u = unitFromToken(c, target);
    if (u) return convert(n, u, target);
  }
  return n;
}

export function isKnownUnit(id: string): boolean {
  return id in DEFS;
}
