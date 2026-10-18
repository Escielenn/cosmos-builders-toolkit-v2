// ---------------------------------------------------------------------------
// canon/merge, stored facts + projected facts → one answer per
// (subject, predicate). Pure: no React, no network.
//
// PRECEDENCE (the rule, written down as 12-SESSION-SEQUENCE C2 asks):
//
//     canon  >  proposed  >  projected
//
// for the same (subject_id, canonical predicate). Ties inside a stored tier go
// to the most recently updated row; ties among projected facts keep pipeline
// order (worksheets, then sims, then Codex infoboxes: world-index's order).
//
// Outranking is never silent. Every loser stays attached to the winner in
// `outranks`, and `conflicted` is set when any of them reads differently,
// so a proposed fact that beats a worksheet value still surfaces the
// disagreement (the C2 brief's "it surfaces as a conflict instead").
//
// Nothing here writes. A projected value is never overwritten by being
// outranked: its worksheet still says what it says.
// ---------------------------------------------------------------------------

import { resolvePredicate, predicateLabel } from "@/canon/vocabulary";
import { formatWithUnit } from "@/canon/units";
import {
  CONFIDENCE_RANK,
  type CanonFact,
  type CanonFactRow,
  type FactValue,
  type ProjectedInput,
} from "@/canon/types";

/** The (subject, predicate) identity precedence is decided over. */
export function factSlot(subjectId: string | null | undefined, predicate: string): string {
  return `${subjectId ?? ""}|${resolvePredicate(predicate).predicate}`;
}

/** A typed value as display text, unit attached. */
export function displayValue(value: FactValue | null | undefined, unit?: string | null): string {
  if (!value) return "";
  switch (value.kind) {
    case "scalar":
      return formatWithUnit(String(value.value), value.unit ?? unit);
    case "range":
      return formatWithUnit(`${value.min}–${value.max}`, value.unit ?? unit);
    case "enum":
    case "text":
      return value.value;
    case "bool":
      return value.value ? "Yes" : "No";
    case "text[]":
      return value.values.join(", ");
    case "ref":
      return value.entity_id;
    case "ref[]":
      return value.entity_ids.join(", ");
    case "struct":
      return value.schema;
  }
}

/** Whitespace-insensitive, case-sensitive: case is meaning. */
function sameText(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, " ") === b.trim().replace(/\s+/g, " ");
}

/** Do two stored values say the same thing? */
export function sameValue(a: FactValue, b: FactValue): boolean {
  return JSON.stringify(canonicalJson(a)) === JSON.stringify(canonicalJson(b));
}

function canonicalJson(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonicalJson);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => [k, canonicalJson(o[k])]),
    );
  }
  return v;
}

export function rowToCanonFact(
  row: CanonFactRow,
  ctx: { label?: string; href?: string | null } = {},
): CanonFact {
  const predicate = resolvePredicate(row.predicate).predicate;
  return {
    id: row.id,
    worldId: row.world_id,
    subjectId: row.subject_id,
    predicate,
    label: predicateLabel(predicate),
    value: row.value,
    valueText: row.value_text?.trim() || displayValue(row.value, row.unit),
    unit: row.unit,
    confidence: row.confidence,
    provenance: {
      kind: row.source_kind,
      label: ctx.label ?? sourceKindLabel(row.source_kind),
      href: ctx.href ?? null,
      ref: row.source_ref ?? {},
    },
    outranks: [],
    conflicted: false,
  };
}

export function projectedToCanonFact(p: ProjectedInput, worldId: string): CanonFact {
  return {
    id: p.ref,
    worldId,
    subjectId: p.entityId,
    predicate: resolvePredicate(p.factKey).predicate,
    label: p.label,
    value: null,
    valueText: p.insert,
    unit: null,
    confidence: "projected",
    provenance: {
      kind: p.sourceKind,
      label: p.toolLabel === p.sourceTitle ? p.toolLabel : `${p.toolLabel} · ${p.sourceTitle}`,
      href: p.href,
      ref: { ref: p.ref, tool: p.tool, key: p.factKey },
    },
    outranks: [],
    conflicted: false,
  };
}

export function sourceKindLabel(kind: string): string {
  switch (kind) {
    case "tool":
      return "Tool";
    case "sim":
      return "Simulation";
    case "prose":
      return "Prose";
    case "manual":
      return "Manual entry";
    case "import":
      return "Import";
    default:
      return kind;
  }
}

export interface MergeOptions {
  subjectId?: string | null;
  predicate?: string;
  /** Builds the provenance label / route for a stored row. */
  rowContext?: (row: CanonFactRow) => { label?: string; href?: string | null };
}

/**
 * The merged facts: one winner per (subject, predicate), losers attached.
 * Superseded rows are ignored. Order: by best tier, then first appearance.
 */
export function mergeCanonFacts(
  worldId: string,
  stored: readonly CanonFactRow[],
  projected: readonly ProjectedInput[],
  opts: MergeOptions = {},
): CanonFact[] {
  const wantPredicate = opts.predicate ? resolvePredicate(opts.predicate).predicate : null;
  const wantSubject = opts.subjectId;

  const candidates: Array<{ fact: CanonFact; order: number; updated: number }> = [];
  let order = 0;

  const live = stored.filter((r) => r.world_id === worldId && !r.superseded_at);
  for (const row of live) {
    const fact = rowToCanonFact(row, opts.rowContext?.(row));
    candidates.push({ fact, order: order++, updated: Date.parse(row.updated_at) || 0 });
  }
  for (const p of projected) {
    candidates.push({ fact: projectedToCanonFact(p, worldId), order: order++, updated: 0 });
  }

  const groups = new Map<string, typeof candidates>();
  for (const c of candidates) {
    if (wantPredicate && c.fact.predicate !== wantPredicate) continue;
    if (wantSubject !== undefined && (c.fact.subjectId ?? null) !== (wantSubject ?? null)) continue;
    const slot = factSlot(c.fact.subjectId, c.fact.predicate);
    const g = groups.get(slot);
    if (g) g.push(c);
    else groups.set(slot, [c]);
  }

  const winners: Array<{ fact: CanonFact; order: number }> = [];
  for (const g of groups.values()) {
    g.sort(
      (a, b) =>
        CONFIDENCE_RANK[a.fact.confidence] - CONFIDENCE_RANK[b.fact.confidence] ||
        b.updated - a.updated ||
        a.order - b.order,
    );
    const [best, ...rest] = g;
    const outranks = rest.map((r) => r.fact);
    winners.push({
      fact: {
        ...best.fact,
        outranks,
        conflicted: outranks.some((o) => !sameText(o.valueText, best.fact.valueText)),
      },
      order: Math.min(...g.map((x) => x.order)),
    });
  }

  winners.sort(
    (a, b) => CONFIDENCE_RANK[a.fact.confidence] - CONFIDENCE_RANK[b.fact.confidence] || a.order - b.order,
  );
  return winners.map((w) => w.fact);
}
