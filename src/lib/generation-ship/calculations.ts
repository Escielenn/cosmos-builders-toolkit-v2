// ---------------------------------------------------------------------------
// Generation Ship Designer (Ark): pure calculation engine.
//
// No React, no network. The page, the PDF template, the fact extractor and
// the tests all call the same functions, so a number shown on screen is the
// number that reaches the writing surface.
//
// Relativistic voyage time is not re-derived here: it comes from Paradox's
// own engine (src/lib/time-dilation/calculations.ts), so the two tools can
// never disagree about how long the same trip takes.
// ---------------------------------------------------------------------------

import {
  calculateBrachistochrone,
  calculateConstantVelocity,
  LY_IN_METERS,
  SECONDS_PER_YEAR,
} from "@/lib/time-dilation/calculations";
import {
  getIsolationModifier,
  getPopulationModifier,
} from "@/lib/lexdrift/calculations";
import { getDivergenceSeverity, SEVERITY_LABELS, type DivergenceSeverity } from "@/lib/lexdrift/data";
import {
  F_DANGER,
  F_FIRST_COUSIN,
  G0,
  ORAL_HORIZON_GENERATIONS,
  PER_CAPITA_KG_PER_DAY,
  PERSON_HEIGHT_M,
  RPM_ADAPTABLE,
  RPM_COMFORT,
  SWADESH_RETENTION_PER_MILLENNIUM,
  WALKING_SPEED_MS,
} from "./data";

export const DAYS_PER_YEAR = 365.25;

// ─── Form state ─────────────────────────────────────────────────────────

export interface Provenance {
  /** Tool slug the value was imported from. */
  tool: string;
  worksheetId: string;
  worksheetTitle: string;
}

export interface GenShipFormState {
  version: 1;
  identity: {
    shipName: string;
    originName: string;
    destinationName: string;
    speciesName: string;
    /** Departure year in the world's own calendar. Drift events are dated from it. */
    launchYear: number;
  };
  voyage: {
    distanceLy: number;
    /** Cruise speed as a fraction of c. */
    cruiseFractionC: number;
    /** Proper acceleration during boost and braking, in g. 0 = treat the ship as already at cruise. */
    accelG: number;
  };
  population: {
    founding: number;
    /** Share of the census population who are parents in any one generation, %. */
    breedingPct: number;
    /** Female share of breeders, %. */
    femalePct: number;
    /** Variance in offspring number per parent (Vk). */
    familySizeVariance: number;
    generationYears: number;
    lifespanYears: number;
    meanAgeAtLaunch: number;
    bank: {
      enabled: boolean;
      /** Share of each generation's births drawn from the frozen bank, %. */
      contributionPct: number;
      /** Embryos or gamete pairs on board at launch. */
      samples: number;
    };
  };
  lifeSupport: {
    airEfficiencyPct: number;
    waterEfficiencyPct: number;
    foodEfficiencyPct: number;
    /** Stored reserve, in days of full consumption, per loop. */
    reserveDays: number;
    cropAreaPerPerson: number;
    livingAreaPerPerson: number;
  };
  habitat: {
    shape: "ring" | "cylinder";
    radiusM: number;
    rpm: number;
    /** Ring width, or cylinder length, along the spin axis. */
    lengthM: number;
    decks: number;
    deckHeightM: number;
    shieldingTPerM2: number;
  };
  notes: {
    shipboardLife: string;
    forgotten: string;
  };
  /** Field path → where its value was imported from. Cleared when the writer edits the field. */
  provenance: Record<string, Provenance>;
  /** Drift event id → chronicle_events.id, so a logged event is never logged twice. */
  loggedEvents: Record<string, string>;
  /** Rounded snapshot of the computed values, written on save so the rest of the product can read them. */
  derived?: DerivedSnapshot;
  generalNotes: string;
  moodboard: unknown[];
}

