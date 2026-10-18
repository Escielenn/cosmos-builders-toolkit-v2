// ---------------------------------------------------------------------------
// Generation Ship Designer (Ark): reading the tools it consumes.
//
// Each reader takes another tool's saved worksheet blob and returns only the
// fields it can read with confidence, keyed by the Ark form path they fill.
// Free text that does not parse is skipped, never guessed: a speed typed as
// "fast" must not become 0.0 c.
// ---------------------------------------------------------------------------

import { calculateTimeDilation, type FormStateForCalc } from "@/lib/time-dilation/calculations";
import { LIFESPAN_TO_GENERATION, MATING_TO_BREEDING } from "./data";

/** Form path → value. Paths are the same strings used as provenance keys. */
export type ImportPatch = Record<string, string | number>;

export interface ImportSource {
  tool: string;
  /** Short brand name for the provenance chip: "// FROM PARADOX". */
  brand: string;
}

export const IMPORT_SOURCES: Record<string, ImportSource> = {
  "time-dilation": { tool: "time-dilation", brand: "Paradox" },
  "propulsion-consequences-map": { tool: "propulsion-consequences-map", brand: "Impulse" },
  "spacecraft-designer": { tool: "spacecraft-designer", brand: "Vessel" },
  "evolutionary-biology": { tool: "evolutionary-biology", brand: "Phylo" },
  gravitas: { tool: "gravitas", brand: "Gravitas" },
};

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function text(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function finite(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * A speed written as a fraction of light: "0.08c", "0.08 c", "8% c", "8%c", "0.08".
 * Returns the fraction, or null when the text names some other unit.
 */
export function parseFractionOfC(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const pct = s.match(/^([\d.]+)\s*%\s*(?:of\s*)?(?:c|light|lightspeed|the speed of light)\b/);
  if (pct) {
    const n = parseFloat(pct[1]);
    return n > 0 && n < 100 ? n / 100 : null;
  }
  const frac = s.match(/^([\d.]+)\s*c\b/);
  if (frac) {
    const n = parseFloat(frac[1]);
    return n > 0 && n < 1 ? n : null;
  }
  const bare = s.match(/^0?\.\d+$/);
  if (bare) {
    const n = parseFloat(s);
    return n > 0 && n < 1 ? n : null;
  }
  return null;
}

/** An acceleration written in g: "0.3 g", "0.3g", "1 G". */
export function parseG(raw: string): number | null {
  const m = raw.trim().toLowerCase().match(/^([\d.]+)\s*g\b/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return n > 0 && n < 100 ? n : null;
}

// ─── Paradox (time-dilation) ────────────────────────────────────────────

export function readTimeDilation(data: unknown): ImportPatch {
  const d = obj(data);
  const out: ImportPatch = {};
  const journey = obj(d.journey);
  const profile = obj(d.velocityProfile);
  // Paradox's own engine resolves preset journeys and drive caps, so read its
  // answer rather than re-implementing its preset tables here.
  try {
    const r = calculateTimeDilation(d as unknown as FormStateForCalc);
    if (r.valid && r.distanceLY > 0) out["voyage.distanceLy"] = Number(r.distanceLY.toPrecision(6));
    if (r.valid && r.peakVelocityFraction > 0 && r.peakVelocityFraction < 1) {
      out["voyage.cruiseFractionC"] = Number(r.peakVelocityFraction.toPrecision(6));
    }
  } catch {
    // A malformed blob imports nothing rather than breaking the page.
  }
  if (profile.mode === "brachistochrone") {
    const gF = finite(profile.gForce);
    if (gF !== null && gF > 0) out["voyage.accelG"] = gF;
  } else if (profile.mode === "constant") {
    out["voyage.accelG"] = 0;
  }
  const origin = text(journey.originName);
  const dest = text(journey.destinationName);
  if (origin) out["identity.originName"] = origin;
  if (dest) out["identity.destinationName"] = dest;
  return out;
}

// ─── Impulse (propulsion-consequences-map) ──────────────────────────────

export function readPropulsion(data: unknown): ImportPatch {
  const sys = obj(obj(data).system);
  const out: ImportPatch = {};
  const v = parseFractionOfC(text(sys.maxVelocity));
  if (v !== null) out["voyage.cruiseFractionC"] = v;
  const a = parseG(text(sys.acceleration));
  if (a !== null) out["voyage.accelG"] = a;
  return out;
}

// ─── Vessel (spacecraft-designer) ───────────────────────────────────────

export function readSpacecraft(data: unknown): ImportPatch {
  const identity = obj(obj(data).identity);
  const out: ImportPatch = {};
  const name = text(identity.name);
  if (name) out["identity.shipName"] = name;
  const origin = text(identity.origin);
  if (origin) out["identity.originName"] = origin;
  return out;
}

// ─── Phylo (evolutionary-biology) ───────────────────────────────────────

export function readPhylo(data: unknown): ImportPatch {
  const d = obj(data);
  const repro = obj(d.reproduction);
  const out: ImportPatch = {};
  const species = text(d.speciesName);
  if (species) out["identity.speciesName"] = species;
  const life = LIFESPAN_TO_GENERATION[text(repro.lifespan)];
  if (life) {
    out["population.generationYears"] = life.generationYears;
    out["population.lifespanYears"] = life.lifespanYears;
  }
  const mating = MATING_TO_BREEDING[text(repro.matingSystem)];
  if (mating) {
    out["population.femalePct"] = Math.round(mating.femaleFraction * 100);
    out["population.familySizeVariance"] = mating.vk;
  }
  return out;
}

// ─── Gravitas ───────────────────────────────────────────────────────────

export function readGravitas(data: unknown): ImportPatch {
  const spin = obj(obj(data).spin);
  const out: ImportPatch = {};
  const r = finite(spin.radius_m);
  if (r !== null && r > 0) out["habitat.radiusM"] = r;
  const rpm = finite(spin.rotation_rpm);
  if (rpm !== null && rpm > 0) out["habitat.rpm"] = rpm;
  return out;
}

export const IMPORT_READERS: Record<string, (data: unknown) => ImportPatch> = {
  "time-dilation": readTimeDilation,
  "propulsion-consequences-map": readPropulsion,
  "spacecraft-designer": readSpacecraft,
  "evolutionary-biology": readPhylo,
  gravitas: readGravitas,
};

/** Write an import patch into a form object at its dot paths. Returns a new object. */
export function applyPatch<T>(form: T, patch: ImportPatch): T {
  const next = JSON.parse(JSON.stringify(form)) as Record<string, unknown>;
  for (const [path, value] of Object.entries(patch)) {
    const parts = path.split(".");
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      const child = cur[parts[i]];
      if (!child || typeof child !== "object") cur[parts[i]] = {};
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value;
  }
  return next as T;
}
