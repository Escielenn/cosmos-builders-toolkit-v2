// ---------------------------------------------------------------------------
// useDocumentVersions, version history for writing-space documents.
//
// Primary storage: Supabase `document_versions` table (20-row cap per doc
// enforced by a server-side trigger).
//
// Fallback: localStorage, used when the Supabase table doesn't exist yet
// (pre-migration deploys) OR when an unauthenticated offline request fails.
// Keeps the same public API as the original localStorage-only hook so no
// caller changes are needed.
//
// Opportunistic migration: on first successful fetch, any snapshots found
// in localStorage for this document get uploaded as 'migrate' rows, then
// the localStorage bucket is cleared.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

type SnapshotReason = "manual" | "auto" | "rename" | "restore" | "migrate";

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

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Shared counter — the local copy here did not decode &nbsp;, so snapshot word
// counts drifted from the ones shown in the editor.
import { countWords } from "@/lib/text";

function loadLocalSnapshots(documentId: string): DocumentSnapshot[] {
  try {
    const raw = localStorage.getItem(storageKey(documentId));
    if (!raw) return [];
    return JSON.parse(raw) as DocumentSnapshot[];
  } catch {
    return [];
  }
}

function saveLocalSnapshots(
  documentId: string,
  snapshots: DocumentSnapshot[]
): void {
  try {
    localStorage.setItem(storageKey(documentId), JSON.stringify(snapshots));
  } catch {
    // localStorage full, evict oldest half and retry
    const trimmed = snapshots.slice(Math.floor(snapshots.length / 2));
    try {
      localStorage.setItem(storageKey(documentId), JSON.stringify(trimmed));
    } catch {
      // Give up silently
    }
  }
}

function clearLocalSnapshots(documentId: string): void {
  try {
    localStorage.removeItem(storageKey(documentId));
  } catch {
    // ignore
  }
}

type DbVersionRow = {
  id: string;
  document_id: string;
  title: string;
  content_html: string;
  word_count: number;
  created_at: string;
};

function rowToSnapshot(row: DbVersionRow): DocumentSnapshot {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    content: row.content_html,
    wordCount: row.word_count,
    timestamp: row.created_at,
  };
}

/**
 * Returns true if this error indicates the document_versions table doesn't
 * exist yet (pre-migration). Supabase/PostgREST returns PGRST205 or code 42P01.
 */
