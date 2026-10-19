// ---------------------------------------------------------------------------
// first-hour — the Getting Started pathway (onboarding review item 8).
//
// The old pathway linked all four steps to Pro standalone tools, so a free
// writer's first click hit the paywall. The rebuilt order is the product's
// own: create a world (BEGIN SURVEY) → open a FREE instrument on an entity
// inside that world → write the first scene in the Studio. Pro instruments
// follow as an optional "next", marked PRO.
// ---------------------------------------------------------------------------

import { FREE_TOOL_IDS, isProTool } from "@/lib/tools-config";
import { toolHref } from "@/lib/world-tool-routes";
import type { EntityType } from "@/services/entity-graph-types";

export interface SubjectCandidate {
  id: string;
  name: string;
  entity_type: EntityType | string;
}

/**
 * Which kind of Codex entity each instrument most naturally opens on, best
 * first. A tool with no match opens without a subject rather than on an
 * entity it has nothing to say about (Vessel on a star, say).
 */
export const SUBJECT_PREFERENCES: Record<string, readonly string[]> = {
  "environmental-chain-reaction": ["planet", "moon", "star_system", "star"],
  "spacecraft-designer": ["vessel", "faction", "species"],
  "propulsion-consequences-map": ["faction", "species", "vessel", "technology"],
  "habitable-zone-calculator": ["star", "star_system", "planet"],
  "star-system-builder": ["star_system", "star"],
  "planetary-profile": ["planet", "moon"],
  "surface-gravity-calculator": ["planet", "moon"],
  "evolutionary-biology": ["species"],
  sensorium: ["species", "character"],
  "xenomythology-framework-builder": ["mythology", "religion", "species"],
};

/** The best subject in `entities` for `toolId`, or null. Stable on ties. */
export function pickSubject<T extends SubjectCandidate>(
  toolId: string,
  entities: readonly T[],
): T | null {
  const prefs = SUBJECT_PREFERENCES[toolId];
  if (!prefs) return null;
  for (const type of prefs) {
    const hit = entities.find((e) => e.entity_type === type);
    if (hit) return hit;
  }
  return null;
}

export interface InstrumentLink {
  toolId: string;
  isPro: boolean;
  /** Null when there is no world to open it in. */
  href: string | null;
  subject: SubjectCandidate | null;
}

/** One launch link per tool, inside `worldId`, on its best subject. */
export function instrumentLinks(
  toolIds: readonly string[],
  worldId: string | null,
  entities: readonly SubjectCandidate[],
): InstrumentLink[] {
  return toolIds.map((toolId) => {
    const subject = worldId ? pickSubject(toolId, entities) : null;
    return {
      toolId,
      isPro: isProTool(toolId),
      href: worldId ? toolHref(toolId, worldId, { entityId: subject?.id ?? null }) : null,
      subject,
    };
  });
}

/** Step two offers exactly the free instruments. */
export const FIRST_INSTRUMENT_IDS: readonly string[] = FREE_TOOL_IDS;

/** The optional Pro "next" steps, in cascade order. */
export const PRO_NEXT_STEPS = [
  {
    title: "Star & habitable zone",
    toolIds: ["habitable-zone-calculator", "star-system-builder"],
    output: "Star type, habitable zone boundaries, orbital parameters.",
  },
  {
    title: "Planetary profile",
    toolIds: ["planetary-profile", "surface-gravity-calculator"],
    output: "Mass, gravity, atmosphere, day length, climate zones.",
  },
  {
    title: "Life & evolution",
    toolIds: ["evolutionary-biology", "sensorium"],
    output: "Species profile, sensory systems, evolutionary rationale.",
  },
  {
    title: "Mythology & meaning",
    toolIds: ["xenomythology-framework-builder"],
    output: "Mythology profile, creation myth, ritual, cultural foundations.",
  },
] as const;

export interface FirstHourProgress {
  world: boolean;
  instrument: boolean;
}

/**
 * Progress read from the writer's own records, not a "mark complete" button:
 * a world on file, and a worksheet from a free instrument in that world.
 */
export function firstHourProgress(input: {
  worldId: string | null;
  worksheets: readonly { world_id: string | null; tool_type: string }[];
}): FirstHourProgress {
  const free = new Set(FIRST_INSTRUMENT_IDS);
  return {
    world: !!input.worldId,
    instrument:
      !!input.worldId &&
      input.worksheets.some((w) => w.world_id === input.worldId && free.has(w.tool_type)),
  };
}