export const INITIAL_GENSHIP_STATE: GenShipFormState = {
  version: 1,
  identity: {
    shipName: "",
    originName: "Sol",
    destinationName: "",
    speciesName: "",
    launchYear: 2400,
  },
  voyage: { distanceLy: 4.24, cruiseFractionC: 0.01, accelG: 0.01 },
  population: {
    founding: 1000,
    breedingPct: 50,
    femalePct: 50,
    familySizeVariance: 2,
    generationYears: 28,
    lifespanYears: 80,
    meanAgeAtLaunch: 30,
    bank: { enabled: false, contributionPct: 10, samples: 5000 },
  },
  lifeSupport: {
    airEfficiencyPct: 99.5,
    waterEfficiencyPct: 99.5,
    foodEfficiencyPct: 98,
    reserveDays: 365,
    cropAreaPerPerson: 45,
    livingAreaPerPerson: 40,
  },
  habitat: {
    shape: "ring",
    radiusM: 224,
    rpm: 2,
    lengthM: 120,
    decks: 3,
    deckHeightM: 4,
    shieldingTPerM2: 4.5,
  },
  notes: { shipboardLife: "", forgotten: "" },
  provenance: {},
  loggedEvents: {},
  generalNotes: "",
  moodboard: [],
};

// ─── Small numeric helpers ──────────────────────────────────────────────

function num(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function str(raw: unknown, fallback = ""): string {
  return typeof raw === "string" ? raw : fallback;
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Coerce whatever a worksheet row holds into a complete form state.
 *
 * Saved rows can be older than the current shape, and entity prepopulation can
 * drop a string ("1,200 crew") where a number belongs. Every field falls back
 * to its default rather than letting NaN reach the physics.
 */
export function normalizeGenShipState(raw: unknown): GenShipFormState {
  const d = obj(raw);
  const def = INITIAL_GENSHIP_STATE;
  const id = obj(d.identity);
  const vo = obj(d.voyage);
  const po = obj(d.population);
  const bk = obj(po.bank);
  const ls = obj(d.lifeSupport);
  const ha = obj(d.habitat);
  const no = obj(d.notes);

  const provenance: Record<string, Provenance> = {};
  for (const [k, v] of Object.entries(obj(d.provenance))) {
    const p = obj(v);
    if (typeof p.tool === "string" && typeof p.worksheetId === "string") {
      provenance[k] = { tool: p.tool, worksheetId: p.worksheetId, worksheetTitle: str(p.worksheetTitle) };
    }
  }
  const loggedEvents: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(d.loggedEvents))) {
    if (typeof v === "string") loggedEvents[k] = v;
  }

  return {
    version: 1,
    identity: {
      shipName: str(id.shipName, def.identity.shipName),
      originName: str(id.originName, def.identity.originName),
      destinationName: str(id.destinationName, def.identity.destinationName),
      speciesName: str(id.speciesName, def.identity.speciesName),
      launchYear: Math.round(num(id.launchYear, def.identity.launchYear)),
    },
    voyage: {
      distanceLy: Math.max(0, num(vo.distanceLy, def.voyage.distanceLy)),
      cruiseFractionC: clamp(num(vo.cruiseFractionC, def.voyage.cruiseFractionC), 0, 0.999),
      accelG: Math.max(0, num(vo.accelG, def.voyage.accelG)),
    },
    population: {
      founding: Math.max(0, Math.round(num(po.founding, def.population.founding))),
      breedingPct: clamp(num(po.breedingPct, def.population.breedingPct), 1, 100),
      femalePct: clamp(num(po.femalePct, def.population.femalePct), 1, 99),
      familySizeVariance: Math.max(0, num(po.familySizeVariance, def.population.familySizeVariance)),
      generationYears: Math.max(0.1, num(po.generationYears, def.population.generationYears)),
      lifespanYears: Math.max(0.2, num(po.lifespanYears, def.population.lifespanYears)),
      meanAgeAtLaunch: Math.max(0, num(po.meanAgeAtLaunch, def.population.meanAgeAtLaunch)),
      bank: {
        enabled: bk.enabled === true,
        contributionPct: clamp(num(bk.contributionPct, def.population.bank.contributionPct), 0, 100),
        samples: Math.max(0, Math.round(num(bk.samples, def.population.bank.samples))),
      },
    },
    lifeSupport: {
      airEfficiencyPct: clamp(num(ls.airEfficiencyPct, def.lifeSupport.airEfficiencyPct), 0, 100),
      waterEfficiencyPct: clamp(num(ls.waterEfficiencyPct, def.lifeSupport.waterEfficiencyPct), 0, 100),
      foodEfficiencyPct: clamp(num(ls.foodEfficiencyPct, def.lifeSupport.foodEfficiencyPct), 0, 100),
      reserveDays: Math.max(0, num(ls.reserveDays, def.lifeSupport.reserveDays)),
      cropAreaPerPerson: Math.max(0, num(ls.cropAreaPerPerson, def.lifeSupport.cropAreaPerPerson)),
      livingAreaPerPerson: Math.max(0, num(ls.livingAreaPerPerson, def.lifeSupport.livingAreaPerPerson)),
    },
    habitat: {
      shape: ha.shape === "cylinder" ? "cylinder" : "ring",
      radiusM: Math.max(0, num(ha.radiusM, def.habitat.radiusM)),
      rpm: Math.max(0, num(ha.rpm, def.habitat.rpm)),
      lengthM: Math.max(0, num(ha.lengthM, def.habitat.lengthM)),
      decks: clamp(Math.round(num(ha.decks, def.habitat.decks)), 1, 50),
      deckHeightM: Math.max(0.5, num(ha.deckHeightM, def.habitat.deckHeightM)),
      shieldingTPerM2: Math.max(0, num(ha.shieldingTPerM2, def.habitat.shieldingTPerM2)),
    },
    notes: {
      shipboardLife: str(no.shipboardLife),
      forgotten: str(no.forgotten),
    },
    provenance,
    loggedEvents,
    derived: d.derived ? (obj(d.derived) as unknown as DerivedSnapshot) : undefined,
    generalNotes: str(d.generalNotes),
    moodboard: Array.isArray(d.moodboard) ? d.moodboard : [],
  };
}

