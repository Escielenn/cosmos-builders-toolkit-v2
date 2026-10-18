// ---------------------------------------------------------------------------
// Dossier derivations — what a body means on the world it stands on.
//
// Every function here is pure and total: bad input returns null, never NaN,
// never a throw. Upstream values arrive as the free text writers typed into
// Genesis ("1.4g", "347 days", "4.2 years"), so the parsers are lenient about
// format and strict about meaning: a number they cannot place in a unit is
// refused rather than guessed.
//
// Each derivation that a writer sees ships a one-line Ship's-Voice narrative
// of consequence (Tool Charter obligation 3: "1.4 g is data; stairs are a
// hazard is the product").
// ---------------------------------------------------------------------------

/** Standard gravity, m/s². */
export const G0 = 9.80665;
/** Days in a standard (Julian) year. */
export const STANDARD_YEAR_DAYS = 365.25;

/** The first finite number in a string, or null. Accepts "1,200" and "1.4e2". */
export function parseLeadingNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const m = raw.replace(/,(?=\d{3}\b)/g, "").match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Surface gravity in g from a writer's text.
 *
 * "1.4", "1.4g", "1.4 g", "1.4 Earth gravities" → 1.4.
 * "13.7 m/s²" or "13.7 m/s2" → 13.7 / g0.
 * Zero or negative is refused: nothing stands on it.
 */
export function parseGravityG(raw: unknown): number | null {
  const n = parseLeadingNumber(raw);
  if (n === null || n <= 0) return null;
  if (typeof raw === "string" && /m\s*\/\s*s/i.test(raw)) return n / G0;
  return n;
}

/** g = M / R² in Earth units. Null unless both are positive. */
export function gravityFromMassRadius(massEarth: unknown, radiusEarth: unknown): number | null {
  const m = parseLeadingNumber(massEarth);
  const r = parseLeadingNumber(radiusEarth);
  if (m === null || r === null || m <= 0 || r <= 0) return null;
  return m / (r * r);
}

/**
 * Orbital period (one local year) in standard days.
 *
 * "347 days", "347 d" → 347. "4.2 years", "4.2 yr" → 4.2 × 365.25.
 * "11 hours" → 11 / 24. A bare number is read as days, which is the unit the
 * Genesis field's own placeholder leads with ("e.g., 11 days, 365 days").
 */
export function parseOrbitalPeriodDays(raw: unknown): number | null {
  const n = parseLeadingNumber(raw);
  if (n === null || n <= 0) return null;
  if (typeof raw !== "string") return n;
  if (/\b(years?|yrs?|y)\b/i.test(raw)) return n * STANDARD_YEAR_DAYS;
  if (/\b(hours?|hrs?|h)\b/i.test(raw)) return n / 24;
  if (/\b(weeks?|wks?)\b/i.test(raw)) return n * 7;
  return n;
}

export interface WeightUnderGravity {
  /** Force in newtons. */
  newtons: number;
  /** What a scale calibrated on Earth would read, in kg. */
  earthScaleKg: number;
}

/** A body of `massKg` standing in `g` gravities. */
export function weightUnderGravity(massKg: unknown, g: number | null): WeightUnderGravity | null {
  const m = parseLeadingNumber(massKg);
  if (m === null || m <= 0 || g === null || !(g > 0)) return null;
  return { newtons: m * g * G0, earthScaleKg: m * g };
}

/**
 * How heavy another world feels to someone raised at `homeG`.
 *
 * A ratio, not a weight: 1.5 means every step costs half again what it did
 * at home. This is the number that drives a scene, because a body adapted to
 * 0.4 g finds Earth as punishing as an Earth body finds 2.5 g.
 */
export function feltWeightRatio(homeG: number | null, otherG: number | null): number | null {
  if (homeG === null || otherG === null || !(homeG > 0) || !(otherG > 0)) return null;
  return otherG / homeG;
}

/**
 * Convert an age between standard years and local (homeworld) years.
 *
 * `from` names the calendar `age` is written in. Returns the age in the other
 * calendar, or null when the homeworld's year length is not on file.
 */
export function convertAge(
  age: unknown,
  from: "standard" | "local",
  localYearDays: number | null,
): number | null {
  const a = parseLeadingNumber(age);
  if (a === null || a < 0 || localYearDays === null || !(localYearDays > 0)) return null;
  const ratio = STANDARD_YEAR_DAYS / localYearDays; // local years per standard year
  return from === "standard" ? a * ratio : a / ratio;
}

/** Round for display: 3 significant figures, trailing zeros trimmed. */
export function fmt(n: number, sig = 3): string {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 10 ** sig) return Math.round(n).toLocaleString("en-US");
  return String(Number(n.toPrecision(sig)));
}

// ---------------------------------------------------------------------------
// Narrative — one sentence of consequence per derivation
// ---------------------------------------------------------------------------

/** What a felt-weight ratio does to a body, in Ship's Voice. */
export function narrateFeltWeight(ratio: number | null): string {
  if (ratio === null) return "";
  if (ratio >= 2) return "CRUSHING. STANDING IS LABOUR. A FALL CAN KILL.";
  if (ratio >= 1.3) return "HEAVY. STAIRS ARE A HAZARD. FATIGUE BY MIDDAY.";
  if (ratio > 1.08) return "NOTICEABLY HEAVY. THE BODY KEEPS SCORE BY EVENING.";
  if (ratio >= 0.92) return "FEELS LIKE HOME.";
  if (ratio > 0.6) return "LIGHT. STRIDES OVERSHOOT. THROWN THINGS GO TOO FAR.";
  if (ratio > 0.25) return "VERY LIGHT. WALKING BECOMES BOUNDING. BALANCE FAILS.";
  return "NEAR WEIGHTLESS. EVERY HABIT OF MOVEMENT IS WRONG.";
}

/** What native gravity did to the body that grew up in it. */
export function narrateNativeGravity(g: number | null): string {
  if (g === null) return "";
  if (g >= 1.5) return "GREW UP HEAVY. DENSE BONE, LOW CENTRE OF GRAVITY, HEIGHTS ARE MORTAL.";
  if (g > 1.15) return "GREW UP HEAVY. STRONGER THAN THEY LOOK. FALLS ARE TAKEN SERIOUSLY.";
  if (g >= 0.85) return "GREW UP AT ROUGHLY EARTH WEIGHT.";
  if (g >= 0.5) return "GREW UP LIGHT. TALL, LONG-BONED. EARTH-NORMAL GRAVITY WEARS THEM DOWN.";
  return "GREW UP NEAR WEIGHTLESS. A FULL-g WORLD IS A MEDICAL EVENT.";
}

/** What the gap between the two calendars means at a dinner table. */
export function narrateLocalAge(standardAge: number | null, localAge: number | null): string {
  if (standardAge === null || localAge === null || standardAge <= 0) return "";
  const ratio = localAge / standardAge;
  if (ratio > 1.5) return "SHORT YEARS. BIRTHDAYS COME OFTEN AND MEAN LITTLE.";
  if (ratio < 0.67) return "LONG YEARS. A BIRTHDAY IS A RARE AND HEAVY THING.";
  return "THE TWO CALENDARS RUN CLOSE. AGE TRANSLATES WITHOUT SURPRISE.";
}
