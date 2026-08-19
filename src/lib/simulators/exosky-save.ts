// ---------------------------------------------------------------------------
// exosky-save, the shape ExoSky persists and the facts a writer can use.
//
// Two jobs, deliberately in one file because they have to agree:
//
//   1. toExoskySave / fromExoskySave — the save payload. ExoSky had none, so
//      its Save, Load and Publish buttons were all silent no-ops: the wrapper
//      dispatched STELLARFORGE_REQUEST_STATE and nothing in the component was
//      listening, so pendingPayload stayed null and the dialog never opened.
//
//   2. extractExoskyFacts — the same payload read back as labelled facts.
//
// The second is the point of the first. A writer who spends twenty minutes
// naming constellations from the surface of Tau Ceti e should be able to use
// those names in prose without retyping them; before this, the only way out of
// ExoSky was a JSON file download.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One star as it appears from the chosen vantage point, not from Earth. */
export interface ExoskyStarRef {
  name: string;
  /** Right ascension in degrees, recomputed for the vantage point. */
  ra: number;
  /** Declination in degrees, recomputed for the vantage point. */
  dec: number;
  /** Apparent magnitude from the vantage point; null when unknown. */
  appMag: number | null;
}

/** A constellation the writer drew and named. */
export interface ExoskyConstellation {
  name: string;
  color: string;
  stars: ExoskyStarRef[];
  /** Centroid, so the sky position can be quoted without re-averaging. */
  centRa: number;
  centDec: number;
  /** The vantage this was drawn from; a constellation only exists from there. */
  fromPlanet: string;
}

export interface ExoskySave {
  version: 1;
  vantage: {
    mode: "catalog" | "custom" | "entity";
    /** Host star name, e.g. "Tau Ceti". Empty for a custom coordinate. */
    starName: string;
    /** Observation body, e.g. "Tau Ceti e". */
    planetName: string;
    /** Distance from Sol in parsecs. */
    distPc: number;
    /** Galactic arm / structure note, when the catalog carries one. */
    armNote: string;
    /** Atmosphere description, which drives sky colour. */
    atmoDesc: string;
    /** Galactic longitude/latitude, present only for a custom vantage. Without
     *  these a custom position cannot be restored: the payload's ra/dec are
     *  derived, and inverting them back to l/b on load would lose distance. */
    galacticL: number | null;
    galacticB: number | null;
  };
  view: {
    ra: number;
    dec: number;
    fov: number;
    /** Precession offset from J2000, in years; 0 is "now". Without this a
     *  writer who sets the epoch slider and saves gets epoch 0 back on
     *  reload with nothing to say it was not saved. */
    epochYears: number;
  };
  display: {
    constellations: boolean;
    atmosphere: boolean;
    grid: boolean;
    milkyWay: boolean;
    starNames: boolean;
    horizon: boolean;
  };
  constellations: ExoskyConstellation[];
}

/** What the component hands over. Loose on purpose: the simulator's own state
 *  is untyped JS, so normalising happens here rather than at 30 call sites. */
export interface ExoskyStateInput {
  mode?: "catalog" | "custom" | "entity";
  starName?: unknown;
  planetName?: unknown;
  distPc?: unknown;
  armNote?: unknown;
  atmoDesc?: unknown;
  galacticL?: unknown;
  galacticB?: unknown;
  viewRa?: unknown;
  viewDec?: unknown;
  fov?: unknown;
  epochYears?: unknown;
  showConstellations?: unknown;
  showAtmosphere?: unknown;
  showGrid?: unknown;
  showMilkyWay?: unknown;
  showStarNames?: unknown;
  showHorizon?: unknown;
  customConstellations?: unknown;
}

// ---------------------------------------------------------------------------
// Coercion helpers
//
// Every value crossing this boundary came from either untyped component state
// or a Json column, so nothing is trusted. A bad field degrades to a default
// instead of throwing: a writer losing one toggle is recoverable, a save
// dialog that crashes is not.
// ---------------------------------------------------------------------------

const PC_TO_LY = 3.26156;

function num(raw: unknown, fallback: number): number {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function bool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

/** Round for display, and to keep saved payloads from carrying float noise. */
function round(n: number, places = 3): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

function normaliseStar(raw: unknown): ExoskyStarRef | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  // The component names these newRa/newDec (recomputed for the vantage) but a
  // reloaded payload carries ra/dec. Accept both so a save round-trips.
  const ra = num(s.newRa ?? s.ra, NaN);
  const dec = num(s.newDec ?? s.dec, NaN);
  if (!Number.isFinite(ra) || !Number.isFinite(dec)) return null;
  const mag = num(s.appMag, NaN);
  return {
    name: str(s.name) || "Unnamed star",
    ra: round(ra),
    dec: round(dec),
    appMag: Number.isFinite(mag) ? round(mag, 2) : null,
  };
}