// ─── Voyage ─────────────────────────────────────────────────────────────

export interface VoyageResult {
  valid: boolean;
  error?: string;
  distanceLy: number;
  /** Coordinate time, the home-world frame. */
  earthYears: number;
  /** Proper time aboard. */
  shipYears: number;
  lorentzFactor: number;
  peakFractionC: number;
  /** Home-frame years spent boosting (and the same again braking). 0 when coasting only. */
  boostYearsEach: number;
  /** True if the ship reaches its cruise speed before the midpoint. */
  reachesCruise: boolean;
  /** Home-frame years from launch to the start of the braking burn. */
  turnoverEarthYears: number;
}

export function computeVoyage(v: GenShipFormState["voyage"]): VoyageResult {
  const base: VoyageResult = {
    valid: false,
    distanceLy: v.distanceLy,
    earthYears: 0,
    shipYears: 0,
    lorentzFactor: 1,
    peakFractionC: 0,
    boostYearsEach: 0,
    reachesCruise: true,
    turnoverEarthYears: 0,
  };
  if (!(v.distanceLy > 0)) return { ...base, error: "SET A VOYAGE DISTANCE." };
  if (!(v.cruiseFractionC > 0)) return { ...base, error: "SET A CRUISE SPEED." };
  if (v.cruiseFractionC >= 1) return { ...base, error: "CRUISE SPEED MUST STAY BELOW c." };

  const meters = v.distanceLy * LY_IN_METERS;
  const r = v.accelG > 0
    ? calculateBrachistochrone(meters, v.accelG, v.cruiseFractionC, false)
    : calculateConstantVelocity(meters, v.cruiseFractionC, false);
  if (!r.valid) return { ...base, error: r.error ?? "VOYAGE UNRESOLVED." };

  const earthYears = r.observerTimeSeconds / SECONDS_PER_YEAR;
  const shipYears = r.shipTimeSeconds / SECONDS_PER_YEAR;
  const boost = v.accelG > 0 ? (r.accelerationPhaseSeconds ?? 0) / SECONDS_PER_YEAR : 0;
  return {
    valid: true,
    distanceLy: v.distanceLy,
    earthYears,
    shipYears,
    lorentzFactor: r.lorentzFactor,
    peakFractionC: r.peakVelocityFraction,
    boostYearsEach: boost,
    reachesCruise: v.accelG > 0 ? r.peakVelocityCapped === true : true,
    turnoverEarthYears: v.accelG > 0 ? earthYears - boost : earthYears,
  };
}

// ─── Population genetics ────────────────────────────────────────────────

export interface EffectivePopulation {
  breeders: number;
  males: number;
  females: number;
  /** Wright's sex-ratio Ne: 4·Nm·Nf / (Nm + Nf). */
  neSexRatio: number;
  /** Crow's family-size factor, 4 / (Vk + 2). */
  varianceFactor: number;
  ne: number;
  /** Ne as a share of the census population. */
  neOverN: number;
}

export function effectivePopulation(p: GenShipFormState["population"]): EffectivePopulation {
  const breeders = p.founding * (p.breedingPct / 100);
  const females = breeders * (p.femalePct / 100);
  const males = breeders - females;
  const neSexRatio = males + females > 0 ? (4 * males * females) / (males + females) : 0;
  const varianceFactor = 4 / (p.familySizeVariance + 2);
  const ne = neSexRatio * varianceFactor;
  return {
    breeders,
    males,
    females,
    neSexRatio,
    varianceFactor,
    ne,
    neOverN: p.founding > 0 ? ne / p.founding : 0,
  };
}

