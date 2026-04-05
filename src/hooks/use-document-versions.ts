// ---------------------------------------------------------------------------
// useDocumentVersions — localStorage-backed version history for writing docs.
//
// Stores snapshots as a ring buffer (max 20 per document) in localStorage.
// Snapshots are created:
//   1. On manual save (Ctrl+S or save button)
//   2. Auto-snapshot every 5 minutes while editing
//
// No DB migration required — purely client-side.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentSnapshot {
  id: string;
  documentId: string;
  title: string;
  content: string;
  wordCount: number;
  timestamp: string; // ISO
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "sf-doc-versions:";
const MAX_SNAPSHOTS = 20;
const AUTO_SNAPSHOT_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(documentId: string): string {
  return `${STORAGE_PREFIX}${documentId}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function countWords(html: string): number {
  // Strip HTML tags, then count whitespace-separated tokens
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

function loadSnapshots(documentId: string): DocumentSnapshot[] {
  try {
    const raw = localStorage.getItem(storageKey(documentId));
    if (!raw) return [];
    return JSON.parse(raw) as DocumentSnapshot[];
  } catch {
    return [];
  }
}

function saveSnapshots(
  documentId: string,
  snapshots: DocumentSnapshot[]
): void {
  try {
    localStorage.setItem(storageKey(documentId), JSON.stringify(snapshots));
  } catch {
    // localStorage full — evict oldest half and retry
    const trimmed = snapshots.slice(Math.floor(snapshots.length / 2));
    try {
      localStorage.setItem(storageKey(documentId), JSON.stringify(trimmed));
    } catch {
      // Give up silently
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDocumentVersions(
  documentId: string | null,
  currentTitle: string,
  currentContent: string
) {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);

  // Refs so the interval callback always sees fresh values
  const contentRef = useRef(currentContent);
  contentRef.current = currentContent;
  const titleRef = useRef(currentTitle);
  titleRef.current = currentTitle;
  const lastAutoSnapshotContentRef = useRef<string>("");

  // Load snapshots when documentId changes
  useEffect(() => {
    if (!documentId) {
      setSnapshots([]);
      return;
    }
    const loaded = loadSnapshots(documentId);
    setSnapshots(loaded);
    lastAutoSnapshotContentRef.current = currentContent;
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------
  // Create a snapshot (ring buffer, most recent first)
  // --------------------------------------------------

  const createSnapshot = useCallback(
    (content?: string, title?: string): DocumentSnapshot | null => {
      if (!documentId) return null;

      const snapshotContent = content ?? contentRef.current;
      const snapshotTitle = title ?? titleRef.current;

      // Don't save empty snapshots
      if (!snapshotContent || snapshotContent === "<p></p>") return null;

      const snapshot: DocumentSnapshot = {
        id: generateId(),
        documentId,
        title: snapshotTitle || "Untitled",
        content: snapshotContent,
        wordCount: countWords(snapshotContent),
        timestamp: new Date().toISOString(),
      };

      setSnapshots((prev) => {
        // Skip if content is identical to the most recent snapshot
        if (prev.length > 0 && prev[0].content === snapshotContent) {
          return prev;
        }

        const next = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS);
        saveSnapshots(documentId, next);
        return next;
      });

      lastAutoSnapshotContentRef.current = snapshotContent;
      return snapshot;
    },
    [documentId]
  );

  // --------------------------------------------------
  // Manual save — call this from Ctrl+S / save button
  // --------------------------------------------------

  const saveManualSnapshot = useCallback(() => {
    return createSnapshot();
  }, [createSnapshot]);

  // --------------------------------------------------
  // Auto-snapshot interval (every 5 minutes of editing)
  // --------------------------------------------------

  useEffect(() => {
    if (!documentId) return;

    const interval = setInterval(() => {
      const content = contentRef.current;
      // Only snapshot if content has changed since last auto-snapshot
      if (content && content !== lastAutoSnapshotContentRef.current) {
        createSnapshot(content);
      }
    }, AUTO_SNAPSHOT_INTERVAL);

    return () => clearInterval(interval);
  }, [documentId, createSnapshot]);

  // --------------------------------------------------
  // Restore a version (returns content for caller to apply)
  // --------------------------------------------------

  const restoreVersion = useCallback(
    (snapshotId: string): DocumentSnapshot | null => {
      const found = snapshots.find((s) => s.id === snapshotId);
      if (!found) return null;

      // Save current content as a snapshot before restoring,
      // so the user can undo the restore
      createSnapshot();

      return found;
    },
    [snapshots, createSnapshot]
  );

  // --------------------------------------------------
  // Delete a single snapshot
  // --------------------------------------------------

  const deleteSnapshot = useCallback(
    (snapshotId: string) => {
      if (!documentId) return;
      setSnapshots((prev) => {
        const next = prev.filter((s) => s.id !== snapshotId);
        saveSnapshots(documentId, next);
        return next;
      });
    },
    [documentId]
  );

  // --------------------------------------------------
  // Clear all snapshots for this document
  // --------------------------------------------------

  const clearSnapshots = useCallback(() => {
    if (!documentId) return;
    setSnapshots([]);
    try {
      localStorage.removeItem(storageKey(documentId));
    } catch {
      // ignore
    }
  }, [documentId]);

  return {
    snapshots,
    createSnapshot: saveManualSnapshot,
    restoreVersion,
    deleteSnapshot,
    clearSnapshots,
  };
}
