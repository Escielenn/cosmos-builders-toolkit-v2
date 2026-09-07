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
/**
 * The simulators shipped open-on before the tool pages did, on `?entity=`
 * (Brief S1 as written). F4 then settled on `?entityId=` for tools. One
 * subject, one hook, both spellings — every link the app writes now uses
 * `entityId`, and `entity` keeps old links and bookmarks working.
 */
export const SUBJECT_PARAM_LEGACY = "entity";
/** Which epoch to read the subject at (Law V). */
export const EPOCH_PARAM = "epoch";

function clean(raw: string | null): string | null {
  return raw && raw.trim() ? raw.trim() : null;
}

/** The subject id from the URL, or null. Pure read; no fetch. */
export function useSubjectEntityId(): string | null {
  const [searchParams] = useSearchParams();
  return (
    clean(searchParams.get(SUBJECT_PARAM)) ??
    clean(searchParams.get(SUBJECT_PARAM_LEGACY))
  );
}

/**
 * The epoch the subject should be read at, or null for "the present".
 * Parsed, not trusted: a non-numeric ?epoch= is no epoch at all.
 */
export function useSubjectEpoch(): number | null {
  const [searchParams] = useSearchParams();
  const raw = clean(searchParams.get(EPOCH_PARAM));
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export interface SubjectEntity {
  id: string | null;
  entry: WorldEntry | null;
  /** From ?epoch=; null means the present. */
  epoch: number | null;
  isLoading: boolean;
  /** An id was given but no such entry exists (deleted, or the wrong world). */
  isMissing: boolean;
}

/** The subject entity itself, fetched from world_entries. */
export function useSubjectEntity(): SubjectEntity {
  const id = useSubjectEntityId();
  const epoch = useSubjectEpoch();
  const q = useQuery({
    queryKey: ["subject-entity", id],
    queryFn: () => getEntry(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
  return {
    id,
    entry: q.data ?? null,
    epoch,
    isLoading: !!id && q.isLoading,
    isMissing: !!id && !q.isLoading && !q.data,
  };
}