function normaliseConstellation(
  raw: unknown,
  fallbackPlanet: string,
): ExoskyConstellation | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;

  const stars = Array.isArray(c.stars)
    ? c.stars.map(normaliseStar).filter((s): s is ExoskyStarRef => s !== null)
    : [];

  // A line needs two ends. One star is a click, not a constellation.
  if (stars.length < 2) return null;

  const name = str(c.name);
  if (!name) return null;

  const centRa = Number.isFinite(num(c.centRa, NaN))
    ? num(c.centRa, 0)
    : stars.reduce((t, s) => t + s.ra, 0) / stars.length;
  const centDec = Number.isFinite(num(c.centDec, NaN))
    ? num(c.centDec, 0)
    : stars.reduce((t, s) => t + s.dec, 0) / stars.length;

  return {
    name,
    color: str(c.color) || "#FFA500",
    stars,
    centRa: round(centRa),
    centDec: round(centDec),
    fromPlanet: str(c.planetName) || fallbackPlanet,
  };
}

// ---------------------------------------------------------------------------
// Serialise
// ---------------------------------------------------------------------------

export function toExoskySave(state: ExoskyStateInput): ExoskySave {
  const planetName = str(state.planetName) || "Unnamed vantage";

  return {
    version: 1,
    vantage: {
      mode: state.mode ?? "catalog",
      starName: str(state.starName),
      planetName,
      distPc: round(num(state.distPc, 0), 4),
      armNote: str(state.armNote),
      atmoDesc: str(state.atmoDesc),
      galacticL: Number.isFinite(num(state.galacticL, NaN))
        ? round(num(state.galacticL, 0))
        : null,
      galacticB: Number.isFinite(num(state.galacticB, NaN))
        ? round(num(state.galacticB, 0))
        : null,
    },
    view: {
      ra: round(num(state.viewRa, 180)),
      dec: round(num(state.viewDec, 10)),
      fov: round(num(state.fov, 90)),
      epochYears: round(num(state.epochYears, 0)),
    },
    display: {
      constellations: bool(state.showConstellations, true),
      atmosphere: bool(state.showAtmosphere, true),
      grid: bool(state.showGrid, false),
      milkyWay: bool(state.showMilkyWay, true),
      starNames: bool(state.showStarNames, false),
      horizon: bool(state.showHorizon, true),
    },
    constellations: Array.isArray(state.customConstellations)
      ? state.customConstellations
          .map((c) => normaliseConstellation(c, planetName))
          .filter((c): c is ExoskyConstellation => c !== null)
      : [],
  };
}

/**
 * The save envelope the persistence layer expects.
 *
 * useSimulationSave inserts `data: {parameters, results}` and discards the rest,
 * so the real state has to sit inside `parameters`. `results` holds the
 * human-readable summary the save dialog and publish flow show back.
 */
export function toExoskyPayload(state: ExoskyStateInput): {
  outputType: string;
  name: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
} {
  const save = toExoskySave(state);
  const named = save.constellations.map((c) => c.name);

  return {
    outputType: "alien_sky",
    name: save.vantage.planetName,
    parameters: { exosky: save },
    results: {
      vantage: save.vantage.planetName,
      hostStar: save.vantage.starName,
      distancePc: save.vantage.distPc,
      constellationCount: named.length,
      constellationNames: named,
    },
  };
}

// ---------------------------------------------------------------------------
// Deserialise
// ---------------------------------------------------------------------------

/**
 * Read a stored payload back. Returns null when the blob is not an ExoSky save
 * at all, so a caller can ignore it rather than half-applying garbage.
 *
 * Accepts both the bare ExoskySave and the persisted envelope: useSimulationSave
 * writes only `{parameters, results}` to the row, dropping every other top-level
 * key, so anything that must survive a save lives under `parameters.exosky`.
 */
