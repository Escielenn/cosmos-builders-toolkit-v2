/**
 * use-subject-entity — the entity an instrument was opened ON (Brief F4,
 * 13-THE-LIFT.md §1: "a tool opens on an entity. There is no blank Genesis
 * that later gets matched to a planet by name").
 *
 * The subject travels in the URL as ?entityId=<world_entries.id>. Every
 * tool page reads it through this hook; ToolPageLayout shows it; the
 * worksheet save path links the saved worksheet to it. Nothing matches by
 * name — the id is the only truth (11-SIMULATOR-CONSTELLATION §0).
 */

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getEntry } from "@/services/world-entries";
import type { WorldEntry } from "@/services/world-data";

export const SUBJECT_PARAM = "entityId";

/** The subject id from the URL, or null. Pure read; no fetch. */
export function useSubjectEntityId(): string | null {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get(SUBJECT_PARAM);
  return raw && raw.trim() ? raw.trim() : null;
}

export interface SubjectEntity {
  id: string | null;
  entry: WorldEntry | null;
  isLoading: boolean;
  /** An id was given but no such entry exists (deleted, wrong world, or a legacy `entities` id). */
  isMissing: boolean;
}

/** The subject entity itself, fetched from world_entries. */
export function useSubjectEntity(): SubjectEntity {
  const id = useSubjectEntityId();
  const q = useQuery({
    queryKey: ["subject-entity", id],
    queryFn: () => getEntry(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
  return {
    id,
    entry: q.data ?? null,
    isLoading: !!id && q.isLoading,
    isMissing: !!id && !q.isLoading && !q.data,
  };
}
