// ---------------------------------------------------------------------------
// survey-seed, the BEGIN SURVEY wizard's data model and seed builder.
//
// "Blank page syndrome" is the promise StellarForge makes first: a writer
// names a world, picks a star, a planet and one species, and lands in the
// Studio with those three already on file and connected. This module turns
// the wizard's choices into a payload (entries, connections, one document)
// and owns nothing else. No React, no network, deterministic given an rng.
//
// Every derived number comes from the existing calculation libraries: the
// habitable-zone engine (Kopparapu 2013 boundaries, Kepler period, T_eq) and
// the surface-gravity engine (Zeng mass-radius relations, g = M/R²). Nothing
// here introduces a formula of its own.
//
// Values are stored in entry metadata under the keys the planet and species
// master fields already read (src/lib/entity-config.ts), so the Codex
// infobox and the worksheets pick them up without a mapping of their own.
// Decoupled from src/canon on purpose (1.5 brief, item 14).
// ---------------------------------------------------------------------------

import {
  calcHZBoundaries,
  classifyPlanetZone,
  equilibriumTemperature,
  estimatedSurfaceTemperature,
  orbitalPeriod,
  EARTH_DAYS_PER_YEAR,
  type HZBoundaries,
} from "@/lib/habitable-zone/calculations";
import { SPECTRAL_TYPES, ZONE_NAMES, type PlanetZone } from "@/lib/habitable-zone/data";
import { calcSurfaceGravity } from "@/lib/surface-gravity/calculations";
import { COMPOSITION_PRESETS, getGravityRegimeInfo } from "@/lib/surface-gravity/data";
import { SYMMETRY_TYPES } from "@/lib/evolutionary-biology-data";
import type { CascadeStage, ConnectionCascadeStage } from "@/services/entity-graph-types";

/** Marks every row this wizard wrote, so a later tool can tell seeds apart. */
export const SEED_SOURCE = "begin-survey";

/** Title of the first Studio document. A title only: never any prose. */
export const FIRST_DOCUMENT_TITLE = "Chapter One";

/** Earth-like greenhouse warming the Habitable Zone tool defaults to (K). */
const DEFAULT_GREENHOUSE_K = 33;

export type Rng = () => number;

// ---------------------------------------------------------------------------
// Star presets: one per spectral subtype in the Habitable Zone data
// ---------------------------------------------------------------------------

export interface StarClassPreset {
  /** Spectral subtype, e.g. "G2". Unique. */
  id: string;
  /** Spectral class letter, e.g. "G". */
  spectralClass: string;
  mass: number;        // solar masses
  luminosity: number;  // solar luminosities
  temperature: number; // K
  /** Short Ship's Voice tag for the chip. */
  tag: string;
  /** True for the long-lived classes a first world usually wants. */
  common: boolean;
}

const STAR_TAGS: Record<string, string> = {
  O5: "BLUE GIANT. SHORT-LIVED.",
  B0: "BLUE-WHITE. FIERCE UV.",
  A0: "WHITE. WIDE ZONE.",
  F0: "YELLOW-WHITE. BRIGHT.",
  G0: "YELLOW. SUN-LIKE.",
  G2: "YELLOW. SOL ANALOGUE.",
  K0: "ORANGE. STABLE.",
  K5: "ORANGE. LONG-LIVED.",
  M0: "RED DWARF. CLOSE ZONE.",
  M5: "RED DWARF. FLARES.",
  M8: "ULTRA-COOL DWARF.",
};

const COMMON_CLASSES = new Set(["G", "K", "M"]);

export const STAR_CLASS_PRESETS: StarClassPreset[] = SPECTRAL_TYPES.map((s) => ({
  id: s.subtype,
  spectralClass: s.type,
  mass: s.mass,
  luminosity: s.luminosity,
  temperature: s.temperature,
  tag: STAR_TAGS[s.subtype] ?? "MAIN SEQUENCE.",
  common: COMMON_CLASSES.has(s.type),
}));

export function getStarPreset(id: string): StarClassPreset | undefined {
  return STAR_CLASS_PRESETS.find((s) => s.id === id);
}

export interface DerivedStar {
  preset: StarClassPreset;
  /** Main-sequence designation, e.g. "G2V". */
  designation: string;
  hz: HZBoundaries;
}

export function deriveStar(id: string): DerivedStar | null {
  const preset = getStarPreset(id);
  if (!preset) return null;
  return {
    preset,
    designation: `${preset.id}V`,
    hz: calcHZBoundaries(preset.luminosity),
  };
}

