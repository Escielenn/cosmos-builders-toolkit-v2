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
    "Design ships people live on: their culture, the limits of life support, and the ship as a character.",
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
    "Define your world's star, physical characteristics, atmosphere, and the pressures that shape life and story.",
  ),
  "one-big-lie": config(
    "one-big-lie",
    "Axiom",
    "The One Big Lie",
    "Name the one rule of known physics your story breaks, then trace what that changes across your world.",
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
    "Build alien mythologies from a species' biology, environment, and evolutionary history.",
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
    "Model how industry, government, religion, and economics compete to shape expansion beyond Earth.",
  ),
  "timeline": config(
    "timeline",
    "Epoch",
    "Timeline",
    "Plot events across deep time on parallel tracks, so you can see where characters, civilizations, and technologies cross.",
  ),
  "drake-equation-calculator": config(
    "drake-equation-calculator",
    "Signal",
    "Drake Equation Calculator",
    "Estimate how many detectable civilizations share your galaxy.",
  ),

  // ── Pro Calculators ──────────────────────────────────────────────────
  "habitable-zone-calculator": config(
    "habitable-zone-calculator",
    "Goldilocks",
    "Habitable Zone Calculator",
    "Find where liquid water can last around your star, and where your planet sits in that range.",
  ),
  "surface-gravity-calculator": config(
    "surface-gravity-calculator",
    "Ballast",
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
    "Classify your civilization by its energy use and see what each level implies downstream.",
  ),
  "generation-ship": config(
    "generation-ship",
    "Ark",
    "Generation Ship Designer",
    "Size a multi-generational voyage from real numbers: the genetics of a sealed crew, the air and water loops, the spin habitat, and the history the trip will write.",
  ),
  "dossier": config(
    "dossier",
    "Dossier",
    "Character Development",
    "Characters who inherit their bodies, senses, and beliefs from your world, with every change you make marked as yours.",
  ),
  "surface-cartographer": config(
    "surface-cartographer",
    "Surface Cartographer",
    "Planet & Moon Maps",
    "Put your own map on a planet or moon, drop the places your story happens, and read their sky, climate, and distances from canon.",
  ),
};

/** Look up config by tool slug. Throws if not found. */
export function getToolPageConfig(toolType: string): ToolPageConfig {
  const cfg = TOOL_PAGE_CONFIGS[toolType];
  if (!cfg) throw new Error(`No ToolPageConfig for "${toolType}"`);
  return cfg;
}