export function fromExoskySave(raw: unknown): ExoskySave | null {
  if (!raw || typeof raw !== "object") return null;
  let p = raw as Record<string, unknown>;

  const params =
    p.parameters && typeof p.parameters === "object"
      ? (p.parameters as Record<string, unknown>)
      : null;
  if (params?.exosky && typeof params.exosky === "object") {
    p = params.exosky as Record<string, unknown>;
  }

  // Accept anything with a recognisable vantage or constellation list. Being
  // strict on `version` would reject payloads written by the older static sim.
  const vantageRaw =
    p.vantage && typeof p.vantage === "object"
      ? (p.vantage as Record<string, unknown>)
      : {};
  const viewRaw =
    p.view && typeof p.view === "object" ? (p.view as Record<string, unknown>) : {};
  const displayRaw =
    p.display && typeof p.display === "object"
      ? (p.display as Record<string, unknown>)
      : {};

  const hasVantage = Object.keys(vantageRaw).length > 0;
  const hasConstellations = Array.isArray(p.constellations);
  if (!hasVantage && !hasConstellations) return null;

  return toExoskySave({
    mode: (str(vantageRaw.mode) || "catalog") as ExoskySave["vantage"]["mode"],
    starName: vantageRaw.starName,
    planetName: vantageRaw.planetName,
    distPc: vantageRaw.distPc,
    armNote: vantageRaw.armNote,
    atmoDesc: vantageRaw.atmoDesc,
    galacticL: vantageRaw.galacticL,
    galacticB: vantageRaw.galacticB,
    viewRa: viewRaw.ra,
    viewDec: viewRaw.dec,
    fov: viewRaw.fov,
    epochYears: viewRaw.epochYears,
    showConstellations: displayRaw.constellations,
    showAtmosphere: displayRaw.atmosphere,
    showGrid: displayRaw.grid,
    showMilkyWay: displayRaw.milkyWay,
    showStarNames: displayRaw.starNames,
    showHorizon: displayRaw.horizon,
    customConstellations: p.constellations,
  });
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

/** Degrees to a sexagesimal-ish display a writer can drop into prose. */
export function formatSkyPosition(ra: number, dec: number): string {
  const raH = ((ra % 360) + 360) % 360 / 15;
  const h = Math.floor(raH);
  const m = Math.round((raH - h) * 60);
  // 60 minutes reads as wrong even when it rounds there; carry the hour.
  const hh = m === 60 ? (h + 1) % 24 : h;
  const mm = m === 60 ? 0 : m;
  const sign = dec < 0 ? "-" : "+";
  const ad = Math.abs(dec);
  const d = Math.floor(ad);
  const am = Math.round((ad - d) * 60);
  return `${hh}h ${String(mm).padStart(2, "0")}m ${sign}${d}° ${String(am).padStart(2, "0")}'`;
}

/**
 * The vantage point and named sky, as labelled facts.
 *
 * Keys are prefixed `sky.` so they cannot collide with the entity-metadata keys
 * extractWorksheetFacts emits, and so the writing surface can tell which facts
 * came from a simulator.
 */
export function extractExoskyFacts(raw: unknown): WorksheetFact[] {
  const save = fromExoskySave(raw);
  if (!save) return [];

  const facts: WorksheetFact[] = [];
  const { vantage, constellations } = save;

  if (vantage.planetName && vantage.planetName !== "Unnamed vantage") {
    facts.push({
      key: "sky.vantage",
      label: "Observed from",
      value: vantage.planetName,
    });
  }

  if (vantage.starName) {
    facts.push({ key: "sky.hostStar", label: "Host star", value: vantage.starName });
  }

  if (vantage.distPc > 0) {
    const ly = vantage.distPc * PC_TO_LY;
    facts.push({
      key: "sky.distance",
      label: "Distance from Sol",
      // Light years first: prose says light years, catalogs say parsecs.
      value: `${ly < 100 ? ly.toFixed(2) : Math.round(ly).toLocaleString()} ly (${vantage.distPc} pc)`,
    });
  }

  if (vantage.armNote) {
    facts.push({
      key: "sky.region",
      label: "Galactic region",
      value: vantage.armNote,
    });
  }

  if (vantage.atmoDesc) {
    facts.push({ key: "sky.sky", label: "Sky", value: vantage.atmoDesc });
  }

  // Each named constellation is its own fact. These are the writer's own
  // coinages, which makes them the most quotable thing in the payload.
  for (const c of constellations) {
    const brightest = c.stars.reduce<ExoskyStarRef | null>((best, s) => {
      if (s.appMag === null) return best;
      if (!best || best.appMag === null || s.appMag < best.appMag) return s;
      return best;
    }, null);

    const detail = [
      `${c.stars.length} stars`,
      formatSkyPosition(c.centRa, c.centDec),
      brightest ? `brightest ${brightest.name}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    facts.push({
      key: `sky.constellation.${c.name.toLowerCase().replace(/\s+/g, "-")}`,
      label: `Constellation "${c.name}"`,
      value: detail,
      // The writer's own coinage is the quotable part, not its star count.
      insert: c.name,
    });
  }

  return facts;
}

export default extractExoskyFacts;
