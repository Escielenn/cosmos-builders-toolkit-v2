// ---------------------------------------------------------------------------
// useCanonChanges, which documents in a world cite something the world has
// moved past (Studio charter 2.5, canon-changed badges).
//
// Cheap by construction:
//   - no fetch of its own: the binder query already carries every document's
//     content, and the live index is the Studio's memoised world index;
//   - documents that cite nothing (no <fact-ref or <entity-mention in the
//     HTML) are skipped with one substring test;
//   - each document's result is cached against its content string and the
//     index it was scanned with, so typing in one scene rescans one scene,
//     and a change in the world rescans only the documents that cite;
//   - inputs are deferred, so a rebuild yields to typing.
// ---------------------------------------------------------------------------

import { useDeferredValue, useMemo, useRef } from "react";
import {
  canonTotal,
  countOf,
  mayCiteCanon,
  rollUpCanonCounts,
  scanCanonChanges,
  type CanonChanges,
  type CanonCount,
  type CanonIndex,
} from "@/lib/writing/canon-changes";
import type { BinderEntry } from "@/lib/binder-tree";

interface DocLike extends BinderEntry {
  content: string | null;
}

interface WorldLike {
  loading: boolean;
  factsByRef: ReadonlyMap<string, { insert: string }>;
  entities: ReadonlyArray<{ id: string; name: string }>;
}

export interface CanonChangesResult {
  /** Documents with at least one change, and what changed. */
  byDoc: ReadonlyMap<string, CanonChanges>;
  /** Counts per document and rolled up into every folder above. */
  counts: ReadonlyMap<string, CanonCount>;
  /** Ids of affected documents (not folders). */
  affected: ReadonlySet<string>;
}

const EMPTY: CanonChangesResult = {
  byDoc: new Map(),
  counts: new Map(),
  affected: new Set(),
};

interface CacheEntry {
  content: string;
  index: CanonIndex;
  result: CanonChanges;
}

export function useCanonChanges(entries: readonly DocLike[] | undefined, world: WorldLike | null): CanonChangesResult {
  const deferredEntries = useDeferredValue(entries);
  const factsByRef = world?.factsByRef;
  const entities = world?.entities;
  const ready = !!world && !world.loading;

  const index = useMemo<CanonIndex | null>(() => {
    if (!ready || !factsByRef || !entities) return null;
    return { facts: factsByRef, entityNames: new Map(entities.map((e) => [e.id, e.name])) };
  }, [ready, factsByRef, entities]);
  const deferredIndex = useDeferredValue(index);

  const cache = useRef(new Map<string, CacheEntry>());

  return useMemo(() => {
    if (!deferredIndex || !deferredEntries || deferredEntries.length === 0) return EMPTY;
    const next = new Map<string, CacheEntry>();
    const byDoc = new Map<string, CanonChanges>();
    const perDoc = new Map<string, CanonCount>();
    for (const e of deferredEntries) {
      if (e.entry_type === "folder") continue;
      const content = e.content ?? "";
      if (!mayCiteCanon(content)) continue;
      const hit = cache.current.get(e.id);
      const result =
        hit && hit.content === content && hit.index === deferredIndex
          ? hit.result
          : scanCanonChanges(content, deferredIndex);
      next.set(e.id, { content, index: deferredIndex, result });
      const c = countOf(result);
      if (canonTotal(c) > 0) {
        byDoc.set(e.id, result);
        perDoc.set(e.id, c);
      }
    }
    cache.current = next;
    if (byDoc.size === 0) return EMPTY;
    return {
      byDoc,
      counts: rollUpCanonCounts(deferredEntries as DocLike[], perDoc),
      affected: new Set(byDoc.keys()),
    };
  }, [deferredEntries, deferredIndex]);
}