// ---------------------------------------------------------------------------
// Planet presets
// ---------------------------------------------------------------------------

export interface PlanetTypePreset {
  id: string;
  label: string;
  tag: string;
  /** Earth masses. Radius follows from the composition's mass-radius law. */
  mass: number;
  /** COMPOSITION_PRESETS id (surface-gravity data). */
  composition: string;
  /**
   * Stellar flux at the orbit, in Earth units (S/S⊕). The orbit is placed by
   * flux rather than AU so the preset means the same climate around any
   * star: d = sqrt(L / S).
   */
  insolation: number;
  /** Bond albedo used for the equilibrium temperature. */
  albedo: number;
  tidallyLocked: boolean;
  /** Spectral classes this preset is physically built around, if any. */
  suitsClasses?: string[];
}

export const PLANET_TYPE_PRESETS: PlanetTypePreset[] = [
  {
    id: "earth-like",
    label: "Earth-like",
    tag: "1 EARTH MASS. TEMPERATE.",
    mass: 1.0,
    composition: "rocky",
    insolation: 1.0,
    albedo: 0.3,
    tidallyLocked: false,
  },
  {
    id: "super-earth",
    label: "Super-Earth",
    tag: "4 EARTH MASSES. HEAVY.",
    mass: 4.0,
    composition: "super-earth",
    insolation: 0.9,
    albedo: 0.3,
    tidallyLocked: false,
  },
  {
    id: "tidally-locked",
    label: "Tidally locked M-dwarf world",
    tag: "ONE FACE TO THE STAR.",
    mass: 1.1,
    composition: "rocky",
    insolation: 0.65,
    albedo: 0.3,
    tidallyLocked: true,
    suitsClasses: ["M"],
  },
  {
    id: "ocean",
    label: "Ocean world",
    tag: "GLOBAL OCEAN. LOW DENSITY.",
    mass: 2.0,
    composition: "ocean",
    insolation: 0.85,
    albedo: 0.25,
    tidallyLocked: false,
  },
  {
    id: "desert",
    label: "Desert world",
    tag: "HOT. DRY. INNER EDGE.",
    mass: 0.8,
    composition: "rocky",
    insolation: 1.3,
    albedo: 0.35,
    tidallyLocked: false,
  },
];

export function getPlanetPreset(id: string): PlanetTypePreset | undefined {
  return PLANET_TYPE_PRESETS.find((p) => p.id === id);
}

/** Zones inside the conservative habitable zone (Kopparapu 2013). */
const CONSERVATIVE_HZ: PlanetZone[] = ["inner-habitable", "sweet-spot", "outer-habitable"];

export interface DerivedPlanet {
  preset: PlanetTypePreset;
  mass: number;
  radius: number;
  /** Surface gravity in g. */
  gravity: number;
  gravityRegime: string;
  /** Present only when a star was chosen: the orbit needs one. */
  orbit: null | {
    distanceAU: number;
    periodDays: number;
    zone: PlanetZone;
    zoneLabel: string;
    /** Inside the optimistic HZ (recent Venus to early Mars). */
    inHabitableZone: boolean;
    /** Inside the conservative HZ (runaway to maximum greenhouse). */
    inConservativeZone: boolean;
    equilibriumK: number;
    surfaceK: number;
  };
  /** The preset assumes a star class that was not chosen. */
  starMismatch: boolean;
}

export function derivePlanet(presetId: string, star: DerivedStar | null): DerivedPlanet | null {
  const preset = getPlanetPreset(presetId);
  if (!preset) return null;

  const composition = COMPOSITION_PRESETS.find((c) => c.id === preset.composition);
  const radius = composition ? composition.massToRadius(preset.mass) : 1;
  const { gRatio } = calcSurfaceGravity(preset.mass, radius);

  let orbit: DerivedPlanet["orbit"] = null;
  if (star) {
    const L = star.preset.luminosity;
    const distanceAU = Math.sqrt(L / preset.insolation);
    const zone = classifyPlanetZone(distanceAU, star.hz);
    const equilibriumK = equilibriumTemperature(L, distanceAU, preset.albedo);
    orbit = {
      distanceAU,
      periodDays: orbitalPeriod(distanceAU, star.preset.mass) * EARTH_DAYS_PER_YEAR,
      zone,
      zoneLabel: ZONE_NAMES[zone],
      inHabitableZone: distanceAU >= star.hz.recentVenus && distanceAU <= star.hz.earlyMars,
      inConservativeZone: CONSERVATIVE_HZ.includes(zone),
      equilibriumK,
      surfaceK: estimatedSurfaceTemperature(equilibriumK, DEFAULT_GREENHOUSE_K),
    };
  }

  return {
    preset,
    mass: preset.mass,
    radius,
    gravity: gRatio,
    gravityRegime: getGravityRegimeInfo(gRatio).label,
    orbit,
    starMismatch:
      !!star && !!preset.suitsClasses && !preset.suitsClasses.includes(star.preset.spectralClass),
  };
}