/** F after t generations of drift in an isolated population, F_t = 1 − (1 − 1/2Ne)^t. Real t allowed. */
export function inbreedingAt(ne: number, t: number): number {
  if (!(ne > 0)) return 1;
  if (t <= 0) return 0;
  if (ne <= 0.5) return 1;
  return 1 - Math.pow(1 - 1 / (2 * ne), t);
}

/** Generations until F reaches `target` with no bank, or Infinity. */
export function generationsToReach(ne: number, target: number): number {
  if (target <= 0) return 0;
  if (target >= 1 || !(ne > 0.5)) return ne > 0.5 ? Infinity : 0;
  return Math.log(1 - target) / Math.log(1 - 1 / (2 * ne));
}

/** Smallest Ne that keeps F at or below `target` after t generations. */
export function neRequiredFor(target: number, t: number): number {
  if (t <= 0 || target >= 1) return 0;
  if (target <= 0) return Infinity;
  const perGen = 1 - Math.pow(1 - target, 1 / t);
  return 1 / (2 * perGen);
}

export interface GeneticsResult {
  eff: EffectivePopulation;
  generations: number;
  /** F at the start of each whole generation, index 0 = launch, through ceil(generations). */
  fSeries: number[];
  fAtArrival: number;
  heterozygosityRetained: number;
  /** Generation (fractional) where F crosses the first-cousin and danger lines, or null. */
  firstCousinGeneration: number | null;
  dangerGeneration: number | null;
  /** Ne needed to arrive at or below first-cousin F. */
  neNeededFirstCousin: number;
  bank: {
    enabled: boolean;
    /** Migration-equivalent rate m per generation. */
    m: number;
    birthsPerGeneration: number;
    usedPerGeneration: number;
    /** Generations of contribution before the bank is empty, Infinity if never drawn. */
    lastsGenerations: number;
    exhaustedBeforeArrival: boolean;
  };
}

/**
 * Inbreeding through the voyage.
 *
 * Without a bank this is the closed form. With one, each generation a share m
 * of births comes from unrelated frozen donors, which acts like immigration in
 * Wright's island model: F' = [1/2Ne + (1 − 1/2Ne)·F] · (1 − m)². The bank
 * stops contributing once it runs out.
 */
export function computeGenetics(form: GenShipFormState, shipYears: number): GeneticsResult {
  const p = form.population;
  const eff = effectivePopulation(p);
  const generations = shipYears > 0 ? shipYears / p.generationYears : 0;
  const steps = Math.max(1, Math.ceil(generations));

  const birthsPerGeneration = p.founding * (p.generationYears / p.lifespanYears);
  const m = p.bank.enabled ? clamp(p.bank.contributionPct / 100, 0, 1) : 0;
  const usedPerGeneration = m * birthsPerGeneration;
  const lastsGenerations = usedPerGeneration > 0 ? p.bank.samples / usedPerGeneration : Infinity;

  const fSeries: number[] = [0];
  const ne = eff.ne;
  const drift = ne > 0.5 ? 1 / (2 * ne) : 1;
  let f = 0;
  for (let g = 1; g <= steps; g++) {
    // The share of this generation's bank draw that the stock still covers.
    const coverage = m > 0 ? clamp(lastsGenerations - (g - 1), 0, 1) : 0;
    const mg = m * coverage;
    f = (drift + (1 - drift) * f) * (1 - mg) * (1 - mg);
    fSeries.push(f);
  }

  const fAt = (t: number): number => {
    if (t <= 0) return 0;
    if (m === 0) return inbreedingAt(ne, t);
    const lo = Math.floor(t);
    const hi = Math.min(fSeries.length - 1, lo + 1);
    const frac = t - lo;
    return fSeries[lo] + (fSeries[hi] - fSeries[lo]) * frac;
  };

  const crossing = (target: number): number | null => {
    if (m === 0) {
      const g = generationsToReach(ne, target);
      return Number.isFinite(g) && g <= generations ? g : null;
    }
    for (let g = 1; g < fSeries.length; g++) {
      if (fSeries[g] >= target) {
        const prev = fSeries[g - 1];
        const t = g - 1 + (target - prev) / (fSeries[g] - prev || 1);
        return t <= generations ? t : null;
      }
    }
    return null;
  };

  const fAtArrival = fAt(generations);
  return {
    eff,
    generations,
    fSeries,
    fAtArrival,
    heterozygosityRetained: 1 - fAtArrival,
    firstCousinGeneration: crossing(F_FIRST_COUSIN),
    dangerGeneration: crossing(F_DANGER),
    neNeededFirstCousin: neRequiredFor(F_FIRST_COUSIN, generations),
    bank: {
      enabled: p.bank.enabled,
      m,
      birthsPerGeneration,
      usedPerGeneration,
      lastsGenerations,
      exhaustedBeforeArrival: m > 0 && lastsGenerations < generations,
    },
  };
}

