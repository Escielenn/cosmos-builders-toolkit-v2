// ---------------------------------------------------------------------------
// canon/ownership, one home for each value (1.5 item 10).
//
// The manifests already say who produces what. This module turns that into
// the questions the UI and continuity ask: who owns this predicate, where is
// it edited, and which values used to be typed into several tools.
//
// SINGLE_HOME is the resolved half of 03-TOOL-CHARTER's anti-duplication
// registry: every predicate the 1.5 review found entered in more than one
// tool, its one producer (chosen per 03 / 08, recorded in the producer's
// manifest), and the tools that now read it instead of owning it.
//
// Must not import codecs, merge or core: merge and core import this.
// ---------------------------------------------------------------------------

import { MANIFESTS, manifestById } from "@/canon/manifests";
import { resolvePredicate } from "@/canon/vocabulary";
import type { ToolManifest } from "@/canon/manifest";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";

export interface SingleHome {
  predicate: string;
  /** Manifest id of the one producer. */
  owner: string;
  /** Manifest ids that read it from canon and prefill (never produce it). */
  consumers: readonly string[];
  /** Why this tool, in one line (also stated in the owner's manifest). */
  reason: string;
  /**
   * The fact's subject is the consumer's own subject (a planet's mass, read
   * by that planet's Atlas sheet). False when it belongs to another entity
   * (the planet's star) or to the world itself (the axiom).
   */
  sharesSubject: boolean;
}

export const SINGLE_HOME: readonly SingleHome[] = [
  {
    predicate: "star.spectral_class",
    owner: "orrery",
    consumers: ["genesis", "goldilocks"],
    reason: "03 registry and 08 star domain: Orrery owns star.*. Genesis and Goldilocks asked for it again.",
    sharesSubject: false,
  },
  {
    predicate: "planet.mass",
    owner: "genesis",
    consumers: ["atlas"],
    reason: "03 registry: Genesis owns planet.radius and planet.mass; Atlas derives from them.",
    sharesSubject: true,
  },
  {
    predicate: "planet.radius",
    owner: "genesis",
    consumers: ["atlas"],
    reason: "03 registry: Genesis owns planet.radius and planet.mass; Atlas derives from them.",
    sharesSubject: true,
  },
  {
    predicate: "planet.surface_gravity",
    owner: "atlas",
    consumers: ["genesis"],
    reason: "03 registry: Atlas only, derived from mass and radius.",
    sharesSubject: true,
  },
  {
    predicate: "propulsion.type",
    owner: "impulse",
    consumers: ["vessel", "paradox"],
    reason: "08 propulsion domain: Impulse. Vessel and Paradox each asked for the drive again.",
    sharesSubject: true,
  },
  {
    predicate: "vessel.crew_size",
    owner: "vessel",
    consumers: ["impulse"],
    reason: "08 vessel domain: Vessel. Impulse's crew capacity reads it.",
    sharesSubject: true,
  },
  {
    predicate: "world.axiom",
    owner: "axiom",
    consumers: ["exodus"],
    reason: "03 Tier 3 #11 and 08 world domain: Axiom. Exodus restated the premise.",
    sharesSubject: false,
  },
];

export function singleHome(predicate: string): SingleHome | undefined {
  const p = resolvePredicate(predicate).predicate;
  return SINGLE_HOME.find((h) => h.predicate === p);
}

/** predicate → every wired manifest id that produces it. One entry each, or it is Parallel Truth. */
export function producersByPredicate(manifests: readonly ToolManifest[] = MANIFESTS): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of manifests) {
    for (const p of m.produces) {
      const ids = out.get(p.predicate) ?? [];
      if (!ids.includes(m.id)) ids.push(m.id);
      out.set(p.predicate, ids);
    }
  }
  return out;
}

const OWNERS = (() => {
  const m = new Map<string, ToolManifest>();
  for (const [predicate, ids] of producersByPredicate()) {
    const owner = manifestById(ids[0]);
    if (owner) m.set(predicate, owner);
  }
  return m;
})();

/** The wired manifest that owns a predicate (any spelling), if one does. */
export function ownerOf(predicate: string): ToolManifest | undefined {
  return OWNERS.get(resolvePredicate(predicate).predicate);
}

/** The owner's tools-config slug, what a projected fact's provenance names. */
export function ownerToolOf(predicate: string): string | undefined {
  return ownerOf(predicate)?.tool;
}

/** "Ballast: Surface Gravity Calculator" → "Ballast". */
export function manifestBrand(m: Pick<ToolManifest, "name">): string {
  const i = m.name.indexOf(":");
  return i > 0 ? m.name.slice(0, i) : m.name;
}

/** Where a predicate is edited: the owner's route, bound to the same world and subject. */
export function ownerHref(owner: Pick<ToolManifest, "route">, worldId: string | null | undefined, subjectId?: string | null): string {
  const params = new URLSearchParams();
  if (worldId) params.set("worldId", worldId);
  if (subjectId) params.set("entityId", subjectId);
  const q = params.toString();
  return q ? `${owner.route}?${q}` : owner.route;
}

/** "GENESIS", "CODEX": the brand of whatever asserted or projected a fact. */
export function sourceBrand(fact: { provenance: { label: string; ref: Record<string, unknown> } }): string {
  const tool = typeof fact.provenance.ref.tool === "string" ? fact.provenance.ref.tool : undefined;
  if (tool) {
    const m = manifestById(tool) ?? MANIFESTS.find((x) => x.tool === tool);
    if (m) return manifestBrand(m).toUpperCase();
    if (tool === "codex") return "CODEX";
    const name = getToolDisplayName(tool);
    const i = name.indexOf(":");
    return (i > 0 ? name.slice(0, i) : name).toUpperCase();
  }
  return fact.provenance.label.toUpperCase();
}

/** One click to where a fact was entered: its sheet when known, else the tool. */
export function sourceHref(
  fact: { provenance: { href: string | null; ref: Record<string, unknown> } },
  worldId: string | null | undefined,
): string | null {
  if (fact.provenance.href) return fact.provenance.href;
  const ref = fact.provenance.ref as { tool?: unknown; toolSlug?: unknown; worksheetId?: unknown };
  const slug =
    typeof ref.toolSlug === "string"
      ? ref.toolSlug
      : typeof ref.tool === "string"
        ? manifestById(ref.tool)?.tool ?? ref.tool
        : null;
  const route = slug ? getToolRoute(slug) : undefined;
  if (!route) return null;
  const params = new URLSearchParams();
  if (worldId) params.set("worldId", worldId);
  if (typeof ref.worksheetId === "string") params.set("worksheetId", ref.worksheetId);
  const q = params.toString();
  return q ? `${route}?${q}` : route;
}
