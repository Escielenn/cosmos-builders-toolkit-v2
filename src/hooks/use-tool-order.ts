import { useState, useCallback } from "react";

const STORAGE_KEY_PREFIX = "sf:tool-order";

/**
 * Persists a custom ordering of tool IDs per world (localStorage).
 * Falls back to the default order if no custom order is saved.
 */
export function useToolOrder(worldId: string | undefined, defaultOrder: string[]) {
  const storageKey = worldId ? `${STORAGE_KEY_PREFIX}:${worldId}` : null;

  const [order, setOrderState] = useState<string[]>(() => {
    if (!storageKey) return defaultOrder;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        // Merge: keep stored order for known IDs, append any new tools not yet in saved order
        const knownSet = new Set(parsed);
        const merged = [
          ...parsed.filter((id) => defaultOrder.includes(id)),
          ...defaultOrder.filter((id) => !knownSet.has(id)),
        ];
        return merged;
      }
    } catch {
      // ignore
    }
    return defaultOrder;
  });

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setOrderState((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });
    },
    [storageKey]
  );

  return { order, reorder };
}
