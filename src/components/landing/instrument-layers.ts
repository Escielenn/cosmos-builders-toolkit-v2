// ---------------------------------------------------------------------------
// The instrument catalog grouped by cascade layer, for the landing
// constellation and the Features page. Derived from the catalog arrays in
// src/lib/tools-config.ts so a tool added there appears here automatically;
// the layer comes from the tool's cascade accent (src/lib/tool-accents.ts),
// with overrides only for tools that have no accent entry.
// ---------------------------------------------------------------------------

import {
  FREE_TOOL_IDS,
  PRO_TOOL_IDS,
  TOOL_DISPLAY_NAMES,
  getToolRoute,
  isFreeTool,
} from "@/lib/tools-config";
import { getToolAccent, type ToolAccent } from "@/lib/tool-accents";

export type CascadeLayerId =
  | "physics"
  | "worlds"
  | "life"
  | "psychology"
  | "mythology"
  | "culture"
  | "integration";

export interface CascadeLayer {
  id: CascadeLayerId;
  label: string;
  accent: ToolAccent;
  /** One line: what this layer decides. */
  blurb: string;
}

/** Physics → Environment → Biology → Psychology → Mythology → Culture, then Integration. */
export const CASCADE_LAYERS: CascadeLayer[] = [
  { id: "physics", label: "Physics", accent: "amber", blurb: "Stars, orbits, relativity, the one rule you break." },
  { id: "worlds", label: "Worlds", accent: "azure", blurb: "Gravity, climate, surface, the ground underfoot." },
  { id: "life", label: "Life", accent: "emerald", blurb: "Biochemistry, body plans, ecologies." },
  { id: "psychology", label: "Psychology", accent: "magenta", blurb: "Senses, minds, the people who live there." },
  { id: "mythology", label: "Mythology", accent: "stellar", blurb: "The gods a sky like that would make." },
  { id: "culture", label: "Culture", accent: "violet", blurb: "Empires, technologies, ships and languages." },
  { id: "integration", label: "Integration", accent: "teal", blurb: "Cascades, timelines and the thread through all of it." },
];

const LAYER_BY_ACCENT: Record<ToolAccent, CascadeLayerId> = {
  amber: "physics",
  azure: "worlds",
  emerald: "life",
  magenta: "psychology",
  stellar: "mythology",
  violet: "culture",
  teal: "integration",
  crimson: "integration",
};

/** Tools with no accent entry (simulators, cartographers) placed by subject. */
const LAYER_OVERRIDES: Record<string, CascadeLayerId> = {
  rogue: "physics",
  solaris: "physics",
  exosky: "physics",
  "stellar-cartographer": "physics",
  tidelock: "worlds",
  exoforge: "worlds",
};

export function getToolLayer(toolId: string): CascadeLayerId {
  return LAYER_OVERRIDES[toolId] ?? LAYER_BY_ACCENT[getToolAccent(toolId)];
}

/** "Genesis: Planetary Profile" → "Genesis". */
export function getToolShortName(toolId: string): string {
  const full = TOOL_DISPLAY_NAMES[toolId] ?? toolId;
  return full.split(":")[0].trim();
}

export interface InstrumentEntry {
  id: string;
  shortName: string;
  fullName: string;
  route: string;
  free: boolean;
}

export interface InstrumentGroup {
  layer: CascadeLayer;
  tools: InstrumentEntry[];
}

/** Every catalog tool, once, grouped in cascade order. Empty layers are dropped. */
export function groupInstrumentsByLayer(): InstrumentGroup[] {
  const ids = [...FREE_TOOL_IDS, ...PRO_TOOL_IDS];
  return CASCADE_LAYERS.map((layer) => ({
    layer,
    tools: ids
      .filter((id) => getToolLayer(id) === layer.id)
      .map((id) => ({
        id,
        shortName: getToolShortName(id),
        fullName: TOOL_DISPLAY_NAMES[id] ?? id,
        route: getToolRoute(id) ?? "/tools",
        free: isFreeTool(id),
      })),
  })).filter((g) => g.tools.length > 0);
}
