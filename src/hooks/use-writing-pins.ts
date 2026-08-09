// ---------------------------------------------------------------------------
// useWritingPins, localStorage-backed pinned items for the writing space.
//
// Allows writers to pin notes, entities, or text snippets to keep them
// visible while writing. Stored per-world in localStorage.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shared so the pin button and the panel can never disagree on the union. */
export type PinnedItemType = "note" | "entity" | "snippet" | "worksheet";

export interface PinnedItem {
  id: string;
  type: PinnedItemType;
  title: string;
  content: string;
  pinnedAt: string; // ISO
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "sf-writing-pins:";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(worldId: string): string {
  return `${STORAGE_PREFIX}${worldId}`;
}

function loadPins(worldId: string): PinnedItem[] {
  try {
    const raw = localStorage.getItem(storageKey(worldId));
    if (!raw) return [];
    return JSON.parse(raw) as PinnedItem[];
  } catch {
    return [];
  }
}

function savePins(worldId: string, pins: PinnedItem[]): void {
  try {
    localStorage.setItem(storageKey(worldId), JSON.stringify(pins));
  } catch {
    // localStorage full, silently fail
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWritingPins(worldId: string) {
  const [pins, setPins] = useState<PinnedItem[]>([]);

  // Load pins when worldId changes
  useEffect(() => {
    if (!worldId) {
      setPins([]);
      return;
    }
    setPins(loadPins(worldId));
  }, [worldId]);

  // Each hook instance keeps its own copy, so pinning from a tool page in one
  // tab left an open writing space showing stale pins until it remounted.
  useEffect(() => {
    if (!worldId) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(worldId)) setPins(loadPins(worldId));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [worldId]);

  const addPin = useCallback(
    (item: Omit<PinnedItem, "pinnedAt">) => {
      if (!worldId) return;
      setPins((prev) => {
        // Don't duplicate
        if (prev.some((p) => p.id === item.id && p.type === item.type)) {
          return prev;
        }
        const next: PinnedItem[] = [
          { ...item, pinnedAt: new Date().toISOString() },
          ...prev,
        ];
        savePins(worldId, next);
        return next;
      });
    },
    [worldId]
  );

  // Matches on (id, type) because addPin dedupes on the same pair — filtering
  // by id alone let a note and a worksheet sharing an id delete each other.
  const removePin = useCallback(
    (id: string, type?: PinnedItemType) => {
      if (!worldId) return;
      setPins((prev) => {
        const next = prev.filter((p) =>
          type ? !(p.id === id && p.type === type) : p.id !== id,
        );
        savePins(worldId, next);
        return next;
      });
    },
    [worldId]
  );

  return { pins, addPin, removePin };
}