// ─── Closed-loop life support ───────────────────────────────────────────

export type LoopId = "air" | "water" | "food";

export interface LoopResult {
  id: LoopId;
  label: string;
  perCapitaKgDay: number;
  efficiency: number; // 0..1
  /** Mass the loop fails to recover, whole crew, kg/day. */
  makeupKgDay: number;
  /** Days of operation before reserves run dry; Infinity for a perfect loop. */
  daysToFailure: number;
  failsBeforeArrival: boolean;
  /** Efficiency at which reserves exactly last the voyage. */
  requiredEfficiency: number;
}

export interface LifeSupportResult {
  loops: LoopResult[];
  /** Mass-weighted closed-loop efficiency across O2, water and food. */
  closedLoopEfficiency: number;
  co2KgDay: number;
  reserveTonnes: number;
  voyageDays: number;
  /** Earliest loop failure in ship-days, Infinity if none. */
  firstFailureDays: number;
  firstFailureLoop: LoopId | null;
}

export function daysToFailure(reserveDays: number, efficiency: number): number {
  const loss = 1 - efficiency;
  if (loss <= 0) return Infinity;
  return reserveDays / loss;
}

export function computeLifeSupport(form: GenShipFormState, shipYears: number): LifeSupportResult {
  const ls = form.lifeSupport;
  const n = form.population.founding;
  const voyageDays = shipYears * DAYS_PER_YEAR;
  const defs: { id: LoopId; label: string; perCapita: number; pct: number }[] = [
    { id: "air", label: "Oxygen", perCapita: PER_CAPITA_KG_PER_DAY.oxygen, pct: ls.airEfficiencyPct },
    { id: "water", label: "Water", perCapita: PER_CAPITA_KG_PER_DAY.water, pct: ls.waterEfficiencyPct },
    { id: "food", label: "Food", perCapita: PER_CAPITA_KG_PER_DAY.food, pct: ls.foodEfficiencyPct },
  ];
  const loops: LoopResult[] = defs.map((d) => {
    const eff = clamp(d.pct / 100, 0, 1);
    const dtf = daysToFailure(ls.reserveDays, eff);
    return {
      id: d.id,
      label: d.label,
      perCapitaKgDay: d.perCapita,
      efficiency: eff,
      makeupKgDay: n * d.perCapita * (1 - eff),
      daysToFailure: dtf,
      failsBeforeArrival: voyageDays > 0 && dtf < voyageDays,
      requiredEfficiency: voyageDays > 0 ? clamp(1 - ls.reserveDays / voyageDays, 0, 1) : 0,
    };
  });
  const totalMass = loops.reduce((s, l) => s + l.perCapitaKgDay, 0);
  const closedLoopEfficiency = loops.reduce((s, l) => s + l.perCapitaKgDay * l.efficiency, 0) / totalMass;
  let firstFailureDays = Infinity;
  let firstFailureLoop: LoopId | null = null;
  for (const l of loops) {
    if (l.failsBeforeArrival && l.daysToFailure < firstFailureDays) {
      firstFailureDays = l.daysToFailure;
      firstFailureLoop = l.id;
    }
  }
  return {
    loops,
    closedLoopEfficiency,
    co2KgDay: n * PER_CAPITA_KG_PER_DAY.carbonDioxide,
    reserveTonnes: (ls.reserveDays * n * totalMass) / 1000,
    voyageDays,
    firstFailureDays,
    firstFailureLoop,
  };
}

// ─── Habitat ────────────────────────────────────────────────────────────

export type SpinComfort = "none" | "comfortable" | "adaptable" | "severe";

export interface DeckResult {
  index: number;
  radiusM: number;
  g: number;
  areaM2: number;
}

