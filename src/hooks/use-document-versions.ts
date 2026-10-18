// ---------------------------------------------------------------------------
// useDocumentVersions, snapshots (version history) for manuscript documents.
//
// Primary storage: Supabase `document_versions` table (20 UNNAMED rows per doc;
// named snapshots are exempt since 20261018_writing_p2.sql; cap
// enforced by a server-side trigger, 20260415_add_document_versions.sql).
// 20261018_writing_p1.sql adds an optional `name` and the 'trash' reason;
// until it lands, inserts and reads fall back to the old column set.
//
// Fallback: localStorage, used when the table doesn't exist yet
// (pre-migration deploys). On first successful fetch, any snapshots found in
// localStorage for this document are uploaded as 'migrate' rows and the
// localStorage bucket is cleared.
//
// "Never lose words" (Studio Charter): restore always captures the current
// text first, and trashing a document captures it too (see
// captureDocumentSnapshot, called from useDeleteDocument).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Shared counter — the local copy here did not decode &nbsp;, so snapshot word
// counts drifted from the ones shown in the editor.
import { countWords } from "@/lib/text";
import { capSnapshots, MAX_UNNAMED_SNAPSHOTS, SNAPSHOT_FETCH_LIMIT } from "@/lib/snapshot-cap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SnapshotReason = "manual" | "auto" | "rename" | "restore" | "migrate" | "trash";

export interface DocumentSnapshot {
  id: string;
  documentId: string;
  /** Document title at capture time. */
  title: string;
  /** Writer-given name, or null for automatic snapshots. */
  name: string | null;
  reason: SnapshotReason;
  content: string;
  wordCount: number;
  timestamp: string; // ISO
}

export const SNAPSHOT_REASON_LABEL: Record<SnapshotReason, string> = {
  manual: "MANUAL",
  auto: "AUTO",
  rename: "RENAME",
  restore: "BEFORE RESTORE",
  migrate: "IMPORTED",
  trash: "BEFORE TRASH",
};

/** "Oct 17, 09:42" in the writer's locale. */
export function formatSnapshotTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "sf-doc-versions:";
/**
 * Unnamed snapshots kept per document (the server trigger's OFFSET 20).
 * Named snapshots are exempt from the cap: see src/lib/snapshot-cap.ts.
 */
export const MAX_SNAPSHOTS = MAX_UNNAMED_SNAPSHOTS;
const AUTO_SNAPSHOT_INTERVAL = 5 * 60 * 1000; // 5 minutes

const COLS_FULL = "id, document_id, title, name, snapshot_reason, content_html, word_count, created_at";
const COLS_LEGACY = "id, document_id, title, snapshot_reason, content_html, word_count, created_at";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(documentId: string): string {
  return `${STORAGE_PREFIX}${documentId}`;
}

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isReason(v: unknown): v is SnapshotReason {
  return typeof v === "string" && v in SNAPSHOT_REASON_LABEL;
}

