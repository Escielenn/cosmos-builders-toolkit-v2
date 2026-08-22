import { useQuery } from "@tanstack/react-query";
import { getWorksheetSubjects, type WorksheetSubject } from "@/services/worksheet-subjects";

/**
 * The world_entries subject linked to each worksheet id, keyed by worksheet id.
 *
 * Used by ContinuityPanel to stamp subject_id onto extracted facts so a
 * check can be scoped to one entity instead of pooling the whole world.
 * See docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §0 (Brief S0).
 */
export function useWorksheetSubjects(worksheetIds: string[]) {
  // A stable, order-independent key so the query doesn't refire on every
  // render just because the array is a new reference with the same ids.
  const key = [...worksheetIds].sort().join(",");

  return useQuery<Record<string, WorksheetSubject>>({
    queryKey: ["worksheet-subjects", key],
    queryFn: () => getWorksheetSubjects(worksheetIds),
    enabled: worksheetIds.length > 0,
    staleTime: 30_000,
  });
}
