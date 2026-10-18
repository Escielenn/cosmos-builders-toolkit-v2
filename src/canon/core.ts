// ---------------------------------------------------------------------------
// canon/core, the facade's logic, independent of where rows live.
//
// createCanon(store, projector) is what src/canon/index.ts wires to Supabase
// and what the tests wire to memory. Everything that decides anything (the
// conflict rule, supersede, promote) lives here, once.
//
// THE RULE (Constitution non-negotiable): assert() never silently overwrites
// confidence:'canon'. Writing canon for a (subject, predicate) that already
// has a live canon fact with a different value returns
// { status:'conflict', existing } and changes nothing, unless the caller
// passes supersede:true. Supersede retires the old row (superseded_at) and
// keeps it, so provenance survives. The database's partial unique index is
// the backstop: a race between two writers fails with 23505, never with two
// live canon facts.
// ---------------------------------------------------------------------------

import { isKnownPredicate, predicateSpellingsFor, resolvePredicate } from "@/canon/vocabulary";
import { mapError } from "@/lib/ship-voice";
import { displayValue, mergeCanonFacts, sameValue, type MergeOptions } from "@/canon/merge";
import type {
  AssertResult,
  AssertSourceKind,
  CanonFact,
  CanonFactRow,
  FactValue,
  ProjectedInput,
  StoredConfidence,
} from "@/canon/types";

// ---------------------------------------------------------------------------
// Store contract
// ---------------------------------------------------------------------------

export interface NewFactRow {
  world_id: string;
  subject_id: string | null;
  predicate: string;
  value: FactValue;
  value_text: string | null;
  unit: string | null;
  confidence: StoredConfidence;
  source_kind: AssertSourceKind;
  source_ref: Record<string, unknown>;
}

export interface CanonStore {
  /** Live (non-superseded) rows for a world, optionally narrowed. */
  listLive(worldId: string, filter?: { subjectId?: string | null; predicates?: string[] }): Promise<CanonFactRow[]>;
  get(id: string): Promise<CanonFactRow | null>;
  /** The live canon row for a slot, any of the given spellings. */
  findLiveCanon(worldId: string, subjectId: string | null, predicates: string[]): Promise<CanonFactRow | null>;
  insert(row: NewFactRow): Promise<CanonFactRow>;
  update(id: string, patch: Partial<Pick<CanonFactRow, "confidence" | "superseded_at">>): Promise<CanonFactRow>;
}

/** Loads the computed-on-read facts for a world (world-index). */
export type Projector = (worldId: string) => Promise<readonly ProjectedInput[]>;

/** An error already in Ship's Voice; `code` keeps the PostgREST code. */
export class CanonError extends Error {
  readonly code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "CanonError";
    this.code = code;
  }
}

