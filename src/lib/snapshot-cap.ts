// ---------------------------------------------------------------------------
// snapshot-cap, the retention rule for document snapshots.
//
// Unnamed (automatic and quick) snapshots are capped at 20 per document, the
// newest kept. A NAMED snapshot ("Before the rewrite") is the writer saying
// "keep this", so it is never trimmed by the cap. The server trigger in
// supabase/migrations/20261018_writing_p2.sql applies the same rule; this is
// its client mirror for lists held in memory and in the localStorage fallback.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

/** Unnamed snapshots kept per document. Mirrors the trigger's OFFSET 20. */
export const MAX_UNNAMED_SNAPSHOTS = 20;

/** Rows fetched per document: every named snapshot plus the unnamed cap. */
export const SNAPSHOT_FETCH_LIMIT = 200;

export function isNamedSnapshot(s: { name?: string | null }): boolean {
  return typeof s.name === "string" && s.name.trim().length > 0;
}

/**
 * Apply the cap to a newest-first list: keep every named snapshot and the
 * newest `max` unnamed ones, preserving order.
 */
export function capSnapshots<T extends { name?: string | null }>(
  newestFirst: T[],
  max: number = MAX_UNNAMED_SNAPSHOTS,
): T[] {
  let unnamed = 0;
  return newestFirst.filter((s) => {
    if (isNamedSnapshot(s)) return true;
    unnamed += 1;
    return unnamed <= max;
  });
}
