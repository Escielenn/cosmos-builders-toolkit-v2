// ---------------------------------------------------------------------------
// rogue-save, what an encounter leaves behind.
//
// The same envelope discipline as exosky-save: useSimulationSave inserts only
// `data.parameters` and `data.results` and discards every other top-level key, so
// the state has to nest under `parameters`. A payload shaped any other way is
// dropped at the database boundary without a word.
//
// The facts are the point. An encounter's outcome is narrative material: which
// world was thrown out, how fast it left, what the system looks like afterwards.
// That is the sentence a writer wants, and until now it existed only as pixels.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";
import { AU_PER_YEAR_TO_KM_S, type EncounterStatus } from "./nbody";
import {
  INTRUDER_TYPES,
  intruderMass,
  type IntruderConfig,
  type RogueBody,
} from "./rogue-systems";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RogueBodySnapshot {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  kind: "star" | "planet" | "intruder";
  /** Original semi-major axis, so a displaced world can be compared to before. */
  startedAtAU: number | null;
  ejected: boolean;
}

export interface RogueSave {
  version: 1;
  systemKey: string;
  systemName: string;
  intruder: IntruderConfig & { display: string; solarMasses: number };
  status: EncounterStatus;
  simYears: number;
  launched: boolean;
  bodies: RogueBodySnapshot[];
  ejectedNames: string[];
}

const round = (n: number, p = 4) => {
  const f = 10 ** p;
  return Math.round(n * f) / f;
};