function loadLocalSnapshots(documentId: string): DocumentSnapshot[] {
  try {
    const raw = localStorage.getItem(storageKey(documentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<DocumentSnapshot>[];
    return parsed.map((s) => ({
      id: String(s.id),
      documentId,
      title: s.title ?? "",
      name: s.name ?? null,
      reason: isReason(s.reason) ? s.reason : "manual",
      content: s.content ?? "",
      wordCount: s.wordCount ?? countWords(s.content),
      timestamp: s.timestamp ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function saveLocalSnapshots(documentId: string, snapshots: DocumentSnapshot[]): void {
  try {
    localStorage.setItem(storageKey(documentId), JSON.stringify(snapshots));
  } catch {
    // localStorage full, evict oldest half and retry
    const trimmed = snapshots.slice(0, Math.ceil(snapshots.length / 2));
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
  name?: string | null;
  snapshot_reason?: string | null;
  content_html: string;
  word_count: number;
  created_at: string;
};

function rowToSnapshot(row: DbVersionRow): DocumentSnapshot {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    name: row.name ?? null,
    reason: isReason(row.snapshot_reason) ? row.snapshot_reason : "manual",
    content: row.content_html,
    wordCount: row.word_count,
    timestamp: row.created_at,
  };
}

/**
 * True if the document_versions table doesn't exist yet (pre-migration).
 * Supabase/PostgREST returns PGRST205 or code 42P01.
 */
function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  return (
    typeof e.message === "string" &&
    /document_versions/i.test(e.message) &&
    /does not exist/i.test(e.message)
  );
}

/** True if a column the client sent/selected is unknown (migration pending). */
function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  return typeof e.message === "string" && /column .*name/i.test(e.message);
}

/** CHECK violation: the 'trash' reason before 20261018 widened the list. */
function isCheckViolation(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: string }).code === "23514";
}

// Learned once per session so we stop paying for a failing first attempt.
let nameColumn: boolean | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function selectVersions(documentId: string) {
  if (nameColumn !== false) {
    const res = await db
      .from("document_versions")
      .select(COLS_FULL)
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(SNAPSHOT_FETCH_LIMIT);
    if (!res.error) {
      nameColumn = true;
      return res as { data: DbVersionRow[] | null; error: unknown };
    }
    if (!isMissingColumnError(res.error)) return res as { data: DbVersionRow[] | null; error: unknown };
    nameColumn = false;
  }
  return (await db
    .from("document_versions")
    .select(COLS_LEGACY)
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(SNAPSHOT_FETCH_LIMIT)) as { data: DbVersionRow[] | null; error: unknown };
}

interface InsertRow {
  document_id: string;
  world_id: string;
  user_id: string;
  title: string;
  content_html: string;
  word_count: number;
  snapshot_reason: SnapshotReason;
  name?: string | null;
  created_at?: string;
}

/** Insert one version row, degrading to the pre-20261018 shape if needed. */
async function insertVersion(row: InsertRow): Promise<{ data: DbVersionRow | null; error: unknown }> {
  let attempt: InsertRow = { ...row };
  if (nameColumn === false) delete attempt.name;
  for (let tries = 0; tries < 3; tries++) {
    const res = await db
      .from("document_versions")
      .insert(attempt)
      .select(nameColumn === false ? COLS_LEGACY : COLS_FULL)
      .maybeSingle();
    if (!res.error) return res;
    if (isMissingColumnError(res.error) && "name" in attempt) {
      nameColumn = false;
      attempt = { ...attempt };
      delete attempt.name;
      continue;
    }
    if (isCheckViolation(res.error) && attempt.snapshot_reason !== "manual") {
      attempt = { ...attempt, snapshot_reason: "manual" };
      continue;
    }
    return res;
  }
  return { data: null, error: new Error("snapshot insert failed") };
}

/**
 * Capture the server's current copy of a document as a snapshot, outside any
 * React tree. Used before structural operations (trash). Best effort: never
 * throws, never blocks the operation it protects for longer than one insert.
 */
export async function captureDocumentSnapshot(
  documentId: string,
  userId: string,
  reason: SnapshotReason,
  name?: string,
): Promise<boolean> {
  try {
    const { data: doc } = await db
      .from("world_entries")
      .select("world_id, title, content")
      .eq("id", documentId)
      .maybeSingle();
    const content: string = doc?.content ?? "";
    if (!doc?.world_id || !content || content === "<p></p>") return false;
    const { error } = await insertVersion({
      document_id: documentId,
      world_id: doc.world_id,
      user_id: userId,
      title: doc.title || "Untitled",
      content_html: content,
      word_count: countWords(content),
      snapshot_reason: reason,
      name: name ?? null,
    });
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface CreateSnapshotOptions {
  /** Writer-given name. */
  name?: string;
  /** Live editor HTML; defaults to the content passed to the hook. */
  content?: string;
  title?: string;
}

export function useDocumentVersions(
  documentId: string | null,
  currentTitle: string,
  currentContent: string,
) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Refs so callbacks and the interval always see fresh values
  const contentRef = useRef(currentContent);
  contentRef.current = currentContent;
  const titleRef = useRef(currentTitle);
  titleRef.current = currentTitle;
  const snapshotsRef = useRef(snapshots);
  snapshotsRef.current = snapshots;
  const lastAutoSnapshotContentRef = useRef<string>("");
  const fallbackRef = useRef(false);
  fallbackRef.current = usingFallback;
  const worldIdRef = useRef<string | null>(null);

  // --------------------------------------------------
  // Load snapshots when documentId changes
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    worldIdRef.current = null;
    if (!documentId || !user) {
      setSnapshots([]);
      return;
    }
    setLoading(true);

    (async () => {
      const { data, error } = await selectVersions(documentId);
      if (cancelled) return;
      setLoading(false);

      if (error) {
        if (isMissingTableError(error)) {
          setSnapshots(capSnapshots(loadLocalSnapshots(documentId)));
          setUsingFallback(true);
          lastAutoSnapshotContentRef.current = contentRef.current;
          return;
        }
        console.warn("[document-versions] fetch failed", error);
        setSnapshots([]);
        lastAutoSnapshotContentRef.current = contentRef.current;
        return;
      }

      const dbSnapshots = capSnapshots((data ?? []).map(rowToSnapshot));
      setUsingFallback(false);

      // Opportunistic migration: upload localStorage snapshots to DB.
      const local = loadLocalSnapshots(documentId);
      if (local.length > 0) {
        const existing = new Set(dbSnapshots.map((s) => s.timestamp));
        const toUpload = local.filter((s) => !existing.has(s.timestamp));
        if (toUpload.length > 0) {
          void (async () => {
            const { data: doc } = await db
              .from("world_entries")
              .select("world_id")
              .eq("id", documentId)
              .maybeSingle();
            if (!doc?.world_id) return;
            for (const s of toUpload) {
              await insertVersion({
                document_id: documentId,
                world_id: doc.world_id,
                user_id: user.id,
                title: s.title,
                name: s.name,
                content_html: s.content,
                word_count: s.wordCount,
                snapshot_reason: "migrate",
                created_at: s.timestamp,
              });
            }
            const { data: refetched } = await selectVersions(documentId);
            if (!cancelled && refetched) setSnapshots(capSnapshots(refetched.map(rowToSnapshot)));
          })();
        }
        clearLocalSnapshots(documentId);
      }

      setSnapshots(dbSnapshots);
      lastAutoSnapshotContentRef.current = contentRef.current;
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId, user]);

  // --------------------------------------------------
  // Create a snapshot
  // --------------------------------------------------

  const createSnapshotInternal = useCallback(
    async (
      content: string,
      title: string,
      reason: SnapshotReason,
      name?: string,
    ): Promise<DocumentSnapshot | null> => {
      if (!documentId || !user) return null;
      if (!content || content === "<p></p>") return null;

      // Automatic captures skip an identical latest snapshot. A manual one is
      // the writer saying "remember this", so it is always kept.
      const mostRecent = snapshotsRef.current[0];
      if (reason !== "manual" && mostRecent && mostRecent.content === content) return null;

      const wordCount = countWords(content);
      const cleanName = name?.trim().slice(0, 80) || null;

      if (fallbackRef.current) {
        const snapshot: DocumentSnapshot = {
          id: generateLocalId(),
          documentId,
          title: title || "Untitled",
          name: cleanName,
          reason,
          content,
          wordCount,
          timestamp: new Date().toISOString(),
        };
        const next = capSnapshots([snapshot, ...snapshotsRef.current]);
        saveLocalSnapshots(documentId, next);
        snapshotsRef.current = next;
        setSnapshots(next);
        lastAutoSnapshotContentRef.current = content;
        return snapshot;
      }

      if (!worldIdRef.current) {
        const { data: doc, error: docErr } = await db
          .from("world_entries")
          .select("world_id")
          .eq("id", documentId)
          .maybeSingle();
        if (docErr || !doc?.world_id) {
          console.warn("[document-versions] could not resolve world_id", docErr);
          return null;
        }
        worldIdRef.current = doc.world_id;
      }

      const { data: inserted, error } = await insertVersion({
        document_id: documentId,
        world_id: worldIdRef.current!,
        user_id: user.id,
        title: title || "Untitled",
        content_html: content,
        word_count: wordCount,
        snapshot_reason: reason,
        name: cleanName,
      });
      if (error || !inserted) {
        console.warn("[document-versions] insert failed", error);
        return null;
      }

      // If the name column is still pending, keep the name visible this session.
      const snapshot = { ...rowToSnapshot(inserted), name: inserted.name ?? cleanName };
      const next = capSnapshots([snapshot, ...snapshotsRef.current]);
      snapshotsRef.current = next;
      setSnapshots(next);
      lastAutoSnapshotContentRef.current = content;
      return snapshot;
    },
    [documentId, user],
  );

  const createSnapshot = useCallback(
    async (opts: CreateSnapshotOptions = {}): Promise<DocumentSnapshot | null> =>
      createSnapshotInternal(
        opts.content ?? contentRef.current,
        opts.title ?? titleRef.current,
        "manual",
        opts.name,
      ),
    [createSnapshotInternal],
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

  /**
   * Capture the current text (reason 'restore'), then hand back the chosen
   * snapshot for the caller to load. Returns null, and restores nothing, if
   * the safety capture failed: never trade the writer's current words for an
   * older version without a copy on file.
   */
  const restoreVersion = useCallback(
    async (snapshotId: string, liveContent?: string): Promise<DocumentSnapshot | null> => {
      const found = snapshotsRef.current.find((s) => s.id === snapshotId);
      if (!found) return null;
      const current = liveContent ?? contentRef.current;
      const alreadyOnFile = snapshotsRef.current.some((s) => s.content === current);
      if (current && current !== "<p></p>" && !alreadyOnFile) {
        const safety = await createSnapshotInternal(current, titleRef.current, "restore");
        if (!safety) return null;
      }
      return found;
    },
    [createSnapshotInternal],
  );

  // --------------------------------------------------
  // Delete a single snapshot
  // --------------------------------------------------

  const deleteSnapshot = useCallback(
    async (snapshotId: string): Promise<boolean> => {
      if (!documentId) return false;
      if (fallbackRef.current) {
        const next = snapshotsRef.current.filter((s) => s.id !== snapshotId);
        saveLocalSnapshots(documentId, next);
        snapshotsRef.current = next;
        setSnapshots(next);
        return true;
      }
      const { error } = await db.from("document_versions").delete().eq("id", snapshotId);
      if (error) {
        console.warn("[document-versions] delete failed", error);
        return false;
      }
      const next = snapshotsRef.current.filter((s) => s.id !== snapshotId);
      snapshotsRef.current = next;
      setSnapshots(next);
      return true;
    },
    [documentId],
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
    const { error } = await db.from("document_versions").delete().eq("document_id", documentId);
    if (error) {
      console.warn("[document-versions] clear failed", error);
      return;
    }
    setSnapshots([]);
  }, [documentId]);

  return {
    snapshots,
    loading,
    createSnapshot,
    restoreVersion,
    deleteSnapshot,
    clearSnapshots,
    /** True when operating from localStorage (table missing). */
    usingFallback,
  };
}
