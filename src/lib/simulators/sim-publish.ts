// ---------------------------------------------------------------------------
// sim-publish, a simulator run onto the Canon Graph (1.9 audit X6).
//
// Publishing used to write the whole payload into world_entries.metadata and
// stop: no provenance a fact could carry, nothing marked stale, and nothing a
// scene could cite. Now each typed fact from sim-canon goes through
// canon.assert with source_kind 'sim' and the run's id, and metadata keeps
// only a per-tool cache (E12: an ExoSky run linked to a planet no longer
// overwrites that planet's Solaris provenance).
//
// The rules, all from the Constitution:
//   - canon.assert never silently overwrites canon. A differing canon value
//     comes back as a conflict; the dialog shows both and the writer chooses
//     (supersede is an explicit second call, never implied).
//   - Recompute marks stale and offers. When a published input differs from
//     what was there, every stored fact derived from it is marked stale and
//     the recomputed value is PROPOSED, not written over the adopted one. On a
//     subject with no derived facts yet, the first computation is asserted.
//   - Derived values come from the owner's registered derivation (Atlas for
//     gravity, Goldilocks for HZ edges), so a sim is never a second producer.
//
// The canon facade is a parameter so this is testable against the memory
// store.
// ---------------------------------------------------------------------------

import type { Canon } from "@/canon/core";
import type { AssertResult, CanonFactRow, FactValue } from "@/canon/types";
import { dependentsOf, deriveAll, type DerivedValue } from "@/canon/derive";
import type { SimCanon, SimCanonFact } from "./sim-canon";
import type { PublishedFact } from "./published-facts";

export interface SimRunSource {
  toolId: string;
  runId: string;
  seed: string | number | null;
  publishedAt: string;
}

export interface PublishConflict {
  fact: SimCanonFact;
  subjectId: string;
  existing: CanonFactRow;
}

export interface PublishOutcome {
  written: number;
  unchanged: number;
  conflicts: PublishConflict[];
  derived: number;
  proposed: number;
  stale: number;
}

type CanonLike = Pick<Canon, "assert" | "propose" | "rows" | "markStale">;

function sourceRef(src: SimRunSource, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { tool: src.toolId, run_id: src.runId, seed: src.seed, published_at: src.publishedAt, ...extra };
}

function scalarOf(v: FactValue): number | null {
  return v.kind === "scalar" && Number.isFinite(v.value) ? v.value : null;
}

/**
 * Write one run's facts. `subjects` maps undefined (the published entity) and
 * each child key to its world_entries id.
 */
export async function publishSimRun(
  canon: CanonLike,
  worldId: string,
  sim: SimCanon,
  subjects: { root: string; children: Record<string, string> },
  src: SimRunSource,
): Promise<PublishOutcome> {
  const out: PublishOutcome = { written: 0, unchanged: 0, conflicts: [], derived: 0, proposed: 0, stale: 0 };
  const bySubject = new Map<string, SimCanonFact[]>();
  for (const f of sim.facts) {
    const id = f.child ? subjects.children[f.child] : subjects.root;
    if (!id) continue;
    bySubject.set(id, [...(bySubject.get(id) ?? []), f]);
  }

  for (const [subjectId, facts] of bySubject) {
    const changed: string[] = [];
    const known: Record<string, number> = {};
    for (const f of facts) {
      const r: AssertResult = await canon.assert({
        worldId,
        subjectId,
        predicate: f.predicate,
        value: f.value,
        valueText: f.display,
        unit: f.unit ?? null,
        sourceKind: "sim",
        sourceRef: sourceRef(src),
      });
      if (r.status === "conflict") {
        out.conflicts.push({ fact: f, subjectId, existing: r.existing });
        const ex = scalarOf(r.existing.value);
        if (ex !== null) known[f.predicate] = ex; // canon wins for derivation
        continue;
      }
      if (r.status === "unchanged") out.unchanged++;
      else {
        out.written++;
        changed.push(f.predicate);
      }
      const n = scalarOf(f.value);
      if (n !== null) known[f.predicate] = n;
    }
    const res = await deriveFor(canon, worldId, subjectId, known, changed, src);
    out.derived += res.derived;
    out.proposed += res.proposed;
    out.stale += res.stale;
  }
  return out;
}