// ---------------------------------------------------------------------------
// Life: body plan presets (Evolutionary Biology symmetry vocabulary)
// ---------------------------------------------------------------------------

const BODY_PLAN_IDS = ["bilateral", "radial", "spiral", "spherical", "fractal", "asymmetric"];

export interface BodyPlanPreset {
  id: string;
  label: string;
  description: string;
}

export const BODY_PLAN_PRESETS: BodyPlanPreset[] = BODY_PLAN_IDS.map((id) => {
  const s = SYMMETRY_TYPES.find((t) => t.id === id);
  return { id, label: s?.name ?? id, description: s?.description ?? "" };
});

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

export interface SurveyChoices {
  worldName: string;
  /** null = step skipped. */
  star: null | { classId: string; name: string };
  planet: null | { presetId: string; name: string };
  species: null | { name: string; bodyPlanId: string; line: string };
}

// ---------------------------------------------------------------------------
// Surprise me
// ---------------------------------------------------------------------------

function pick<T>(items: readonly T[], rng: Rng): T {
  const i = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[Math.max(0, i)];
}

/**
 * A star a first world can actually live around. Weighted to the long-lived
 * classes the way the galaxy is: most stars are M and K dwarfs.
 */
export function surpriseStar(rng: Rng): string {
  const weighted = ["M0", "M5", "M5", "M8", "K0", "K5", "K5", "G0", "G2", "F0"];
  return pick(weighted, rng);
}

/** A planet type, preferring one that suits the chosen star. */
export function surprisePlanet(rng: Rng, starClassId: string | null): string {
  const cls = starClassId ? getStarPreset(starClassId)?.spectralClass : undefined;
  const fits = PLANET_TYPE_PRESETS.filter(
    (p) => !p.suitsClasses || (cls !== undefined && p.suitsClasses.includes(cls)),
  );
  return pick(fits.length ? fits : PLANET_TYPE_PRESETS, rng).id;
}

const ONSETS = ["k", "th", "v", "s", "r", "m", "n", "z", "t", "ql", "y", "dr", "h", "x"];
const NUCLEI = ["a", "e", "i", "o", "u", "ae", "y", "ou"];
const CODAS = ["", "", "n", "r", "th", "s", "l", "k", "x"];