export function toCanonError(err: unknown): CanonError {
  if (err instanceof CanonError) return err;
  const code = (err as { code?: string } | null)?.code;
  return new CanonError(mapError(err), code);
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface AssertInput {
  worldId: string;
  subjectId?: string | null;
  predicate: string;
  value: FactValue;
  /** Display string; derived from value when omitted. */
  valueText?: string | null;
  unit?: string | null;
  sourceKind: AssertSourceKind;
  sourceRef?: Record<string, unknown>;
  /** Default 'canon'. */
  confidence?: StoredConfidence;
  /** Explicitly retire a differing live canon fact. Never implied. */
  supersede?: boolean;
}

export type ProposeInput = Omit<AssertInput, "confidence" | "supersede">;

export interface FactsQuery extends Pick<MergeOptions, "rowContext"> {
  subjectId?: string | null;
  predicate?: string;
  /** Supply the projection yourself (the Studio already has it). */
  projected?: readonly ProjectedInput[];
}

const nowIso = (): string => new Date().toISOString();

function checkPredicate(predicate: string): string {
  if (!isKnownPredicate(predicate)) {
    throw new CanonError(`PREDICATE NOT IN VOCABULARY: ${predicate.toUpperCase()}.`);
  }
  const r = resolvePredicate(predicate);
  if (r.via === "deprecated" && import.meta.env?.DEV) {
    console.warn(`[canon] "${predicate}" is deprecated; writing "${r.predicate}" instead.`);
  }
  // Writes always use the canonical spelling.
  return r.predicate;
}

// ---------------------------------------------------------------------------
// Facade
// ---------------------------------------------------------------------------

export function createCanon(store: CanonStore, projector?: Projector) {
  const guard = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      throw toCanonError(err);
    }
  };

  /** Write canon after the conflict rule has been applied. */
  async function writeCanon(
    worldId: string,
    subjectId: string | null,
    predicate: string,
    value: FactValue,
    supersede: boolean,
    write: () => Promise<CanonFactRow>,
    ignoreId?: string,
  ): Promise<AssertResult> {
    const existing = await store.findLiveCanon(worldId, subjectId, predicateSpellingsFor(predicate));
    if (existing && existing.id !== ignoreId) {
      if (sameValue(existing.value, value)) return { status: "unchanged", fact: existing };
      if (!supersede) return { status: "conflict", existing };
      // Retire first so the unique index admits the new row; restore if the
      // write fails, so a failed supersede never leaves the slot empty.
      await store.update(existing.id, { superseded_at: nowIso() });
      try {
        const fact = await write();
        return { status: "created", fact, superseded: existing };
      } catch (err) {
        await store.update(existing.id, { superseded_at: null }).catch(() => undefined);
        throw err;
      }
    }
    return { status: "created", fact: await write() };
  }

  /** Write a fact. Canon by default; never silently overwrites canon. */
  function assert(input: AssertInput): Promise<AssertResult> {
    return guard(async () => {
      const predicate = checkPredicate(input.predicate);
      const subjectId = input.subjectId ?? null;
      const confidence = input.confidence ?? "canon";
      const row: NewFactRow = {
        world_id: input.worldId,
        subject_id: subjectId,
        predicate,
        value: input.value,
        value_text: input.valueText?.trim() || displayValue(input.value, input.unit) || null,
        unit: input.unit ?? null,
        confidence,
        source_kind: input.sourceKind,
        source_ref: input.sourceRef ?? {},
      };
      if (confidence === "proposed") return { status: "created", fact: await store.insert(row) };
      return writeCanon(input.worldId, subjectId, predicate, input.value, !!input.supersede, () => store.insert(row));
    });
  }

  return {
    /**
     * Merged facts: stored rows (canon / proposed) + projected facts, one per
     * (subject, predicate), precedence canon > proposed > projected. See
     * canon/merge.ts for the rule.
     */
    facts(worldId: string, q: FactsQuery = {}): Promise<CanonFact[]> {
      return guard(async () => {
        const predicates = q.predicate ? predicateSpellingsFor(q.predicate) : undefined;
        const [stored, projected] = await Promise.all([
          store.listLive(worldId, { subjectId: q.subjectId, predicates }),
          q.projected ? Promise.resolve(q.projected) : projector ? projector(worldId) : Promise.resolve([]),
        ]);
        return mergeCanonFacts(worldId, stored, projected, {
          subjectId: q.subjectId,
          predicate: q.predicate,
          rowContext: q.rowContext,
        });
      });
    },

    /** Live stored rows only (no projection), for callers that merge themselves. */
    rows(worldId: string, filter?: { subjectId?: string | null; predicate?: string }): Promise<CanonFactRow[]> {
      return guard(() =>
        store.listLive(worldId, {
          subjectId: filter?.subjectId,
          predicates: filter?.predicate ? predicateSpellingsFor(filter.predicate) : undefined,
        }),
      );
    },

    assert,

    /** Write a proposed fact. Proposals never conflict; several may coexist. */
    propose(input: ProposeInput): Promise<AssertResult> {
      return assert({ ...input, confidence: "proposed" });
    },

    /** proposed → canon, under the same conflict rule as assert. */
    promote(id: string, opts: { supersede?: boolean } = {}): Promise<AssertResult> {
      return guard(async () => {
        const row = await store.get(id);
        if (!row || row.superseded_at) throw new CanonError("COORDINATES DO NOT MATCH ANY KNOWN RECORD.", "PGRST116");
        if (row.confidence === "canon") return { status: "unchanged", fact: row };
        return writeCanon(
          row.world_id,
          row.subject_id,
          row.predicate,
          row.value,
          !!opts.supersede,
          () => store.update(id, { confidence: "canon" }),
          id,
        );
      });
    },

    /** Withdraw a fact. Kept with superseded_at set, so provenance survives. */
    retract(id: string): Promise<CanonFactRow> {
      return guard(async () => {
        const row = await store.get(id);
        if (!row) throw new CanonError("COORDINATES DO NOT MATCH ANY KNOWN RECORD.", "PGRST116");
        if (row.superseded_at) return row;
        return store.update(id, { superseded_at: nowIso() });
      });
    },
  };
}

export type Canon = ReturnType<typeof createCanon>;
