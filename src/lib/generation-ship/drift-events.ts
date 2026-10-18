// ---------------------------------------------------------------------------
// Generation Ship Designer (Ark): drift events.
//
// The voyage's numbers imply a history. This turns them into candidate
// Chronicle events: milestones the physics forces (last home-born crew member
// dies, inbreeding crosses first-cousin level, the oxygen reserve runs dry)
// and a few social events seeded from the inputs.
//
// Deterministic by construction: the same inputs always produce the same
// events with the same ids and the same years, so an event the writer logged
// is still recognisable after a reload. Nothing here writes anywhere; the
// page offers each event and the writer decides.
// ---------------------------------------------------------------------------

import { F_DANGER, F_FIRST_COUSIN } from "./data";
import {
  DAYS_PER_YEAR,
  shipToEarthYears,
  type GenShipFormState,
  type GenShipResults,
} from "./calculations";

export type DriftLayer = "biology" | "culture" | "technology" | "narrative";

export interface DriftEvent {
  /** Stable id; the key into loggedEvents. */
  id: string;
  kind: "milestone" | "seeded";
  /** Years after launch, ship frame. */
  shipYear: number;
  /** Years after launch, home-calendar frame. */
  earthYear: number;
  /** Generation aboard, 1-based, at the moment of the event. */
  generation: number;
  title: string;
  description: string;
  layer: DriftLayer;
  eventType: "event" | "founding" | "death" | "discovery" | "custom";
}

// ─── Seeded PRNG ────────────────────────────────────────────────────────

/** FNV-1a over a string, for seeding. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: small, fast, good enough for narrative placement. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The inputs that shape the voyage, rounded so cosmetic edits do not reshuffle history. */
export function driftSeed(form: GenShipFormState): number {
  const v = form.voyage;
  const p = form.population;
  const key = [
    form.identity.shipName.trim().toLowerCase(),
    v.distanceLy.toFixed(2),
    v.cruiseFractionC.toFixed(4),
    p.founding,
    p.generationYears.toFixed(1),
    form.lifeSupport.foodEfficiencyPct.toFixed(1),
  ].join("|");
  return hashString(key);
}

// ─── Seeded event pool ──────────────────────────────────────────────────

interface SeededTemplate {
  id: string;
  /** Earliest and latest point in the voyage, as a share of ship-years. */
  window: [number, number];
  layer: DriftLayer;
  eventType: DriftEvent["eventType"];
  applies: (f: GenShipFormState, r: GenShipResults) => boolean;
  title: (f: GenShipFormState, r: GenShipResults) => string;
  description: (f: GenShipFormState, r: GenShipResults) => string;
}

const ship = (f: GenShipFormState) => f.identity.shipName.trim() || "the ship";

