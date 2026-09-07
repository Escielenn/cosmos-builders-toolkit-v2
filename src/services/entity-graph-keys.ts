// ---------------------------------------------------------------------------
// One graph, one cache invalidation (F3).
//
// `world_entries` is now read under several names — the Codex list, the world
// outline, the entity sidebar, the Web view. They are the same rows, so a
// write through any of them has to invalidate all of them or the app shows
// two answers to one question, which is the Parallel Truth this session
// removed from the database.
// ---------------------------------------------------------------------------

import type { QueryClient } from "@tanstack/react-query";

export const entityGraphKeys = {
  entities: (worldId: string) => ["entities", worldId] as const,
  connections: (worldId: string) => ["entity-connections", worldId] as const,
};

/**
 * Every query key that reads `world_entries` for one world.
 *
 * Add a reader, add it here. The one this list existed to catch: editing an
 * entity's cascade stage on its Codex page left the Web view showing the old
 * colour, because the metadata mutation invalidated `codex-data` but not
 * `entities` — the same rows under two names.
 *
 * The last two are keyed by entry id, not world id, so they invalidate by
 * prefix. Cheap: the entity page holds at most a handful of them.
 */
export function invalidateWorldEntries(qc: QueryClient, worldId: string | undefined): void {
  if (!worldId) return;
  qc.invalidateQueries({ queryKey: ["entities", worldId] });
  qc.invalidateQueries({ queryKey: ["world-entities", worldId] });
  qc.invalidateQueries({ queryKey: ["codex-data", worldId] });
  qc.invalidateQueries({ queryKey: ["world-outline", worldId] });
  qc.invalidateQueries({ queryKey: ["wiki-page"] });
  qc.invalidateQueries({ queryKey: ["codex-entity-worksheets"] });
}

/** Every query key that reads `world_connections` for one world. */
export function invalidateWorldConnections(qc: QueryClient, worldId: string | undefined): void {
  if (!worldId) return;
  qc.invalidateQueries({ queryKey: ["entity-connections", worldId] });
  qc.invalidateQueries({ queryKey: ["wiki-page-connections", worldId] });
  qc.invalidateQueries({ queryKey: ["codex-data", worldId] });
}
