/**
 * tool-accents, per-tool color accent (April 2026 handoff).
 *
 * Each tool inherits the cascade color of its category:
 *   amber  , Stars & Systems / physics tools
 *   azure  , Worlds / environmental tools
 *   emerald, Life / biology tools
 *   violet , Civilizations tools
 *   stellar, Mythology tools
 *   magenta, Psychology tools (Dossier)
 *   teal   , Integration / meta tools (default)
 *
 * Maps tool slug → accent token name.
 */

export type ToolAccent = "amber" | "azure" | "emerald" | "violet" | "stellar" | "teal" | "crimson" | "magenta";

export const TOOL_ACCENTS: Record<string, ToolAccent> = {
  // Physics / Stars & Systems, amber
  "drake-equation-calculator": "amber",
  "star-system-builder": "amber",
  "habitable-zone-calculator": "amber",
  "time-dilation": "amber",
  "kardashev-scale": "amber",
  "surface-gravity-calculator": "amber",
  "gravitas": "amber",

  // Worlds / environment, azure
  "planetary-profile": "azure",
  "environmental-chain-reaction": "azure",
  "sensorium": "azure",

  // Life / biology, emerald
  "evolutionary-biology": "emerald",
  "species-interaction-matrix": "emerald",

  // Civilizations, violet
  "empire-designer": "violet",
  "technology-consequences": "violet",
  "space-expansion-modeler": "violet",
  "one-big-lie": "violet",
  "lexdrift": "violet",

  // Psychology, magenta
  "dossier": "magenta",

  // Mythology, stellar
  "xenomythology-framework-builder": "stellar",

  // Integration / vehicles / time, teal
  "propulsion-consequences-map": "teal",
  "spacecraft-designer": "teal",
  "timeline": "teal",
};

/** Fallback: teal for any unmapped tool. */
export function getToolAccent(toolType: string): ToolAccent {
  return TOOL_ACCENTS[toolType] ?? "teal";
}

// Static class maps, Tailwind's JIT detects concrete class strings; dynamic
// `text-sf-${accent}` would purge. The values below appear verbatim here so
// all variants are retained in the final CSS bundle.

const TEXT: Record<ToolAccent, string> = {
  amber: "text-sf-amber-text",
  azure: "text-sf-azure-text",
  emerald: "text-sf-emerald-text",
  violet: "text-sf-violet-text",
  stellar: "text-sf-stellar-text",
  teal: "text-sf-teal-text",
  crimson: "text-sf-crimson-text",
  magenta: "text-sf-magenta-text",
};

const BORDER: Record<ToolAccent, string> = {
  amber: "border-sf-amber",
  azure: "border-sf-azure",
  emerald: "border-sf-emerald",
  violet: "border-sf-violet",
  stellar: "border-sf-stellar",
  teal: "border-sf-teal",
  crimson: "border-sf-crimson",
  magenta: "border-sf-magenta",
};

const CHIP: Record<ToolAccent, string> = {
  amber: "bg-sf-amber/[0.06] border-sf-amber text-sf-amber-text",
  azure: "bg-sf-azure/[0.06] border-sf-azure text-sf-azure-text",
  emerald: "bg-sf-emerald/[0.06] border-sf-emerald text-sf-emerald-text",
  violet: "bg-sf-violet/[0.06] border-sf-violet text-sf-violet-text",
  stellar: "bg-sf-stellar/[0.06] border-sf-stellar text-sf-stellar-text",
  teal: "bg-sf-teal/[0.06] border-sf-teal text-sf-teal-text",
  crimson: "bg-sf-crimson/[0.06] border-sf-crimson text-sf-crimson-text",
  magenta: "bg-sf-magenta/[0.06] border-sf-magenta text-sf-magenta-text",
};

const ARC: Record<ToolAccent, string> = {
  amber: "from-sf-amber via-sf-amber/30 to-transparent",
  azure: "from-sf-azure via-sf-azure/30 to-transparent",
  emerald: "from-sf-emerald via-sf-emerald/30 to-transparent",
  violet: "from-sf-violet via-sf-violet/30 to-transparent",
  stellar: "from-sf-stellar via-sf-stellar/30 to-transparent",
  teal: "from-sf-teal via-sf-teal/30 to-transparent",
  crimson: "from-sf-crimson via-sf-crimson/30 to-transparent",
  magenta: "from-sf-magenta via-sf-magenta/30 to-transparent",
};

const BG: Record<ToolAccent, string> = {
  amber: "bg-sf-amber",
  azure: "bg-sf-azure",
  emerald: "bg-sf-emerald",
  violet: "bg-sf-violet",
  stellar: "bg-sf-stellar",
  teal: "bg-sf-teal",
  crimson: "bg-sf-crimson",
  magenta: "bg-sf-magenta",
};

export const accentTextClass = (accent: ToolAccent): string => TEXT[accent];
export const accentBorderClass = (accent: ToolAccent): string => BORDER[accent];
export const accentChipClass = (accent: ToolAccent): string => CHIP[accent];
export const accentArcClass = (accent: ToolAccent): string => ARC[accent];
export const accentBgClass = (accent: ToolAccent): string => BG[accent];