const SEEDED: SeededTemplate[] = [
  {
    id: "seeded:ration-council",
    window: [0.15, 0.45],
    layer: "culture",
    eventType: "event",
    applies: (_f, r) => r.lifeSupport.closedLoopEfficiency < 0.999,
    title: () => "The ration council is founded",
    description: (_f, r) =>
      `With the loops recovering ${(r.lifeSupport.closedLoopEfficiency * 100).toFixed(2)}% of what the crew consumes, someone has to decide who gets the rest. The body that decides becomes the most powerful office aboard.`,
  },
  {
    id: "seeded:world-doctrine",
    window: [0.35, 0.7],
    layer: "culture",
    eventType: "event",
    applies: (_f, r) => r.genetics.generations >= 4,
    title: (f) => `A doctrine holds that ${ship(f)} is the world`,
    description: (f) =>
      `No one living has seen ${f.identity.originName || "home"} and no one will see ${f.identity.destinationName || "the destination"}. A teaching spreads that the voyage is not a journey but the whole of creation, and that "arrival" is a metaphor.`,
  },
  {
    id: "seeded:archive-purge",
    window: [0.25, 0.6],
    layer: "technology",
    eventType: "event",
    applies: (_f, r) => r.voyage.shipYears >= 150,
    title: () => "The archive is pruned",
    description: () =>
      "Storage failures force a choice about which records to keep. What is deleted, and who chose, becomes the oldest argument aboard.",
  },
  {
    id: "seeded:breeding-mandate",
    window: [0.1, 0.4],
    layer: "biology",
    eventType: "event",
    applies: (f) => f.population.familySizeVariance <= 1,
    title: () => "Family sizes are fixed by mandate",
    description: (f) =>
      `To hold the effective population up, every couple is assigned children (family-size variance ${f.population.familySizeVariance}). The genetics officer becomes a matchmaker, and refusal becomes a political act.`,
  },
  {
    id: "seeded:first-schism",
    window: [0.4, 0.8],
    layer: "culture",
    eventType: "event",
    applies: (f, r) => f.population.founding >= 300 && r.genetics.generations >= 3,
    title: () => "The first schism",
    description: (f) =>
      `${f.population.founding.toLocaleString("en-US")} people is enough for factions. A dispute over the mission's purpose splits the decks; one faction stops speaking to the other for a generation.`,
  },
  {
    id: "seeded:mutiny-of-the-born",
    window: [0.05, 0.3],
    layer: "narrative",
    eventType: "event",
    applies: (_f, r) => r.genetics.generations >= 2,
    title: () => "The ship-born demand a vote",
    description: () =>
      "The first generation born aboard never consented to the voyage. They outnumber the founders before the founders are ready to hand over the controls.",
  },
];

// ─── Builder ────────────────────────────────────────────────────────────

function generationAt(shipYear: number, f: GenShipFormState): number {
  return Math.floor(shipYear / f.population.generationYears) + 1;
}

