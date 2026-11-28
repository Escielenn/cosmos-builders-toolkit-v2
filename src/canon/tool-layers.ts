// ---------------------------------------------------------------------------
// canon/tool-layers, ONE cascade-layer scheme (1.9 audit F-07).
//
// There were three and they disagreed: the world sidebar (services/world-data)
// had no Physics and filed Paradox and Gravitas under "Technology" and Drake
// under "Narrative"; tool-accents painted Paradox amber and Vessel teal; the
// manifests said Culture for both. The manifest is the source of truth
// (03-TOOL-CHARTER: `layer`). A tool without a manifest yet is listed in
// UNMANIFESTED below, once, and leaves this table the day it is wired.
//
// Colour follows the layer and never moves (CLAUDE.md): amber Physics, azure
// Environment, emerald Biology, magenta Psychology, stellar Mythology, violet
// Culture, teal Integration.
// ---------------------------------------------------------------------------

import { MANIFESTS } from "@/canon/manifests";
import type { CascadeLayer } from "@/canon/vocabulary";
import type { ManifestAccent } from "@/canon/manifest";

/** Physics → Environment → Biology → Psychology → Mythology → Culture, then Integration. */
export const CASCADE_LAYER_ORDER: readonly CascadeLayer[] = [
  "physics",
  "environment",
  "biology",
  "psychology",
  "mythology",
  "culture",
  "integration",
];

export const LAYER_ACCENT: Record<CascadeLayer, ManifestAccent> = {
  physics: "amber",
  environment: "azure",
  biology: "emerald",
  psychology: "magenta",
  mythology: "stellar",
  culture: "violet",
  integration: "teal",
};

export const CASCADE_LAYER_NAME: Record<CascadeLayer, string> = {
  physics: "Physics",
  environment: "Environment",
  biology: "Biology",
  psychology: "Psychology",
  mythology: "Mythology",
  culture: "Culture",
  integration: "Integration",
};

/** Tools with no manifest yet, by the domain their facts belong to (08). */
export const UNMANIFESTED_TOOL_LAYERS: Readonly<Record<string, CascadeLayer>> = {
  "drake-equation-calculator": "physics", // galaxy.* is a physics domain
  "stellar-cartographer": "physics",
  "environmental-chain-reaction": "environment",
  "surface-cartographer": "environment",
  "species-interaction-matrix": "biology",
  dossier: "psychology",
  "empire-designer": "culture",
  "technology-consequences": "culture",
  lexdrift: "culture",
  "kardashev-scale": "culture", // polity.kardashev
  "generation-ship": "culture", // vessel.*
  timeline: "integration",
  // Simulators (their manifests are the sim lanes'; until they merge):
  solaris: "physics",
  rogue: "physics",
  tidelock: "environment",
  exoforge: "environment",
  exosky: "environment",
};

const FROM_MANIFESTS: Readonly<Record<string, CascadeLayer>> = Object.fromEntries(MANIFESTS.map((m) => [m.tool, m.layer]));

/** The cascade layer of a tool slug; Integration for anything unknown. */
export function toolLayer(toolSlug: string): CascadeLayer {
  return FROM_MANIFESTS[toolSlug] ?? UNMANIFESTED_TOOL_LAYERS[toolSlug] ?? "integration";
}

/** True when the slug is a tool this table knows. */
export function isKnownToolLayer(toolSlug: string): boolean {
  return toolSlug in FROM_MANIFESTS || toolSlug in UNMANIFESTED_TOOL_LAYERS;
}

/** Every known tool slug, grouped by layer in cascade order. */
export function toolsByLayer(): Record<CascadeLayer, string[]> {
  const out = Object.fromEntries(CASCADE_LAYER_ORDER.map((l) => [l, [] as string[]])) as Record<CascadeLayer, string[]>;
  for (const slug of [...Object.keys(FROM_MANIFESTS), ...Object.keys(UNMANIFESTED_TOOL_LAYERS)]) {
    const l = toolLayer(slug);
    if (!out[l].includes(slug)) out[l].push(slug);
  }
  return out;
}
