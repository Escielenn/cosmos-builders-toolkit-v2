/**
 * Canonical tool page configuration, single source of truth for layout metadata.
 * Every worksheet tool page reads from this to render its header via ToolPageLayout.
 *
 * Spec: StellarForge_Layout_Normalization_Spec_Apr2926.md
 */

import { isProTool } from "./tools-config";

export interface ToolPageConfig {
  /** Tool slug / route param, e.g. "planetary-profile" */
  toolType: string;
  /** Brand name shown before the colon in the title, e.g. "Genesis" */
  brandName: string;
  /** Full tool name after the colon, e.g. "Planetary Profile" */
  fullName: string;
  /** 1–2 line description shown below the title */
  subtitle: string;
  /** Whether this is a Pro tool (drives the inline PRO badge) */
  isPro: boolean;
  /** Export button label: always "Export [BrandName]" */
  exportLabel: string;
  /** Key into TOOL_INTROS for the intro section. Defaults to toolType. */
  introKey: string;
}

function config(
  toolType: string,
  brandName: string,
  fullName: string,
  subtitle: string,
  introKeyOverride?: string,
): ToolPageConfig {
  return {
    toolType,
    brandName,
    fullName,
    subtitle,
    isPro: isProTool(toolType),
    exportLabel: `Export ${brandName}`,
    introKey: introKeyOverride ?? toolType,
  };
}

export const TOOL_PAGE_CONFIGS: Record<string, ToolPageConfig> = {
  // ── Free Tools ──────────────────────────────────────────────────────
  "environmental-chain-reaction": config(
    "environmental-chain-reaction",
    "Cascade",
    "Environmental Chain Reaction",
    "Map how planetary parameters cascade into biology, psychology, mythology, and culture.",
  ),
  "spacecraft-designer": config(
    "spacecraft-designer",
    "Vessel",
    "Lived-In Spacecraft Designer",
    "Design ships that feel inhabited, with cultural context, life support realities, and ship-as-character development.",
  ),
  "propulsion-consequences-map": config(
    "propulsion-consequences-map",
    "Impulse",
    "Propulsion Consequences",
    "Trace how your propulsion system shapes economics, politics, social structures, and psychology.",
  ),

  // ── Pro Worksheets ──────────────────────────────────────────────────
  "planetary-profile": config(
    "planetary-profile",
    "Genesis",
    "Planetary Profile",
    "Define your world's stellar environment, physical characteristics, atmosphere, and the narrative pressures that shape life.",
  ),
  "one-big-lie": config(
    "one-big-lie",
    "Axiom",
    "The One Big Lie",
    "Declare your single violation of known physics, then systematically trace its consequences across every domain of your world.",
  ),
  "evolutionary-biology": config(
    "evolutionary-biology",
    "Phylo",
    "Evolutionary Biology",
    "Design biologically plausible alien species by tracing every trait back to evolutionary pressures.",
  ),
  "xenomythology-framework-builder": config(
    "xenomythology-framework-builder",
    "Mythos",
    "Xenomythology Framework",
    "Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.",
  ),
  "star-system-builder": config(
    "star-system-builder",
    "Orrery",
    "Star System Builder",
    "Design multi-planet systems with stellar relationships and orbital dynamics.",
  ),
  "empire-designer": config(
    "empire-designer",
    "Dominion",
    "Empire Designer",
    "Design political structures, governance systems, and the factions that shape your civilization.",
  ),
  "technology-consequences": config(
    "technology-consequences",
    "Paradigm",
    "Technology Consequences",
    "Map how any technology cascades through society, economy, warfare, and culture.",
  ),
  "species-interaction-matrix": config(
    "species-interaction-matrix",
    "Symbiosis",
    "Species Interaction Matrix",
    "Define relationships between multiple species and trace how they shape each other's evolution and culture.",
  ),
  "space-expansion-modeler": config(
    "space-expansion-modeler",
    "Exodus",
    "Space Expansion Modeler",
    "Model how competing forces, industrial, governmental, religious, economic, shape expansion beyond Earth.",
  ),
  "timeline": config(
    "timeline",
    "Epoch",
    "Timeline",
    "Plot events across deep time. Build multi-track timelines that reveal how characters, civilizations, and technologies intersect.",
  ),
  "drake-equation-calculator": config(
    "drake-equation-calculator",
    "Signal",
    "Drake Equation Calculator",
    "Calculate the number of detectable civilizations in your galaxy and establish the cosmic context for your world.",
  ),

  // ── Pro Calculators ──────────────────────────────────────────────────
  "habitable-zone-calculator": config(
    "habitable-zone-calculator",
    "Goldilocks",
    "Habitable Zone Calculator",
    "Where your planet sits relative to its star determines everything that follows.",
  ),
  "surface-gravity-calculator": config(
    "surface-gravity-calculator",
    "Atlas",
    "Surface Gravity Calculator",
    "Calculate surface gravity for any planet and trace how weight shapes biology, psychology, and culture.",
  ),
  "time-dilation": config(
    "time-dilation",
    "Paradox",
    "Time Dilation Calculator",
    "Every journey costs time. Know what yours will cost.",
    "time-dilation-calculator", // introKey differs from toolType
  ),
  "lexdrift": config(
    "lexdrift",
    "Lexdrift",
    "Language Evolution",
    "Simulate how languages drift, merge, and fracture over time across your worlds.",
  ),
  "sensorium": config(
    "sensorium",
    "Sensorium",
    "Alien Sensory Systems",
    "Design evolutionarily plausible sensory systems for alien species.",
  ),
  "gravitas": config(
    "gravitas",
    "Gravitas",
    "Spacecraft & Habitat Gravity Simulator",
    "Calculate effective gravity conditions and trace how weight shapes biology, psychology, and culture.",
  ),
  "kardashev-scale": config(
    "kardashev-scale",
    "K-Scale",
    "Kardashev Scale Calculator",
    "Classify your civilization's energy consumption and explore the cascade implications of each level.",
  ),
};

/** Look up config by tool slug. Throws if not found. */
export function getToolPageConfig(toolType: string): ToolPageConfig {
  const cfg = TOOL_PAGE_CONFIGS[toolType];
  if (!cfg) throw new Error(`No ToolPageConfig for "${toolType}"`);
  return cfg;
}