/** A pronounceable two-to-three syllable designation. Never a sentence. */
export function surpriseSpeciesName(rng: Rng): string {
  const syllables = 2 + Math.floor(rng() * 2);
  let name = "";
  for (let i = 0; i < syllables; i++) {
    name += pick(ONSETS, rng) + pick(NUCLEI, rng);
    if (i === syllables - 1) name += pick(CODAS, rng);
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function surpriseBodyPlan(rng: Rng): string {
  return pick(BODY_PLAN_IDS, rng);
}

// ---------------------------------------------------------------------------
// Seed payload
// ---------------------------------------------------------------------------

export type SeedKey = "star" | "planet" | "species";

export interface SeedEntity {
  key: SeedKey;
  entity_type: "star" | "planet" | "species";
  name: string;
  cascade_stage: CascadeStage;
  /** Instrument readout for the Codex card. Data, never prose. */
  summary: string;
  /** The writer's own words, verbatim, or empty. */
  description: string;
  metadata: Record<string, unknown>;
}

export interface SeedConnection {
  source: SeedKey;
  target: SeedKey;
  relationship_type: string;
  cascade_stage: ConnectionCascadeStage;
}

export interface SeedDocument {
  title: string;
  /** Inspector metadata, by seed key; resolved to ids once rows exist. */
  setInPlace: SeedKey | null;
  subject: SeedKey | null;
}

export interface SeedPayload {
  worldName: string;
  entities: SeedEntity[];
  connections: SeedConnection[];
  document: SeedDocument;
}

/** Round to `sig` significant figures, as a plain number. */
export function sig(value: number, digits = 3): number {
  if (!Number.isFinite(value) || value === 0) return value;
  return Number(value.toPrecision(digits));
}

function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Turn the wizard's choices into the rows to write.
 *
 * Pure. Names fall back to the world name so nothing is ever untitled; the
 * species line is the writer's own text, kept verbatim. Connections use the
 * one vocabulary (entity-graph-types RELATIONSHIP_TYPES_BY_STAGE).
 */
export function buildSeedPayload(choices: SurveyChoices): SeedPayload {
  const worldName = clean(choices.worldName) || "Unnamed World";
  const entities: SeedEntity[] = [];
  const connections: SeedConnection[] = [];

  const star = choices.star ? deriveStar(choices.star.classId) : null;
  if (choices.star && star) {
    const p = star.preset;
    entities.push({
      key: "star",
      entity_type: "star",
      name: clean(choices.star.name) || `${worldName} Primary`,
      cascade_stage: "physics",
      summary: `${star.designation} · ${sig(p.luminosity)} L☉ · ${p.temperature} K`,
      description: "",
      metadata: {
        spectralClass: p.spectralClass,
        spectralType: star.designation,
        mass: p.mass,
        luminosity: p.luminosity,
        temperature: p.temperature,
        hzInnerAU: sig(star.hz.runawayGreenhouse),
        hzOuterAU: sig(star.hz.maxGreenhouse),
        hzOptimisticInnerAU: sig(star.hz.recentVenus),
        hzOptimisticOuterAU: sig(star.hz.earlyMars),
        snowlineAU: sig(star.hz.snowline),
        seededBy: SEED_SOURCE,
      },
    });
  }

  const planet = choices.planet ? derivePlanet(choices.planet.presetId, star) : null;
  if (choices.planet && planet) {
    const name = clean(choices.planet.name) || worldName;
    const o = planet.orbit;
    const summaryParts = [
      planet.preset.label.toUpperCase(),
      `${sig(planet.gravity)} g`,
      ...(o ? [`${sig(o.distanceAU)} AU`, o.inHabitableZone ? "IN HZ" : "OUTSIDE HZ"] : []),
    ];
    entities.push({
      key: "planet",
      entity_type: "planet",
      name,
      cascade_stage: "environment",
      summary: summaryParts.join(" · "),
      description: "",
      metadata: {
        // Keys below match ENTITY_MASTER_FIELDS.planet.
        mass: sig(planet.mass),
        radius: sig(planet.radius),
        surfaceGravity: sig(planet.gravity),
        composition: planet.preset.composition,
        ...(star ? { starType: star.designation, stellarLuminosity: star.preset.luminosity } : {}),
        ...(o
          ? {
              orbitalDistance: sig(o.distanceAU),
              surfaceTemperature: Math.round(o.surfaceK),
              equilibriumTemperature: Math.round(o.equilibriumK),
              orbitalPeriodDays: sig(o.periodDays),
              habitableZone: o.zone,
              inHabitableZone: o.inHabitableZone,
              inConservativeHabitableZone: o.inConservativeZone,
            }
          : {}),
        planetType: planet.preset.id,
        gravityRegime: planet.gravityRegime,
        tidallyLocked: planet.preset.tidallyLocked,
        insolation: planet.preset.insolation,
        seededBy: SEED_SOURCE,
      },
    });
    if (star) {
      connections.push({ source: "planet", target: "star", relationship_type: "orbits", cascade_stage: "physics" });
      if (planet.preset.tidallyLocked) {
        connections.push({
          source: "planet",
          target: "star",
          relationship_type: "tidally_locked_to",
          cascade_stage: "physics",
        });
      }
    }
  }

  if (choices.species) {
    const name = clean(choices.species.name);
    const plan = BODY_PLAN_PRESETS.find((b) => b.id === choices.species!.bodyPlanId);
    // A species with neither a name nor a body plan is a skipped step.
    if (name || plan) {
      const line = (choices.species.line ?? "").trim();
      const speciesName = name || "Unnamed Species";
      entities.push({
        key: "species",
        entity_type: "species",
        name: speciesName,
        cascade_stage: "biology",
        summary: plan ? `${plan.label.toUpperCase()} BODY PLAN` : "",
        description: line,
        metadata: {
          speciesName,
          ...(plan ? { bodyPlan: plan.id } : {}),
          seededBy: SEED_SOURCE,
        },
      });
      if (entities.some((e) => e.key === "planet")) {
        connections.push({ source: "species", target: "planet", relationship_type: "inhabits", cascade_stage: "biology" });
      }
    }
  }

  const hasPlanet = entities.some((e) => e.key === "planet");
  return {
    worldName,
    entities,
    connections,
    document: {
      title: FIRST_DOCUMENT_TITLE,
      setInPlace: hasPlanet ? "planet" : null,
      subject: hasPlanet ? "planet" : entities.some((e) => e.key === "star") ? "star" : null,
    },
  };
}