function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  if (typeof e.message === "string" && /document_versions/i.test(e.message) && /does not exist/i.test(e.message)) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDocumentVersions(
  documentId: string | null,
  currentTitle: string,
  currentContent: string
) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);

  // Refs so the interval callback always sees fresh values
  const contentRef = useRef(currentContent);
  contentRef.current = currentContent;
  const titleRef = useRef(currentTitle);
  titleRef.current = currentTitle;
  const lastAutoSnapshotContentRef = useRef<string>("");
  const fallbackRef = useRef(false);
  fallbackRef.current = usingFallback;

  // --------------------------------------------------
  // Load snapshots when documentId changes
  // Tries Supabase first; falls back to localStorage if the table is missing.
  // On successful DB fetch, opportunistically migrates any localStorage rows.
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    if (!documentId || !user) {
      setSnapshots([]);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("id, document_id, title, content_html, word_count, created_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(MAX_SNAPSHOTS);

      if (cancelled) return;

      if (error) {
        if (isMissingTableError(error)) {
          // Pre-migration: use localStorage
          const local = loadLocalSnapshots(documentId);
          setSnapshots(local);
          setUsingFallback(true);
          lastAutoSnapshotContentRef.current = currentContent;
          return;
        }
        // Other errors: show empty but don't crash
        console.warn("[document-versions] fetch failed", error);
        setSnapshots([]);
        lastAutoSnapshotContentRef.current = currentContent;
        return;
      }

      const dbSnapshots = (data ?? []).map(rowToSnapshot);
      setUsingFallback(false);

      // Opportunistic migration: upload localStorage snapshots to DB.
      const local = loadLocalSnapshots(documentId);
      if (local.length > 0 && !cancelled) {
        const existingTimestamps = new Set(
          dbSnapshots.map((s) => s.timestamp)
        );
        const toUpload = local.filter(
          (s) => !existingTimestamps.has(s.timestamp)
        );
        if (toUpload.length > 0) {
          // Best-effort; ignore failures
          void (async () => {
            const rows = toUpload.map((s) => ({
              document_id: documentId,
              world_id: null as string | null, // filled in below
              user_id: user.id,
              title: s.title,
              content_html: s.content,
              word_count: s.wordCount,
              snapshot_reason: "migrate" as SnapshotReason,
              created_at: s.timestamp,
            }));
            // Look up world_id for the parent document
            const { data: doc } = await supabase
              .from("world_entries")
              .select("world_id")
              .eq("id", documentId)
              .maybeSingle();
            if (doc?.world_id) {
              for (const r of rows) r.world_id = doc.world_id;
              await supabase.from("document_versions").insert(rows);
              // Refetch so UI reflects migrated rows
              const { data: refetched } = await supabase
                .from("document_versions")
                .select("id, document_id, title, content_html, word_count, created_at")
                .eq("document_id", documentId)
                .order("created_at", { ascending: false })
                .limit(MAX_SNAPSHOTS);
              if (!cancelled && refetched) {
                setSnapshots(refetched.map(rowToSnapshot));
              }
            }
          })();
        }
        // Clear localStorage either way, DB is now canonical
        clearLocalSnapshots(documentId);
      }

      setSnapshots(dbSnapshots);
      lastAutoSnapshotContentRef.current = currentContent;
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------
  // Create a snapshot
  // --------------------------------------------------

  const createSnapshotInternal = useCallback(
    async (
      content: string,
      title: string,
      reason: SnapshotReason
    ): Promise<DocumentSnapshot | null> => {
      if (!documentId || !user) return null;
      if (!content || content === "<p></p>") return null;

      const wordCount = countWords(content);

      // Skip duplicates against the most recent snapshot (cheap client-side check)
      const mostRecent = snapshots[0];
      if (mostRecent && mostRecent.content === content) return null;

      // Fallback mode: localStorage only
      if (fallbackRef.current) {
        const snapshot: DocumentSnapshot = {
          id: generateLocalId(),
          documentId,
          title: title || "Untitled",
          content,
          wordCount,
          timestamp: new Date().toISOString(),
        };
        setSnapshots((prev) => {
          const next = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS);
          saveLocalSnapshots(documentId, next);
          return next;
        });
        lastAutoSnapshotContentRef.current = content;
        return snapshot;
      }

      // DB mode
      // Look up world_id once; cached on the document
      const { data: doc, error: docErr } = await supabase
        .from("world_entries")
        .select("world_id")
        .eq("id", documentId)
        .maybeSingle();
      if (docErr || !doc?.world_id) {
        console.warn("[document-versions] could not resolve world_id", docErr);
        return null;
      }

      const { data: inserted, error } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          world_id: doc.world_id,
          user_id: user.id,
          title: title || "Untitled",
          content_html: content,
          word_count: wordCount,
          snapshot_reason: reason,
        })
        .select("id, document_id, title, content_html, word_count, created_at")
        .maybeSingle();

      if (error || !inserted) {
        console.warn("[document-versions] insert failed", error);
        return null;
      }

      const snapshot = rowToSnapshot(inserted);
      setSnapshots((prev) => [snapshot, ...prev].slice(0, MAX_SNAPSHOTS));
      lastAutoSnapshotContentRef.current = content;
      return snapshot;
    },
    [documentId, user, snapshots]
  );

  const createSnapshot = useCallback(
    async (): Promise<DocumentSnapshot | null> => {
      return createSnapshotInternal(
        contentRef.current,
        titleRef.current,
        "manual"
      );
    },
    [createSnapshotInternal]
  );

  // --------------------------------------------------
  // Auto-snapshot interval (every 5 minutes of editing)
  // --------------------------------------------------

  useEffect(() => {
    if (!documentId) return;

    const interval = setInterval(() => {
      const content = contentRef.current;
      if (content && content !== lastAutoSnapshotContentRef.current) {
        void createSnapshotInternal(content, titleRef.current, "auto");
      }
    }, AUTO_SNAPSHOT_INTERVAL);

    return () => clearInterval(interval);
  }, [documentId, createSnapshotInternal]);

  // --------------------------------------------------
  // Restore a version
  // --------------------------------------------------

  const restoreVersion = useCallback(
    async (snapshotId: string): Promise<DocumentSnapshot | null> => {
      const found = snapshots.find((s) => s.id === snapshotId);
      if (!found) return null;

      // Snapshot current content first so the restore is undoable
      await createSnapshotInternal(
        contentRef.current,
        titleRef.current,
        "restore"
      );

      return found;
    },
    [snapshots, createSnapshotInternal]
  );

  // --------------------------------------------------
  // Delete a single snapshot
  // --------------------------------------------------

  const deleteSnapshot = useCallback(
    async (snapshotId: string) => {
      if (!documentId) return;

      if (fallbackRef.current) {
        setSnapshots((prev) => {
          const next = prev.filter((s) => s.id !== snapshotId);
          saveLocalSnapshots(documentId, next);
          return next;
        });
        return;
      }

      const { error } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", snapshotId);
      if (error) {
        console.warn("[document-versions] delete failed", error);
        return;
      }
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    },
    [documentId]
  );

  // --------------------------------------------------
  // Clear all snapshots for this document
  // --------------------------------------------------

  const clearSnapshots = useCallback(async () => {
    if (!documentId) return;

    if (fallbackRef.current) {
      setSnapshots([]);
      clearLocalSnapshots(documentId);
      return;
    }

    const { error } = await supabase
      .from("document_versions")
      .delete()
      .eq("document_id", documentId);
    if (error) {
      console.warn("[document-versions] clear failed", error);
      return;
    }
    setSnapshots([]);
  }, [documentId]);

  return {
    snapshots,
    createSnapshot,
    restoreVersion,
    deleteSnapshot,
    clearSnapshots,
    /** True when operating from localStorage (table missing or unauthenticated). */
    usingFallback,
  };
}