export interface HabitatResult {
  omega: number; // rad/s
  rimG: number;
  rimSpeedMs: number;
  comfort: SpinComfort;
  /** Coriolis acceleration on a walker at 1.4 m/s, as a share of local g. */
  coriolisRatio: number;
  /** Fractional drop in g from feet to head for a 1.8 m person at the rim. */
  headToFootGradient: number;
  /** Radius that gives 1 g at the comfort limit of 2 rpm. */
  radiusFor1gAtComfort: number;
  decks: DeckResult[];
  availableAreaM2: number;
  cropAreaM2: number;
  livingAreaM2: number;
  /** Crop + living, plus 25% for corridors, machinery, storage. */
  requiredAreaM2: number;
  areaSufficient: boolean;
  shieldAreaM2: number;
  shieldMassTonnes: number;
}

export const INFRASTRUCTURE_OVERHEAD = 0.25;

export function spinGravity(radiusM: number, rpm: number): number {
  const w = (rpm * 2 * Math.PI) / 60;
  return (w * w * radiusM) / G0;
}

export function spinComfort(rpm: number): SpinComfort {
  if (rpm <= 0) return "none";
  if (rpm <= RPM_COMFORT) return "comfortable";
  if (rpm <= RPM_ADAPTABLE) return "adaptable";
  return "severe";
}

export function computeHabitat(form: GenShipFormState): HabitatResult {
  const h = form.habitat;
  const ls = form.lifeSupport;
  const n = form.population.founding;
  const omega = (h.rpm * 2 * Math.PI) / 60;
  const rimG = (omega * omega * h.radiusM) / G0;

  const decks: DeckResult[] = [];
  for (let k = 0; k < h.decks; k++) {
    const r = h.radiusM - k * h.deckHeightM;
    if (r <= 0) break;
    decks.push({
      index: k,
      radiusM: r,
      g: (omega * omega * r) / G0,
      areaM2: 2 * Math.PI * r * h.lengthM,
    });
  }
  const availableAreaM2 = decks.reduce((s, d) => s + d.areaM2, 0);

  const cropAreaM2 = n * ls.cropAreaPerPerson * clamp(ls.foodEfficiencyPct / 100, 0, 1);
  const livingAreaM2 = n * ls.livingAreaPerPerson;
  const requiredAreaM2 = (cropAreaM2 + livingAreaM2) * (1 + INFRASTRUCTURE_OVERHEAD);

  // Shield the occupied band: outer hull, inner hull, and the two side walls.
  const depth = Math.min(h.radiusM, h.decks * h.deckHeightM);
  const inner = h.radiusM - depth;
  const shieldAreaM2 =
    2 * Math.PI * h.radiusM * h.lengthM +
    2 * Math.PI * inner * h.lengthM +
    2 * Math.PI * (h.radiusM * h.radiusM - inner * inner);

  const localG = rimG * G0;
  return {
    omega,
    rimG,
    rimSpeedMs: omega * h.radiusM,
    comfort: spinComfort(h.rpm),
    coriolisRatio: localG > 0 ? (2 * omega * WALKING_SPEED_MS) / localG : 0,
    headToFootGradient: h.radiusM > 0 ? Math.min(1, PERSON_HEIGHT_M / h.radiusM) : 0,
    radiusFor1gAtComfort: G0 / Math.pow((RPM_COMFORT * 2 * Math.PI) / 60, 2),
    decks,
    availableAreaM2,
    cropAreaM2,
    livingAreaM2,
    requiredAreaM2,
    areaSufficient: availableAreaM2 >= requiredAreaM2,
    shieldAreaM2,
    shieldMassTonnes: shieldAreaM2 * h.shieldingTPerM2,
  };
}

// ─── Social drift ───────────────────────────────────────────────────────

export interface DriftResult {
  /** Core vocabulary the ship still shares with the home world on arrival (both lines drift). */
  sharedCoreVocabulary: number;
  /** Core vocabulary the ship keeps from its own launch language. */
  retainedCoreVocabulary: number;
  /** LexDrift's model, same modifiers as the LexDrift tool. */
  lexdrift: {
    isolation: string;
    divergencePct: number;
    intelligibilityPct: number;
    severity: DivergenceSeverity;
    severityLabel: string;
  };
  /** Ship-years until the last person born on the home world dies. */
  lastHomeBornYears: number;
  /** Ship-years until no one alive heard about home from someone born there. */
  secondHandMemoryEndsYears: number;
  /** Ship-years until launch passes beyond the oral horizon (~3 generations). */
  oralHorizonYears: number;
}

