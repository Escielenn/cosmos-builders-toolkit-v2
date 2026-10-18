// ---------------------------------------------------------------------------
// src/canon, the one door to world facts (02-ARCHITECTURE.md "Query surface").
//
//   canon.facts(worldId, { subjectId?, predicate? })  merged, precedence-ranked
//   canon.assert({...})    write; never silently overwrites canon
//   canon.propose({...})   write as 'proposed'
//   canon.promote(id)      proposed → canon, same conflict rule
//   canon.retract(id)      withdraw (kept, superseded_at set)
//
// Phase A posture: projected facts (worksheets, sim saves, Codex infoboxes)
// remain computed on read and are never copied into public.facts. Only facts
// that cannot be derived are stored. See AMENDMENTS.md 2026-10-19.
//
// Errors thrown from here are CanonError, already in Ship's Voice.
// ---------------------------------------------------------------------------

import { createCanon } from "@/canon/core";
import { supabaseCanonStore, supabaseProjector } from "@/canon/supabase-store";

export const canon = createCanon(supabaseCanonStore, supabaseProjector);

export { createCanon, CanonError } from "@/canon/core";
export type { AssertInput, ProposeInput, FactsQuery, CanonStore, Projector, Canon, EpochNote } from "@/canon/core";
export { mergeCanonFacts, factSlot, displayValue } from "@/canon/merge";
export { resolvePredicate, predicateLabel, isKnownPredicate, VOCABULARY } from "@/canon/vocabulary";
export type * from "@/canon/types";
