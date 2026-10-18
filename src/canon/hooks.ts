// ---------------------------------------------------------------------------
// canon/hooks, React Query bindings for the canon facade.
//
// Every write invalidates the world's canon queries, so the Studio rail and
// fact chips pick up a new canon or proposed fact without a reload (Law III:
// writing a value anywhere propagates everywhere).
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { canon, type AssertInput, type EpochNote, type FactsQuery, type ProposeInput } from "@/canon";
import type { AssertResult, CanonFact, CanonFactRow } from "@/canon/types";

export const canonKeys = {
  all: (worldId: string | undefined) => ["canon", worldId] as const,
  rows: (worldId: string | undefined) => ["canon", worldId, "rows"] as const,
  facts: (worldId: string | undefined, q: Pick<FactsQuery, "subjectId" | "predicate">) =>
    ["canon", worldId, "facts", q.subjectId ?? null, q.predicate ?? null] as const,
};

/** Stored canon + proposed rows for a world (the Studio merges them itself). */
export function useCanonRows(worldId: string | undefined) {
  const { user } = useAuth();
  return useQuery<CanonFactRow[]>({
    queryKey: canonKeys.rows(worldId),
    queryFn: () => canon.rows(worldId!),
    enabled: !!user && !!worldId,
    staleTime: 30_000,
    // A world whose facts table is not migrated yet must still render.
    retry: false,
  });
}

/** Merged facts (stored + projected), one per (subject, predicate). */
export function useCanonFacts(
  worldId: string | undefined,
  q: Pick<FactsQuery, "subjectId" | "predicate"> = {},
) {
  const { user } = useAuth();
  return useQuery<CanonFact[]>({
    queryKey: canonKeys.facts(worldId, q),
    queryFn: () => canon.facts(worldId!, q),
    enabled: !!user && !!worldId,
    staleTime: 30_000,
  });
}

function useCanonMutation<TVars>(worldId: string | undefined, fn: (v: TVars) => Promise<AssertResult | CanonFactRow>) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: canonKeys.all(worldId) }),
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });
}

/**
 * Assert a fact. A conflict is a RESULT, not an error: the caller shows the
 * diff and lets the writer choose to supersede.
 */
export function useAssertFact(worldId: string | undefined) {
  return useCanonMutation<Omit<AssertInput, "worldId">>(worldId, (v) => canon.assert({ ...v, worldId: worldId! }));
}

export function useProposeFact(worldId: string | undefined) {
  return useCanonMutation<Omit<ProposeInput, "worldId">>(worldId, (v) => canon.propose({ ...v, worldId: worldId! }));
}

export function usePromoteFact(worldId: string | undefined) {
  return useCanonMutation<{ id: string; supersede?: boolean }>(worldId, (v) =>
    canon.promote(v.id, { supersede: v.supersede }),
  );
}

export function useRetractFact(worldId: string | undefined) {
  return useCanonMutation<{ id: string }>(worldId, (v) => canon.retract(v.id));
}

/** Attach an epoch-boundary note to a stored fact (the "both are right" resolution). */
export function useAnnotateFact(worldId: string | undefined) {
  return useCanonMutation<{ id: string; note: EpochNote }>(worldId, (v) => canon.annotate(v.id, v.note));
}