export function isolationForDistance(ly: number): string {
  if (ly < 5) return "low";
  if (ly < 20) return "moderate";
  if (ly < 100) return "high";
  return "extreme";
}

/** LexDrift's per-generation base rate and generation length, kept identical to that tool. */
const LEXDRIFT_BASE_RATE = 0.005;
const LEXDRIFT_GENERATION_YEARS = 25;

export function computeDrift(form: GenShipFormState, shipYears: number, distanceLy: number): DriftResult {
  const p = form.population;
  const millennia = shipYears / 1000;
  const isolation = isolationForDistance(distanceLy);
  const mod = getPopulationModifier(p.founding) * getIsolationModifier(isolation);
  const rate = LEXDRIFT_BASE_RATE * mod;
  const divergencePct = Math.min(100, (1 - Math.pow(1 - rate, shipYears / LEXDRIFT_GENERATION_YEARS)) * 100);
  const severity = getDivergenceSeverity(divergencePct);

  const lastHomeBornYears = Math.max(0, p.lifespanYears - p.meanAgeAtLaunch);
  // The youngest who heard home described firsthand, at about age ten, outlives
  // the last home-born by one lifespan less those ten years.
  const secondHandMemoryEndsYears = lastHomeBornYears + Math.max(0, p.lifespanYears - Math.min(10, p.lifespanYears / 8));

  return {
    sharedCoreVocabulary: Math.pow(SWADESH_RETENTION_PER_MILLENNIUM, 2 * millennia),
    retainedCoreVocabulary: Math.pow(SWADESH_RETENTION_PER_MILLENNIUM, millennia),
    lexdrift: {
      isolation,
      divergencePct,
      intelligibilityPct: Math.max(0, 100 - divergencePct * 1.5),
      severity,
      severityLabel: SEVERITY_LABELS[severity],
    },
    lastHomeBornYears,
    secondHandMemoryEndsYears,
    oralHorizonYears: ORAL_HORIZON_GENERATIONS * p.generationYears,
  };
}

// ─── Warnings ───────────────────────────────────────────────────────────

export type WarningLevel = "caution" | "danger";

export interface GenShipWarning {
  id: string;
  level: WarningLevel;
  section: "voyage" | "genetics" | "lifeSupport" | "habitat";
  /** Ship's Voice, uppercase. */
  message: string;
}

// ─── Everything together ────────────────────────────────────────────────

export interface GenShipResults {
  voyage: VoyageResult;
  genetics: GeneticsResult;
  lifeSupport: LifeSupportResult;
  habitat: HabitatResult;
  drift: DriftResult;
  warnings: GenShipWarning[];
}

function fmtYears(y: number): string {
  if (!Number.isFinite(y)) return "NEVER";
  if (y < 10) return `${y.toFixed(1)} YEARS`;
  return `${Math.round(y).toLocaleString("en-US")} YEARS`;
}