export function buildDriftEvents(form: GenShipFormState, r: GenShipResults): DriftEvent[] {
  if (!r.voyage.valid) return [];
  const total = r.voyage.shipYears;
  const g = r.genetics;
  const name = ship(form);
  const events: DriftEvent[] = [];

  const add = (e: Omit<DriftEvent, "earthYear" | "generation">) => {
    if (!(e.shipYear >= 0) || e.shipYear > total + 1e-9) return;
    events.push({
      ...e,
      earthYear: shipToEarthYears(e.shipYear, r.voyage),
      generation: generationAt(e.shipYear, form),
    });
  };

  add({
    id: "launch",
    kind: "milestone",
    shipYear: 0,
    title: `${name} departs ${form.identity.originName || "home"}`,
    description: `${form.population.founding.toLocaleString("en-US")} people board for a voyage of ${form.voyage.distanceLy} light-years. None of them will arrive.`,
    layer: "narrative",
    eventType: "founding",
  });

  if (form.voyage.accelG > 0 && r.voyage.boostYearsEach > 0) {
    // Boost is measured in home years; convert back to ship years for placement.
    const boostShip = r.voyage.boostYearsEach * (r.voyage.shipYears / r.voyage.earthYears);
    add({
      id: "boost-ends",
      kind: "milestone",
      shipYear: boostShip,
      title: "The engines fall silent",
      description: `Boost ends at ${(r.voyage.peakFractionC * 100).toFixed(2)}% of light speed. From here the ship coasts, and the children aboard will grow up never feeling thrust.`,
      layer: "technology",
      eventType: "event",
    });
    const brakeShip = total - boostShip;
    if (brakeShip > boostShip) {
      add({
        id: "braking-burn",
        kind: "milestone",
        shipYear: brakeShip,
        title: "The braking burn begins",
        description: "Weight returns along the axis after generations of coasting. Nobody alive remembers what the drive sounds like.",
        layer: "technology",
        eventType: "event",
      });
    }
  }

  add({
    id: "last-homeborn",
    kind: "milestone",
    shipYear: r.drift.lastHomeBornYears,
    title: `The last person born on ${form.identity.originName || "the home world"} dies`,
    description: "After today, every opinion about home is second-hand.",
    layer: "culture",
    eventType: "death",
  });

  add({
    id: "secondhand-memory-ends",
    kind: "milestone",
    shipYear: r.drift.secondHandMemoryEndsYears,
    title: "Living memory of home ends",
    description: "The last person who heard home described by someone born there dies. What remains is recordings and story.",
    layer: "culture",
    eventType: "event",
  });

  add({
    id: "oral-horizon",
    kind: "milestone",
    shipYear: r.drift.oralHorizonYears,
    title: "The launch passes into origin story",
    description: "Three generations on, the departure is beyond the oral horizon (Vansina's 'floating gap'). The founders begin to be remembered as heroes, not people.",
    layer: "culture",
    eventType: "event",
  });

  const genYears = form.population.generationYears;
  if (g.firstCousinGeneration !== null) {
    add({
      id: "f-first-cousin",
      kind: "milestone",
      shipYear: g.firstCousinGeneration * genYears,
      title: "Everyone aboard is a cousin",
      description: `Average inbreeding reaches ${F_FIRST_COUSIN} (first-cousin level). Recessive conditions that were once rare start appearing in ordinary families.`,
      layer: "biology",
      eventType: "discovery",
    });
  }
  if (g.dangerGeneration !== null) {
    add({
      id: "f-danger",
      kind: "milestone",
      shipYear: g.dangerGeneration * genYears,
      title: "Inbreeding crosses 0.1",
      description: `Average inbreeding reaches ${F_DANGER}. Fertility falls and inherited disease is now a fact of every family's life.`,
      layer: "biology",
      eventType: "discovery",
    });
  }
  if (g.bank.exhaustedBeforeArrival) {
    add({
      id: "bank-exhausted",
      kind: "milestone",
      shipYear: g.bank.lastsGenerations * genYears,
      title: "The last frozen embryo is used",
      description: "The genetic bank is empty. From here the ship's diversity can only fall.",
      layer: "biology",
      eventType: "event",
    });
  }

  if (r.lifeSupport.firstFailureLoop) {
    const loop = r.lifeSupport.loops.find((l) => l.id === r.lifeSupport.firstFailureLoop)!;
    add({
      id: `reserve-exhausted:${loop.id}`,
      kind: "milestone",
      shipYear: r.lifeSupport.firstFailureDays / DAYS_PER_YEAR,
      title: `${loop.label} reserves run dry`,
      description: `The ${loop.label.toLowerCase()} loop recovers ${(loop.efficiency * 100).toFixed(2)}%. The stored margin is gone; every lost kilogram is now a person's share.`,
      layer: "technology",
      eventType: "event",
    });
  }

  if (r.drift.lexdrift.severity !== "dialect") {
    add({
      id: "language-split",
      kind: "milestone",
      shipYear: total * 0.75,
      title: "Home transmissions need a translator",
      description: `By arrival the ship's speech will have diverged ${r.drift.lexdrift.divergencePct.toFixed(0)}% from home (${r.drift.lexdrift.severityLabel.toLowerCase()}). Old messages are already a scholar's work.`,
      layer: "culture",
      eventType: "event",
    });
  }

  // Seeded events: placed deterministically inside their windows.
  const rand = mulberry32(driftSeed(form));
  for (const t of SEEDED) {
    const roll = rand(); // always consume, so one template's rule never shifts another's year
    if (!t.applies(form, r)) continue;
    const share = t.window[0] + (t.window[1] - t.window[0]) * roll;
    add({
      id: t.id,
      kind: "seeded",
      shipYear: Math.round(total * share),
      title: t.title(form, r),
      description: t.description(form, r),
      layer: t.layer,
      eventType: t.eventType,
    });
  }

  add({
    id: "arrival",
    kind: "milestone",
    shipYear: total,
    title: `${name} arrives at ${form.identity.destinationName || "its destination"}`,
    description: `Generation ${generationAt(total, form)} takes the ship into orbit. Their ancestors chose this; they did not.`,
    layer: "narrative",
    eventType: "founding",
  });

  return events.sort((a, b) => a.shipYear - b.shipYear || a.id.localeCompare(b.id));
}

/** A home-calendar year, as Chronicle displays it. */
export function chronicleYear(launchYear: number, e: DriftEvent): number {
  return launchYear + Math.round(e.earthYear);
}