function num(raw: unknown, fallback: number): number {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

// ---------------------------------------------------------------------------
// Serialise
// ---------------------------------------------------------------------------

export function toRogueSave(input: {
  systemKey: string;
  systemName: string;
  intruder: IntruderConfig;
  status: EncounterStatus;
  simYears: number;
  launched: boolean;
  bodies: RogueBody[];
  ejected: Set<string>;
}): RogueSave {
  const mass = intruderMass(input.intruder.kind, input.intruder.massFraction);

  return {
    version: 1,
    systemKey: input.systemKey,
    systemName: input.systemName,
    intruder: { ...input.intruder, display: mass.display, solarMasses: round(mass.solar, 8) },
    status: input.status,
    simYears: round(input.simYears, 4),
    launched: input.launched,
    bodies: input.bodies.map((b) => ({
      name: b.name,
      x: round(b.x),
      y: round(b.y),
      vx: round(b.vx),
      vy: round(b.vy),
      mass: round(b.mass, 8),
      kind: b.isStar ? "star" : b.isIntruder ? "intruder" : "planet",
      startedAtAU: b.a != null ? round(b.a) : null,
      ejected: input.ejected.has(b.name),
    })),
    ejectedNames: [...input.ejected],
  };
}

/** The envelope the persistence layer expects. State must live in `parameters`. */
export function toRoguePayload(input: Parameters<typeof toRogueSave>[0]) {
  const save = toRogueSave(input);
  return {
    outputType: "encounter",
    name: `${save.systemName} · ${INTRUDER_TYPES[save.intruder.kind].name}`,
    parameters: { rogue: save },
    results: {
      status: save.status,
      elapsedYears: save.simYears,
      ejectedCount: save.ejectedNames.length,
      ejectedNames: save.ejectedNames,
      intruder: save.intruder.display,
    },
  };
}

// ---------------------------------------------------------------------------
// Deserialise
// ---------------------------------------------------------------------------

export function fromRogueSave(raw: unknown): RogueSave | null {
  if (!raw || typeof raw !== "object") return null;
  let p = raw as Record<string, unknown>;

  const params =
    p.parameters && typeof p.parameters === "object"
      ? (p.parameters as Record<string, unknown>)
      : null;
  if (params?.rogue && typeof params.rogue === "object") {
    p = params.rogue as Record<string, unknown>;
  }

  if (!p.systemKey && !Array.isArray(p.bodies)) return null;

  const intruderRaw =
    p.intruder && typeof p.intruder === "object"
      ? (p.intruder as Record<string, unknown>)
      : {};

  const kind = (str(intruderRaw.kind) || "bh") as IntruderConfig["kind"];
  const validKind = kind in INTRUDER_TYPES ? kind : "bh";

  return {
    version: 1,
    systemKey: str(p.systemKey) || "solar",
    systemName: str(p.systemName) || "Unnamed system",
    intruder: {
      kind: validKind,
      massFraction: num(intruderRaw.massFraction, 0.15),
      distanceAU: num(intruderRaw.distanceAU, 1),
      speedKmS: num(intruderRaw.speedKmS, 20),
      angleDeg: num(intruderRaw.angleDeg, 0),
      display: str(intruderRaw.display),
      solarMasses: num(intruderRaw.solarMasses, 0),
    },
    status: (str(p.status) || "awaiting") as EncounterStatus,
    simYears: num(p.simYears, 0),
    launched: p.launched === true,
    bodies: Array.isArray(p.bodies)
      ? p.bodies
          .map((b) => normaliseBody(b))
          .filter((b): b is RogueBodySnapshot => b !== null)
      : [],
    ejectedNames: Array.isArray(p.ejectedNames) ? p.ejectedNames.map(String) : [],
  };
}

function normaliseBody(raw: unknown): RogueBodySnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const name = str(b.name);
  if (!name) return null;
  const kindRaw = str(b.kind);
  const kind: RogueBodySnapshot["kind"] =
    kindRaw === "star" || kindRaw === "intruder" ? kindRaw : "planet";
  return {
    name,
    x: num(b.x, 0),
    y: num(b.y, 0),
    vx: num(b.vx, 0),
    vy: num(b.vy, 0),
    mass: num(b.mass, 0),
    kind,
    startedAtAU: b.startedAtAU == null ? null : num(b.startedAtAU, 0),
    ejected: b.ejected === true,
  };
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

const STATUS_PROSE: Record<EncounterStatus, string> = {
  awaiting: "Set up, not yet run",
  approaching: "Intruder inbound",
  perturbed: "Orbits disturbed, nothing lost",
  "post-encounter": "Survived the pass",
  ejecting: "Lost worlds to the encounter",
  disrupted: "System broken apart",
};

/**
 * A saved encounter, as facts a writer can use.
 *
 * Leads with the outcome rather than the setup, because the outcome is the story:
 * a reader does not care what the slider said, they care that the system lost
 * three worlds and one of them is now travelling at 40 km/s into the dark.
 */
export function extractRogueFacts(raw: unknown): WorksheetFact[] {
  const save = fromRogueSave(raw);
  if (!save) return [];

  const facts: WorksheetFact[] = [];

  facts.push({
    key: "encounter.system",
    label: "System",
    value: save.systemName,
    insert: save.systemName,
  });

  facts.push({
    key: "encounter.outcome",
    label: "Outcome",
    value: STATUS_PROSE[save.status] ?? save.status,
  });

  if (save.intruder.display) {
    facts.push({
      key: "encounter.intruder",
      label: "Intruder",
      value: `${INTRUDER_TYPES[save.intruder.kind].name}, ${save.intruder.display}`,
    });
    facts.push({
      key: "encounter.approach",
      label: "Closest approach",
      value: `${save.intruder.distanceAU.toFixed(3)} AU at ${Math.round(save.intruder.speedKmS)} km/s`,
    });
  }

  if (save.simYears > 0) {
    facts.push({
      key: "encounter.elapsed",
      label: "Elapsed",
      value: save.simYears < 1
        ? `${Math.round(save.simYears * 365.25)} days`
        : `${save.simYears.toFixed(2)} years`,
    });
  }

  const planets = save.bodies.filter((b) => b.kind === "planet");
  if (planets.length > 0) {
    facts.push({
      key: "encounter.held",
      label: "Worlds held",
      value: `${planets.length - save.ejectedNames.length} of ${planets.length}`,
    });
  }

  // Each ejected world is its own fact: this is the quotable part.
  for (const b of planets.filter((p) => p.ejected)) {
    const speed = Math.hypot(b.vx, b.vy) * AU_PER_YEAR_TO_KM_S;
    const detail = [
      b.startedAtAU != null ? `left a ${b.startedAtAU} AU orbit` : "",
      `now ${Math.hypot(b.x, b.y).toFixed(1)} AU out`,
      `${Math.round(speed)} km/s`,
    ]
      .filter(Boolean)
      .join(" · ");
    facts.push({
      key: `encounter.ejected.${b.name.toLowerCase().replace(/\s+/g, "-")}`,
      label: `${b.name} ejected`,
      value: detail,
      insert: b.name,
    });
  }

  return facts;
}

export default extractRogueFacts;
