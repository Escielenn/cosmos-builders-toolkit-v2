// ---------------------------------------------------------------------------
// canon/manifest, the ToolManifest contract (docs/stellarforge/03-TOOL-CHARTER.md).
//
// Every tool declares what it creates, writes, reads, derives and gives the
// page. Manifests live with the tool (src/tools/<id>/manifest.ts, per the
// Charter) and are registered in src/canon/manifests/index.ts.
//
// validateManifest() is the pure core of the /sf-audit manifest checks, so
// CI can run them as a unit test instead of trusting prose.
// ---------------------------------------------------------------------------

import { isKnownPredicate, predicateDef, resolvePredicate, type CascadeLayer } from "@/canon/vocabulary";
import type { Unit } from "@/canon/units";
import type { FactValue } from "@/canon/types";

export type ToolKind = "worksheet" | "calculator" | "simulator" | "cartographer";

export type ToolCategory = "stars-systems" | "worlds" | "life" | "civilizations" | "mythology" | "integration";

export type ManifestAccent = "amber" | "azure" | "emerald" | "violet" | "stellar" | "teal" | "magenta";

export interface ManifestEntity {
  type: string;
  /**
   * `field:<dot.path>` into the worksheet blob, or `subject`: the
   * world_entries row the worksheet is linked to (entity_worksheets).
   */
  from: string;
  primary?: boolean;
}

export interface ManifestProduces {
  predicate: string;
  /** `field:<dot.path>` (worksheet) or `derive:<derivation id>`. */
  from: string;
  unit?: Unit;
  kind?: FactValue["kind"];
}

export type OnMissing = "prompt" | "derive" | "link" | "ignore";

export interface ManifestConsumes {
  predicate: string;
  required: boolean;
  onMissing: OnMissing;
  /** Ship's Voice line for onMissing:'prompt'. */
  prompt?: string;
  /** Tool id that owns this predicate, for onMissing:'link'. */
  producer?: string;
}

/** 02-ARCHITECTURE.md §3. Inputs/output are canonical predicates. */
export interface Derivation {
  id: string;
  label: string;
  inputs: readonly string[];
  output: string;
  fn: (inputs: Record<string, number>) => number | null;
  invalidates: "always" | "on_input_change";
  /** One Ship's-Voice sentence of consequence. Required (Charter obligation 3). */
  narrative: (out: number, inputs: Record<string, number>) => string;
}

export interface ToolManifest {
  /** Stable manifest id ('genesis'); never a predicate prefix. */
  id: string;
  /** tools-config slug ('planetary-profile'), what worksheets.tool_type stores. */
  tool: string;
  name: string;
  kind: ToolKind;
  category: ToolCategory;
  accent: ManifestAccent;
  layer: CascadeLayer;
  /** Route of the editing surface. */
  route: string;
  entities: readonly ManifestEntity[];
  produces: readonly ManifestProduces[];
  consumes: readonly ManifestConsumes[];
  derives: readonly Derivation[];
  situations: readonly string[];
  studio: {
    railSection: string;
    influences: readonly string[];
    narrative?: (facts: Record<string, number | string | undefined>) => string[];
  };
  upstream: readonly string[];
  downstream: readonly string[];
}

export interface ManifestIssue {
  tool: string;
  rule: string;
  detail: string;
}

/** The /sf-audit manifest rules (03 "Why the manifest is the enforcement mechanism"). */
export function validateManifest(m: ToolManifest): ManifestIssue[] {
  const out: ManifestIssue[] = [];
  const issue = (rule: string, detail: string) => out.push({ tool: m.id, rule, detail });

  if (m.produces.length === 0) issue("no-produces", "Law I: a tool with no produces is orphan data.");
  for (const p of m.produces) {
    if (!isKnownPredicate(p.predicate) || p.predicate.startsWith("legacy.")) {
      issue("unknown-predicate", `produces ${p.predicate}, absent from the vocabulary.`);
      continue;
    }
    const def = predicateDef(p.predicate);
    if (def?.deprecated) issue("deprecated-predicate", `produces deprecated ${p.predicate}; use ${def.aliasOf}.`);
    if (def?.producer && def.producer !== m.id && !p.from.startsWith("sim:")) {
      issue("second-producer", `produces ${p.predicate}, owned by ${def.producer}. Parallel Truth risk.`);
    }
    if (p.from.startsWith("derive:") && !m.derives.some((d) => `derive:${d.id}` === p.from)) {
      issue("unknown-derivation", `${p.predicate} from ${p.from}, which this manifest does not register.`);
    }
  }
  for (const c of m.consumes) {
    if (!isKnownPredicate(c.predicate)) issue("unknown-predicate", `consumes ${c.predicate}, absent from the vocabulary.`);
    if (!c.onMissing) issue("no-on-missing", `consumes ${c.predicate} with no onMissing handler (Law III).`);
    if (c.onMissing === "prompt" && !c.prompt) issue("no-prompt", `consumes ${c.predicate} with onMissing:'prompt' and no prompt.`);
    if (c.onMissing === "link" && !c.producer) issue("no-producer", `consumes ${c.predicate} with onMissing:'link' and no producer.`);
  }
  for (const d of m.derives) {
    if (typeof d.narrative !== "function") issue("no-narrative", `derivation ${d.id} has no narrative.`);
    if (!d.id.startsWith(`${m.id}.`)) issue("derivation-id", `derivation ${d.id} must carry the tool id.`);
    for (const p of [...d.inputs, d.output]) {
      if (resolvePredicate(p).via !== "exact") issue("unknown-predicate", `derivation ${d.id} uses ${p}, not a canonical predicate.`);
    }
  }
  if (!m.studio || !m.studio.railSection) issue("no-studio", "Prime Law: the tool does not reach the page.");
  return out;
}
