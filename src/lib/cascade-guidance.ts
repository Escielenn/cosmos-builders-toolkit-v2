/**
 * Cascade Guidance System, downstream suggestions and progress tracking.
 *
 * After completing a tool, suggests the next cascade step. Also provides
 * completion status per cascade layer for dashboard display.
 *
 * Cascade order: Physics → Environment → Biology → Psychology → Mythology → Culture → Integration
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 5
 */

import type { CascadeLayer } from "@/canon/vocabulary";
import { CASCADE_LAYER_NAME, CASCADE_LAYER_ORDER, isKnownToolLayer, toolLayer, toolsByLayer } from "@/canon/tool-layers";

/**
 * 1.9 F-07: guidance uses the one cascade scheme (canon/tool-layers, from the
 * manifests), not its own category list. Physics → Environment → Biology →
 * Psychology → Mythology → Culture, then Integration.
 */
export type GuidanceLayer = CascadeLayer;

interface CascadeSuggestion {
  toolType: string;
  brandName: string;
  fullName: string;
  prompt: string;
}

/** Downstream suggestion after completing a tool in each layer */
const DOWNSTREAM_SUGGESTIONS: Record<GuidanceLayer, CascadeSuggestion[]> = {
  physics: [
    { toolType: "planetary-profile", brandName: "Genesis", fullName: "Planetary Profile", prompt: "Your star system defines the stage. Now define the world that inhabits it." },
    { toolType: "habitable-zone-calculator", brandName: "Goldilocks", fullName: "Habitable Zone Calculator", prompt: "Check where habitable planets can orbit in your system." },
  ],
  environment: [
    { toolType: "evolutionary-biology", brandName: "Phylo", fullName: "Evolutionary Biology", prompt: "Your world's conditions shape what can live there. Design the biology." },
    { toolType: "sensorium", brandName: "Sensorium", fullName: "Alien Sensory Systems", prompt: "How would life perceive this world? Design the senses." },
  ],
  biology: [
    { toolType: "dossier", brandName: "Dossier", fullName: "Character Development", prompt: "The body is decided. Now meet someone who lives in it." },
    { toolType: "xenomythology-framework-builder", brandName: "Mythos", fullName: "Xenomythology Framework", prompt: "Bodies and senses shape belief. What myths arise from this biology?" },
  ],
  psychology: [
    { toolType: "xenomythology-framework-builder", brandName: "Mythos", fullName: "Xenomythology Framework", prompt: "Minds make myths. What does this people believe?" },
  ],
  mythology: [
    { toolType: "empire-designer", brandName: "Dominion", fullName: "Empire Designer", prompt: "Belief becomes law. Define the political structures." },
    { toolType: "technology-consequences", brandName: "Paradigm", fullName: "Technology Consequences", prompt: "What technologies does this culture allow, and forbid?" },
  ],
  culture: [
    { toolType: "timeline", brandName: "Epoch", fullName: "Timeline", prompt: "Plot how these elements play out across deep time." },
    { toolType: "environmental-chain-reaction", brandName: "Cascade", fullName: "Environmental Chain Reaction", prompt: "Trace the full cascade from physics to culture. Verify internal consistency." },
  ],
  integration: [],
};

/**
 * Get the cascade layer a tool belongs to.
 */
export function getToolLayer(toolType: string): GuidanceLayer | null {
  return isKnownToolLayer(toolType) ? toolLayer(toolType) : null;
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
  layer: GuidanceLayer;
  label: string;
  status: "empty" | "partial" | "populated";
  toolCount: number;
  worksheetCount: number;
}

/** Layer display labels */
const LAYER_DISPLAY: Record<GuidanceLayer, string> = CASCADE_LAYER_NAME;

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

  const byLayer = toolsByLayer();
  return CASCADE_LAYER_ORDER.map((layer) => {
    const tools = byLayer[layer] ?? [];
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
