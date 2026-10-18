// ---------------------------------------------------------------------------
// canon/types, the Fact shapes (02-ARCHITECTURE.md §2, 08-VOCABULARY.md
// "Value kinds"). Type-only; safe to import anywhere.
// ---------------------------------------------------------------------------

export type { ToolManifest } from "@/canon/manifest";

/** What is stored. 'projected' is never stored; see Confidence. */
export type StoredConfidence = "canon" | "proposed";

/**
 * The tier a reader sees.
 *   canon     asserted and adopted by the writer
 *   proposed  asserted, awaiting adoption (prose capture, sim promote offers)
 *   projected computed on read from a worksheet / sim save / Codex infobox
 */
export type Confidence = StoredConfidence | "projected";

export const CONFIDENCE_RANK: Record<Confidence, number> = { canon: 0, proposed: 1, projected: 2 };

/** Who asserted a stored fact (facts.source_kind). */
export type AssertSourceKind = "tool" | "sim" | "prose" | "manual" | "import";

export type FactValue =
  | { kind: "scalar"; value: number; unit?: string }
  | { kind: "range"; min: number; max: number; unit?: string }
  | { kind: "enum"; value: string; vocabulary?: string }
  | { kind: "text"; value: string }
  | { kind: "ref"; entity_id: string }
  | { kind: "ref[]"; entity_ids: string[] }
  | { kind: "bool"; value: boolean }
  | { kind: "text[]"; values: string[] }
  // Escape hatch. Every use needs a registered schema name (08).
  | { kind: "struct"; schema: string; value: Record<string, unknown> };

/** One public.facts row, as the client sees it. */
export interface CanonFactRow {
  id: string;
  world_id: string;
  subject_id: string | null;
  predicate: string;
  value: FactValue;
  value_text: string | null;
  unit: string | null;
  confidence: StoredConfidence;
  source_kind: AssertSourceKind;
  source_ref: Record<string, unknown>;
  asserted_by: string | null;
  created_at: string;
  updated_at: string;
  superseded_at: string | null;
}

/**
 * A fact computed on read by the existing pipeline (world-index). Structural
 * on purpose: WorldFact satisfies it, so canon never imports the Studio.
 */
export interface ProjectedInput {
  ref: string;
  factKey: string;
  label: string;
  value: string;
  insert: string;
  entityId: string | null;
  href: string | null;
  sourceKind: string;
  toolLabel: string;
  sourceTitle: string;
  tool: string;
}

export interface Provenance {
  /** Stored source kind, or the projected pipeline's source kind. */
  kind: AssertSourceKind | "worksheet" | "simulation" | "entity" | "chronicle" | string;
  /** "Genesis · Kellis Prime", "Prose", "Manual entry". */
  label: string;
  /** One click to the place this fact is edited (Law III). */
  href: string | null;
  /** Stored source_ref, or { ref } for a projected fact. */
  ref: Record<string, unknown>;
}

/** The merged view canon.facts() returns. */
export interface CanonFact {
  /** Row id for a stored fact; the world-index ref for a projected one. */
  id: string;
  worldId: string;
  subjectId: string | null;
  /** Canonical predicate (aliases and deprecated spellings resolved). */
  predicate: string;
  label: string;
  /** Typed value when stored; null for projected facts (display only). */
  value: FactValue | null;
  /** Display string, what the Studio inserts. */
  valueText: string;
  unit: string | null;
  confidence: Confidence;
  provenance: Provenance;
  /** Lower-ranked facts for the same (subject, predicate), best first. */
  outranks: CanonFact[];
  /** True when something it outranks says a different value. */
  conflicted: boolean;
}

export type AssertResult =
  | { status: "created"; fact: CanonFactRow; superseded?: CanonFactRow }
  | { status: "unchanged"; fact: CanonFactRow }
  | { status: "conflict"; existing: CanonFactRow };
