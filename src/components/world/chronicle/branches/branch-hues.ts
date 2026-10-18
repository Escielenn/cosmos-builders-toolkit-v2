// Literal class maps per branch hue, so Tailwind's JIT sees every class.
// Hues are meanings (named tokens), never hex. The prime timeline is teal:
// the Chronicle is an Integration surface.

import type { BranchHue } from "@/lib/chronicle/branches";

export interface HueClasses {
  stroke: string;
  fill: string;
  text: string;
  border: string;
  tint: string;
  /** Solid swatch fill for DOM elements. */
  bg: string;
}

export const HUE_CLASSES: Record<BranchHue, HueClasses> = {
  teal: {
    stroke: "stroke-sf-teal",
    fill: "fill-sf-teal",
    text: "text-sf-teal-text",
    border: "border-sf-teal",
    tint: "bg-sf-teal/[0.06]",
    bg: "bg-sf-teal",
  },
  azure: {
    stroke: "stroke-sf-azure",
    fill: "fill-sf-azure",
    text: "text-sf-azure-text",
    border: "border-sf-azure",
    tint: "bg-sf-azure/[0.06]",
    bg: "bg-sf-azure",
  },
  amber: {
    stroke: "stroke-sf-amber",
    fill: "fill-sf-amber",
    text: "text-sf-amber-text",
    border: "border-sf-amber",
    tint: "bg-sf-amber/[0.06]",
    bg: "bg-sf-amber",
  },
  emerald: {
    stroke: "stroke-sf-emerald",
    fill: "fill-sf-emerald",
    text: "text-sf-emerald-text",
    border: "border-sf-emerald",
    tint: "bg-sf-emerald/[0.06]",
    bg: "bg-sf-emerald",
  },
  magenta: {
    stroke: "stroke-sf-magenta",
    fill: "fill-sf-magenta",
    text: "text-sf-magenta-text",
    border: "border-sf-magenta",
    tint: "bg-sf-magenta/[0.06]",
    bg: "bg-sf-magenta",
  },
  stellar: {
    stroke: "stroke-sf-stellar",
    fill: "fill-sf-stellar",
    text: "text-sf-stellar-text",
    border: "border-sf-stellar",
    tint: "bg-sf-stellar/[0.06]",
    bg: "bg-sf-stellar",
  },
  violet: {
    stroke: "stroke-sf-violet",
    fill: "fill-sf-violet",
    text: "text-sf-violet-text",
    border: "border-sf-violet",
    tint: "bg-sf-violet/[0.06]",
    bg: "bg-sf-violet",
  },
};

export const HUE_LABELS: Record<BranchHue, string> = {
  teal: "Teal",
  azure: "Azure",
  amber: "Amber",
  emerald: "Emerald",
  magenta: "Magenta",
  stellar: "Stellar",
  violet: "Violet",
};

export const PRIME_HUE: BranchHue = "teal";