export function computeGenShip(form: GenShipFormState): GenShipResults {
  const voyage = computeVoyage(form.voyage);
  const shipYears = voyage.valid ? voyage.shipYears : 0;
  const genetics = computeGenetics(form, shipYears);
  const lifeSupport = computeLifeSupport(form, shipYears);
  const habitat = computeHabitat(form);
  const drift = computeDrift(form, shipYears, form.voyage.distanceLy);

  const warnings: GenShipWarning[] = [];
  if (!voyage.valid) {
    warnings.push({ id: "voyage-invalid", level: "caution", section: "voyage", message: voyage.error ?? "VOYAGE UNRESOLVED." });
  }
  if (voyage.valid && genetics.generations < 1) {
    warnings.push({ id: "not-generational", level: "caution", section: "voyage", message: "VOYAGE SHORTER THAN ONE GENERATION. THIS IS A CREWED SHIP, NOT AN ARK." });
  }
  if (genetics.fAtArrival > F_DANGER) {
    warnings.push({
      id: "f-danger",
      level: "danger",
      section: "genetics",
      message: `INBREEDING COEFFICIENT ${genetics.fAtArrival.toFixed(3)} AT ARRIVAL. ABOVE 0.1. EXPECT INHERITED DISEASE IN EVERY FAMILY.`,
    });
  } else if (genetics.fAtArrival > F_FIRST_COUSIN) {
    warnings.push({
      id: "f-caution",
      level: "caution",
      section: "genetics",
      message: `INBREEDING COEFFICIENT ${genetics.fAtArrival.toFixed(3)} AT ARRIVAL. EVERY CHILD IS RELATED LIKE FIRST COUSINS.`,
    });
  }
  if (genetics.eff.ne < 50 && form.population.founding > 0) {
    warnings.push({ id: "ne-50", level: "danger", section: "genetics", message: `EFFECTIVE POPULATION ${Math.round(genetics.eff.ne)}. BELOW THE 50 LINE. INBREEDING DEPRESSION WITHIN A FEW GENERATIONS.` });
  }
  if (genetics.bank.exhaustedBeforeArrival) {
    warnings.push({ id: "bank-empty", level: "caution", section: "genetics", message: `GENETIC BANK EXHAUSTED AFTER ${genetics.bank.lastsGenerations.toFixed(1)} GENERATIONS. DRIFT RESUMES UNCHECKED.` });
  }
  if (lifeSupport.firstFailureLoop) {
    const loop = lifeSupport.loops.find((l) => l.id === lifeSupport.firstFailureLoop)!;
    warnings.push({
      id: "loop-fails",
      level: "danger",
      section: "lifeSupport",
      message: `${loop.label.toUpperCase()} RESERVES EXHAUSTED IN ${fmtYears(loop.daysToFailure / DAYS_PER_YEAR)}. ARRIVAL IN ${fmtYears(shipYears)}. RAISE RECOVERY TO ${(loop.requiredEfficiency * 100).toFixed(2)}% OR CARRY MORE.`,
    });
  }
  if (habitat.comfort === "severe") {
    warnings.push({ id: "rpm-severe", level: "danger", section: "habitat", message: `SPIN ${form.habitat.rpm} RPM. ABOVE 4 RPM MOST CREW NEVER ADAPT. EVERY TURN OF THE HEAD BRINGS NAUSEA.` });
  } else if (habitat.comfort === "adaptable") {
    warnings.push({ id: "rpm-adapt", level: "caution", section: "habitat", message: `SPIN ${form.habitat.rpm} RPM. ABOVE THE 2 RPM COMFORT LINE. NEWCOMERS ARE SICK FOR DAYS.` });
  }
  if (habitat.rimG > 0 && (habitat.rimG < 0.3 || habitat.rimG > 1.5)) {
    warnings.push({ id: "g-range", level: "caution", section: "habitat", message: `RIM GRAVITY ${habitat.rimG.toFixed(2)} G. OUTSIDE THE RANGE HUMAN BODIES ARE KNOWN TO TOLERATE LONG TERM.` });
  }
  if (form.population.founding > 0 && !habitat.areaSufficient) {
    warnings.push({
      id: "area-short",
      level: "danger",
      section: "habitat",
      message: `DECK AREA ${Math.round(habitat.availableAreaM2).toLocaleString("en-US")} M². REQUIRED ${Math.round(habitat.requiredAreaM2).toLocaleString("en-US")} M². ADD DECKS, LENGTH OR RADIUS.`,
    });
  }

  return { voyage, genetics, lifeSupport, habitat, drift, warnings };
}

// ─── Snapshot for the rest of the product ───────────────────────────────

export interface DerivedSnapshot {
  shipYears: number;
  earthYears: number;
  generations: number;
  effectivePopulation: number;
  inbreedingAtArrival: number;
  closedLoopEfficiencyPct: number;
  rimGravityG: number;
}

function round(n: number, places: number): number {
  const k = Math.pow(10, places);
  return Math.round(n * k) / k;
}

/** Rounded the way a writer would quote them. Stored on save; read by worksheet-facts via entity-config paths. */
export function buildDerivedSnapshot(r: GenShipResults): DerivedSnapshot | undefined {
  if (!r.voyage.valid) return undefined;
  return {
    shipYears: round(r.voyage.shipYears, 1),
    earthYears: round(r.voyage.earthYears, 1),
    generations: round(r.genetics.generations, 1),
    effectivePopulation: Math.round(r.genetics.eff.ne),
    inbreedingAtArrival: round(r.genetics.fAtArrival, 4),
    closedLoopEfficiencyPct: round(r.lifeSupport.closedLoopEfficiency * 100, 2),
    rimGravityG: round(r.habitat.rimG, 2),
  };
}

/** Ship-time offset → home-calendar offset. Linear scaling; exact for coasting, within γ−1 otherwise. */
export function shipToEarthYears(shipOffset: number, v: VoyageResult): number {
  if (!v.valid || v.shipYears <= 0) return shipOffset;
  return shipOffset * (v.earthYears / v.shipYears);
}
