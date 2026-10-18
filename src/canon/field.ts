// ---------------------------------------------------------------------------
// canon/field, the pure decisions behind one home per value (1.5 item 10).
//
//   pickCanonField   which canon fact a consumer field reads
//   consumerState    prefill / in sync / diverged / missing / ambiguous
//   planEmit         what a producer asserts when the writer saves
//   conflictsFrom    which asserts came back as conflicts (KEEP CANON / REPLACE)
//
// No React, no network: the hooks in canon/field-hooks.ts and the
// CanonProvenance / CanonConflictPrompt components are thin over these.
// ---------------------------------------------------------------------------

import { codecFor, scalarCodec, valuesAgree } from "@/canon/codecs";
import { resolvePredicate, predicateLabel } from "@/canon/vocabulary";
import type { ToolManifest } from "@/canon/manifest";
import type { AssertResult, CanonFact, CanonFactRow, FactValue } from "@/canon/types";

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** Which tool a fact came from: manifest id for stored rows, tools-config slug for projected. */
export function factSourceTool(f: CanonFact): string | undefined {
  const t = (f.provenance.ref as { tool?: unknown }).tool;
  return typeof t === "string" ? t : undefined;
}

function isFrom(f: CanonFact, self: { id: string; tool: string } | undefined): boolean {
  if (!self) return false;
  const t = factSourceTool(f);
  return t === self.id || t === self.tool;
}

/** A fact's typed value: the stored value, or its display text read through the predicate's codec. */
export function factValue(f: CanonFact | null | undefined): FactValue | null {
  if (!f) return null;
  return f.value ?? codecFor(f.predicate).read(f.valueText);
}

export type PickScope = "subject" | "world" | "unique" | "none";

export interface CanonFieldPick {
  fact: CanonFact | null;
  value: FactValue | null;
  scope: PickScope;
  /** Several subjects say different things and none is this one. */
  ambiguous: boolean;
  /** The competing facts when ambiguous, best first. */
  candidates: CanonFact[];
}

const NONE: CanonFieldPick = { fact: null, value: null, scope: "none", ambiguous: false, candidates: [] };

/**
 * The fact a consumer field should read.
 *
 * `facts` is canon.facts(worldId) (merged, one winner per slot). A consumer
 * never reads its own copy back as if it came from the owner, so facts from
 * `self` are skipped and the best remaining fact in that slot is used.
 *
 * Subject order: this subject; else a world-level fact; else, when every
 * remaining subject agrees, that value (a planet's star, filed on the star
 * system). Disagreeing subjects are ambiguous: nothing is prefilled.
 */
export function pickCanonField(
  facts: readonly CanonFact[],
  predicate: string,
  subjectId: string | null | undefined,
  self?: { id: string; tool: string },
): CanonFieldPick {
  const want = resolvePredicate(predicate).predicate;
  const best: CanonFact[] = [];
  for (const winner of facts) {
    if (winner.predicate !== want) continue;
    const pick = [winner, ...winner.outranks].find((f) => !isFrom(f, self));
    if (pick) best.push(pick);
  }
  if (best.length === 0) return NONE;

  const one = (fact: CanonFact, scope: PickScope): CanonFieldPick => ({
    fact,
    value: factValue(fact),
    scope,
    ambiguous: false,
    candidates: [fact],
  });

  if (subjectId) {
    const mine = best.find((f) => f.subjectId === subjectId);
    if (mine) return one(mine, "subject");
  }
  const world = best.find((f) => f.subjectId == null);
  if (world) return one(world, "world");

  const first = best[0];
  const firstValue = factValue(first);
  if (best.every((f) => valuesAgree(factValue(f), firstValue))) return one(first, "unique");
  return { fact: null, value: null, scope: "none", ambiguous: true, candidates: best };
}

// ---------------------------------------------------------------------------
// Consumer state
// ---------------------------------------------------------------------------

export type ConsumerState =
  /** Nothing on file. The field is the writer's; offer the owner. */
  | "missing"
  /** Several subjects disagree; bind an entity or edit at the owner. */
  | "ambiguous"
  /** Write canon into the field now (empty field, or a fresh sheet). */
  | "prefill"
  | "in-sync"
  /** The sheet says something else: show both, offer USE CANON / EDIT AT / OVERRIDE HERE. */
  | "diverged";

/**
 * @param local      the field's current value, read through the predicate's codec
 * @param pick       pickCanonField's answer
 * @param pristine   the sheet holds only defaults (new, never saved): canon may replace them
 */
export function consumerState(local: FactValue | null, pick: CanonFieldPick, pristine = false): ConsumerState {
  if (pick.ambiguous) return "ambiguous";
  if (!pick.fact || !pick.value) return "missing";
  if (valuesAgree(local, pick.value)) return "in-sync";
  if (!local || pristine) return "prefill";
  return "diverged";
}

// ---------------------------------------------------------------------------
// Producing
// ---------------------------------------------------------------------------

