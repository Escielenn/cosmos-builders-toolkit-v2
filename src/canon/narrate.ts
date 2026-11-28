// ---------------------------------------------------------------------------
// canon/narrate, what the manifests say about the world (1.9 audit F-02).
//
// Every manifest carries studio.narrative and every derivation a narrative,
// and nothing read them (Charter obligations 3 to 5). This turns a world's
// canon facts into those sentences, grouped by the tool that wrote them, in
// cascade order, so the Studio rail and the tool readouts can show the
// consequence beside the number. `1.4 g` is data; "Stairs are a hazard" is
// the product.
//
// Pure: takes facts, returns blocks. No React, no network.
// ---------------------------------------------------------------------------

import { MANIFESTS } from "@/canon/manifests";
import type { CascadeLayer } from "@/canon/vocabulary";
import type { ManifestAccent } from "@/canon/manifest";
import { CASCADE_LAYER_ORDER } from "@/canon/tool-layers";
import { isStaleFact } from "@/canon/merge";
import type { CanonFact, FactValue } from "@/canon/types";

export interface NarrativeBlock {
  toolId: string;
  /** Brand ("Ballast"), from the manifest name. */
  brand: string;
  layer: CascadeLayer;
  accent: ManifestAccent;
  route: string;
  /** Scene aspects this tool's facts shape ("scene.light"), from the manifest. */
  influences: readonly string[];
  lines: string[];
  /** True when one of the facts behind these lines is marked stale. */
  stale: boolean;
}

type FactLike = Pick<CanonFact, "predicate" | "valueText" | "value" | "confidence"> & Partial<Pick<CanonFact, "provenance">>;

function scalarOrText(v: FactValue | null, text: string): number | string {
  if (v && v.kind === "scalar") return v.value;
  if (v && v.kind === "bool") return v.value ? "true" : "false";
  const n = Number(text.replace(/,/g, "").match(/^-?\d+(\.\d+)?(e[+-]?\d+)?/i)?.[0]);
  return Number.isFinite(n) && /^-?\d/.test(text.trim()) ? n : text;
}

const RANK: Record<string, number> = { canon: 0, proposed: 1, projected: 2 };

/**
 * One value per predicate for narrating: the best-ranked fact wins (canon
 * over proposed over projected), so the sentence describes what is decided.
 */
export function factRecord(facts: readonly FactLike[]): {
  values: Record<string, number | string>;
  stale: Set<string>;
} {
  const best = new Map<string, FactLike>();
  for (const f of facts) {
    const cur = best.get(f.predicate);
    if (!cur || (RANK[f.confidence] ?? 9) < (RANK[cur.confidence] ?? 9)) best.set(f.predicate, f);
  }
  const values: Record<string, number | string> = {};
  const stale = new Set<string>();
  for (const [p, f] of best) {
    values[p] = scalarOrText(f.value, f.valueText);
    if (f.provenance && isStaleFact({ provenance: f.provenance })) stale.add(p);
  }
  return { values, stale };
}

/** Every manifest's sentences for these facts, in cascade order. */
export function narrativeBlocks(facts: readonly FactLike[]): NarrativeBlock[] {
  const { values, stale } = factRecord(facts);
  const out: NarrativeBlock[] = [];
  for (const m of MANIFESTS) {
    const fn = m.studio.narrative;
    if (!fn) continue;
    let lines: string[] = [];
    try {
      lines = fn(values).filter((l) => typeof l === "string" && l.trim().length > 0);
    } catch {
      lines = [];
    }
    if (lines.length === 0) continue;
    out.push({
      toolId: m.id,
      brand: m.name.split(":")[0].trim(),
      layer: m.layer,
      accent: m.accent,
      route: m.route,
      influences: m.studio.influences,
      lines,
      stale: m.produces.some((p) => stale.has(p.predicate)),
    });
  }
  return out.sort((a, b) => CASCADE_LAYER_ORDER.indexOf(a.layer) - CASCADE_LAYER_ORDER.indexOf(b.layer));
}

/** How many manifests' studio blocks have something to say (the sf-audit count). */
export function renderableStudioBlocks(): number {
  return MANIFESTS.filter((m) => typeof m.studio.narrative === "function").length;
}
