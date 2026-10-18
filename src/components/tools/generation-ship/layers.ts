import type { DriftLayer } from "@/lib/generation-ship/drift-events";

// Cascade layer colours: biology emerald, culture violet, technology amber
// (physics), narrative teal (integration). Fixed meanings, never the theme role.
export const LAYER_BG: Record<DriftLayer, string> = {
  biology: "bg-sf-emerald",
  culture: "bg-sf-violet",
  technology: "bg-sf-amber",
  narrative: "bg-sf-teal",
};
export const LAYER_STROKE: Record<DriftLayer, string> = {
  biology: "stroke-sf-emerald",
  culture: "stroke-sf-violet",
  technology: "stroke-sf-amber",
  narrative: "stroke-sf-teal",
};
export const LAYER_TEXT: Record<DriftLayer, string> = {
  biology: "text-sf-emerald-text",
  culture: "text-sf-violet-text",
  technology: "text-sf-amber-text",
  narrative: "text-sf-teal-text",
};
export const LAYER_LABEL: Record<DriftLayer, string> = {
  biology: "BIOLOGY",
  culture: "CULTURE",
  technology: "MACHINERY",
  narrative: "VOYAGE",
};