export function getAtPath(data: unknown, path: string): unknown {
  let cur: unknown = data;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export interface PlannedAssert {
  predicate: string;
  value: FactValue;
  valueText: string;
  unit: string | null;
  /** Derivation inputs, kept on source_ref so provenance names them. */
  inputs?: Record<string, number>;
  derivation?: string;
}

export interface WithheldAssert {
  predicate: string;
  /** Ship's Voice. */
  reason: string;
}

export interface EmitOptions {
  /**
   * Values the tool computes itself, by predicate. Wins over the field path
   * (Impulse's custom drive text) and over the manifest's derivation (Paradox's
   * full relativistic run). null means "nothing to assert".
   */
  overrides?: Readonly<Record<string, FactValue | number | null | undefined>>;
  /** The derivation inputs as this sheet holds them, by predicate. */
  inputs?: Readonly<Record<string, number | null | undefined>>;
  /** What canon says for those inputs (from another source than this tool). */
  canonInputs?: Readonly<Record<string, FactValue | null | undefined>>;
}

/**
 * What a producer asserts on save: every manifest `produces` entry that has
 * a value, read through the predicate's codec. A derived value whose inputs
 * on this sheet disagree with canon is withheld rather than asserted, so
 * canon gravity never derives from a mass canon does not hold.
 */
export function planEmit(manifest: ToolManifest, data: unknown, opts: EmitOptions = {}): {
  asserts: PlannedAssert[];
  withheld: WithheldAssert[];
} {
  const asserts: PlannedAssert[] = [];
  const withheld: WithheldAssert[] = [];
  const overrides = opts.overrides ?? {};

  for (const p of manifest.produces) {
    const codec = p.kind === "scalar" || p.unit ? scalarCodec(p.unit) : codecFor(p.predicate);
    let value: FactValue | null = null;
    let inputs: Record<string, number> | undefined;
    let derivation: string | undefined;

    if (p.from.startsWith("derive:")) {
      const d = manifest.derives.find((x) => `derive:${x.id}` === p.from);
      if (!d) continue;
      derivation = d.id;
      const vals: Record<string, number> = {};
      let complete = true;
      for (const input of d.inputs) {
        const v = opts.inputs?.[input];
        if (typeof v !== "number" || !Number.isFinite(v)) complete = false;
        else vals[input] = v;
      }
      if (!complete) continue;
      const diverged = d.inputs.filter((input) => {
        const canonV = opts.canonInputs?.[input];
        return canonV ? !valuesAgree({ kind: "scalar", value: vals[input] }, canonV) : false;
      });
      if (diverged.length) {
        withheld.push({
          predicate: p.predicate,
          reason: `${predicateLabel(p.predicate).toUpperCase()} WITHHELD. ${diverged
            .map((i) => predicateLabel(i).toUpperCase())
            .join(", ")} ON THIS SHEET DIFFERS FROM CANON.`,
        });
        continue;
      }
      inputs = vals;
      if (p.predicate in overrides) {
        const o = overrides[p.predicate];
        value = typeof o === "number" ? codec.read(o) : o ?? null;
      } else {
        const out = d.fn(vals);
        value = out === null ? null : codec.read(out);
      }
    } else if (p.predicate in overrides) {
      const o = overrides[p.predicate];
      value = typeof o === "number" ? codec.read(o) : o ?? null;
    } else if (p.from.startsWith("field:")) {
      value = codec.read(getAtPath(data, p.from.slice("field:".length)));
    }

    if (!value) continue;
    if (value.kind === "scalar" && p.unit && !value.unit) value = { ...value, unit: p.unit };
    asserts.push({
      predicate: p.predicate,
      value,
      valueText: codec.text(value),
      unit: p.unit ?? null,
      ...(inputs ? { inputs } : {}),
      ...(derivation ? { derivation } : {}),
    });
  }
  return { asserts, withheld };
}

// ---------------------------------------------------------------------------
// Conflicts
// ---------------------------------------------------------------------------

export interface CanonConflict {
  predicate: string;
  label: string;
  /** The live canon row's id (the one REPLACE supersedes). */
  existingId: string;
  canonText: string;
  sheetText: string;
  planned: PlannedAssert;
}

export interface EmitOutcome {
  planned: PlannedAssert;
  result: AssertResult;
}

/** The asserts that came back as conflicts, ready for the KEEP CANON / REPLACE prompt. */
export function conflictsFrom(outcomes: readonly EmitOutcome[]): CanonConflict[] {
  const out: CanonConflict[] = [];
  for (const { planned, result } of outcomes) {
    if (result.status !== "conflict") continue;
    const e = result.existing;
    out.push({
      predicate: planned.predicate,
      label: predicateLabel(planned.predicate),
      existingId: e.id,
      canonText: e.value_text?.trim() || codecFor(e.predicate).text(e.value) || "",
      sheetText: planned.valueText,
      planned,
    });
  }
  return out;
}

/** One Ship's Voice line for the save toast. */
export function emitSummary(outcomes: readonly EmitOutcome[], withheld: readonly WithheldAssert[]): string | null {
  const written = outcomes.filter((o) => o.result.status === "created").length;
  const conflicts = outcomes.filter((o) => o.result.status === "conflict").length;
  const parts: string[] = [];
  if (written) parts.push(`${written} ${written === 1 ? "FACT" : "FACTS"} ENTERED IN CANON.`);
  if (conflicts) parts.push(`${conflicts} ${conflicts === 1 ? "CONFLICT" : "CONFLICTS"} WITH CANON. REVIEW REQUIRED.`);
  if (withheld.length) parts.push(`${withheld.length} DERIVED ${withheld.length === 1 ? "VALUE" : "VALUES"} WITHHELD.`);
  return parts.length ? parts.join(" ") : null;
}

/**
 * A conflict with this same sheet's own earlier assert is the writer editing
 * the source, not a disagreement with canon held elsewhere: the producer
 * revises it (supersede, history kept) and says so. Canon adopted from prose,
 * typed by hand, promoted from a sim or asserted by another sheet always
 * prompts.
 */
export function isOwnPriorAssert(
  existing: Pick<CanonFactRow, "source_kind" | "source_ref">,
  toolId: string,
  worksheetId: string | null | undefined,
): boolean {
  if (existing.source_kind !== "tool" || !worksheetId) return false;
  const ref = existing.source_ref as { tool?: unknown; worksheetId?: unknown };
  return ref.tool === toolId && ref.worksheetId === worksheetId;
}
