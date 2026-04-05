// ---------------------------------------------------------------------------
// useWritingPins — localStorage-backed pinned items for the writing space.
//
// Allows writers to pin notes, entities, or text snippets to keep them
// visible while writing. Stored per-world in localStorage.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PinnedItem {
  id: string;
  type: "note" | "entity" | "snippet";
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
    // localStorage full — silently fail
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

  const removePin = useCallback(
    (id: string) => {
      if (!worldId) return;
      setPins((prev) => {
        const next = prev.filter((p) => p.id !== id);
        savePins(worldId, next);
        return next;
      });
    },
    [worldId]
  );

  return { pins, addPin, removePin };
}
