/**
 * Cascade Guidance System — downstream suggestions and progress tracking.
 *
 * After completing a tool, suggests the next cascade step. Also provides
 * completion status per cascade layer for dashboard display.
 *
 * Cascade order: Stars & Systems → Worlds → Life → Civilizations → Mythology → Integration
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2 — Issue 5
 */

import type { CascadeLayer } from "@/services/world-data";

interface CascadeSuggestion {
  toolType: string;
  brandName: string;
  fullName: string;
  prompt: string;
}

/** Cascade layer ordering (upstream → downstream) */
const CASCADE_ORDER: CascadeLayer[] = [
  "stars_and_systems",
  "worlds",
  "life",
  "civilizations",
  "mythology",
  "narrative",
];

/** Which tools belong to which cascade layer */
const LAYER_TOOLS: Record<string, string[]> = {
  stars_and_systems: [
    "star-system-builder",
    "habitable-zone-calculator",
    "time-dilation",
    "drake-equation-calculator",
  ],
  worlds: [
    "planetary-profile",
    "surface-gravity-calculator",
    "gravitas",
  ],
  life: [
    "evolutionary-biology",
    "sensorium",
    "species-interaction-matrix",
  ],
  civilizations: [
    "one-big-lie",
    "empire-designer",
    "technology-consequences",
    "spacecraft-designer",
    "propulsion-consequences-map",
    "lexdrift",
    "kardashev-scale",
    "space-expansion-modeler",
  ],
  mythology: [
    "xenomythology-framework-builder",
  ],
  narrative: [
    "environmental-chain-reaction",
    "timeline",
  ],
};

/** Downstream suggestion after completing a tool in each layer */
const DOWNSTREAM_SUGGESTIONS: Record<string, CascadeSuggestion[]> = {
  stars_and_systems: [
    { toolType: "planetary-profile", brandName: "Genesis", fullName: "Planetary Profile", prompt: "Your star system defines the stage. Now define the world that inhabits it." },
    { toolType: "habitable-zone-calculator", brandName: "Goldilocks", fullName: "Habitable Zone Calculator", prompt: "Check where habitable planets can orbit in your system." },
  ],
  worlds: [
    { toolType: "evolutionary-biology", brandName: "Phylo", fullName: "Evolutionary Biology", prompt: "Your world's conditions shape what can live there. Design the biology." },
    { toolType: "sensorium", brandName: "Sensorium", fullName: "Alien Sensory Systems", prompt: "How would life perceive this world? Design the senses." },
  ],
  life: [
    { toolType: "empire-designer", brandName: "Dominion", fullName: "Empire Designer", prompt: "Species become civilizations. Define the political structures." },
    { toolType: "technology-consequences", brandName: "Paradigm", fullName: "Technology Consequences", prompt: "What technologies arise from these biological capabilities?" },
  ],
  civilizations: [
    { toolType: "xenomythology-framework-builder", brandName: "Mythos", fullName: "Xenomythology Framework", prompt: "Every civilization tells stories. What myths arise from this culture?" },
  ],
  mythology: [
    { toolType: "environmental-chain-reaction", brandName: "Cascade", fullName: "Environmental Chain Reaction", prompt: "Trace the full cascade from physics to culture. Verify internal consistency." },
    { toolType: "timeline", brandName: "Chronolog", fullName: "Timeline", prompt: "Plot how these elements play out across deep time." },
  ],
  narrative: [],
};

/**
 * Get the cascade layer a tool belongs to.
 */
export function getToolLayer(toolType: string): CascadeLayer | null {
  for (const [layer, tools] of Object.entries(LAYER_TOOLS)) {
    if (tools.includes(toolType)) return layer as CascadeLayer;
  }
  return null;
}

/**
 * Get downstream suggestions after completing a tool.
 */
export function getDownstreamSuggestions(toolType: string): CascadeSuggestion[] {
  const layer = getToolLayer(toolType);
  if (!layer) return [];
  return DOWNSTREAM_SUGGESTIONS[layer] ?? [];
}

export interface CascadeLayerStatus {
  layer: CascadeLayer;
  label: string;
  status: "empty" | "partial" | "populated";
  toolCount: number;
  worksheetCount: number;
}

/** Layer display labels */
const LAYER_DISPLAY: Record<string, string> = {
  stars_and_systems: "Stars & Systems",
  worlds: "Worlds",
  life: "Life",
  civilizations: "Civilizations",
  mythology: "Mythology",
  narrative: "Narrative",
};

/**
 * Compute cascade completion status per layer for a given set of worksheets.
 */
export function getCascadeProgress(
  worksheetToolTypes: string[]
): CascadeLayerStatus[] {
  const typeCounts = new Map<string, number>();
  for (const tt of worksheetToolTypes) {
    typeCounts.set(tt, (typeCounts.get(tt) ?? 0) + 1);
  }

  return CASCADE_ORDER.map((layer) => {
    const tools = LAYER_TOOLS[layer] ?? [];
    let worksheetCount = 0;
    for (const t of tools) {
      worksheetCount += typeCounts.get(t) ?? 0;
    }

    return {
      layer,
      label: LAYER_DISPLAY[layer] ?? layer,
      status: worksheetCount === 0 ? "empty" : worksheetCount >= tools.length ? "populated" : "partial",
      toolCount: tools.length,
      worksheetCount,
    };
  });
}