/** Derived values for one subject: assert the first time, stale + propose after. */
async function deriveFor(
  canon: CanonLike,
  worldId: string,
  subjectId: string,
  known: Record<string, number>,
  changed: string[],
  src: SimRunSource,
): Promise<{ derived: number; proposed: number; stale: number }> {
  let derived = 0;
  let proposed = 0;
  let stale = 0;
  const values = deriveAll(known);
  if (values.length === 0) return { derived, proposed, stale };

  const outputs = values.map((v) => v.output);
  const existing = await canon.rows(worldId, { subjectId });
  const have = new Set(existing.filter((r) => r.confidence === "canon").map((r) => r.predicate));

  // Law II: consequence down. Only outputs whose inputs actually changed.
  const affected = new Set(dependentsOf(changed).map((r) => r.derivation.output));
  const toMark = outputs.filter((o) => have.has(o) && affected.has(o));
  if (toMark.length) {
    const marked = await canon.markStale(worldId, subjectId, toMark, {
      because: "UPSTREAM REVISED BY SIMULATION RUN.",
      source: sourceRef(src),
    });
    stale += marked.length;
  }

  for (const v of values) {
    const unit = unitFor(v);
    const value: FactValue = unit
      ? { kind: "scalar", value: Number(v.value.toPrecision(6)), unit }
      : { kind: "scalar", value: Number(v.value.toPrecision(6)) };
    const write = {
      worldId,
      subjectId,
      predicate: v.output,
      value,
      unit: unit ?? null,
      sourceKind: "tool" as const,
      sourceRef: { tool: v.tool.id, derivation: v.derivation.id, inputs: v.inputs, narrative: v.narrative, from_run: src.runId },
    };
    if (have.has(v.output)) {
      if (!affected.has(v.output)) continue;
      await canon.propose(write);
      proposed++;
    } else {
      const r = await canon.assert(write);
      if (r.status === "created") derived++;
    }
  }
  return { derived, proposed, stale };
}

function unitFor(v: DerivedValue): string | undefined {
  return v.tool.produces.find((p) => p.predicate === v.output)?.unit;
}

/**
 * The per-tool metadata cache a publish leaves on the entity (E12). Facts live
 * in canon; this is what open-on and the Codex infobox read without a query.
 * Merges: another tool's run and published facts survive untouched.
 */
export function simRunMetadata(
  prior: Record<string, unknown>,
  src: SimRunSource,
  facts: readonly SimCanonFact[],
  raw: { parameters?: unknown; results?: unknown; narrativeNotes?: Record<string, string> },
): Record<string, unknown> {
  const runs = (prior._sim_runs && typeof prior._sim_runs === "object" ? prior._sim_runs : {}) as Record<string, unknown>;
  const cached: PublishedFact[] = facts.map((f) => ({
    predicate: f.predicate,
    label: f.label,
    value: f.value.kind === "scalar" || f.value.kind === "enum" || f.value.kind === "text" ? f.value.value : f.display,
    ...(f.unit ? { unit: f.unit } : {}),
    source_tool: src.toolId,
    run_id: src.runId,
  }));
  const priorFacts = Array.isArray(prior._published_facts) ? (prior._published_facts as PublishedFact[]) : [];
  const replaced = new Set(cached.map((f) => f.predicate));
  return {
    ...prior,
    // First publisher's provenance stays; later runs live under _sim_runs.
    _source: prior._source ?? {
      kind: "sim",
      tool_id: src.toolId,
      run_id: src.runId,
      seed: src.seed,
      published_at: src.publishedAt,
    },
    _sim_runs: {
      ...runs,
      [src.toolId]: {
        run_id: src.runId,
        seed: src.seed,
        published_at: src.publishedAt,
        parameters: raw.parameters ?? {},
        results: raw.results ?? {},
        ...(raw.narrativeNotes && Object.keys(raw.narrativeNotes).length ? { narrative_notes: raw.narrativeNotes } : {}),
      },
    },
    _published_facts: [...priorFacts.filter((f) => !replaced.has(f.predicate)), ...cached],
  };
}
