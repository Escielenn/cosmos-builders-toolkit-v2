// ---------------------------------------------------------------------------
// useDocAutosave, independent autosave for every secondary editor in the
// writing space (Scrivenings sections, the split pane).
//
// The same path as the main editor (Write.tsx flushPending): a 1.2s debounce
// per document, useUpdateDocumentContent for the write, positive word deltas
// to the streak ledger (rollWordSession) and the session counter. Each
// document has its own pending buffer, timer and word baseline, so typing in
// two sections can never send one section's text to the other's row.
//
// Never blocks a keystroke: queue() only stores the HTML and arms a timer.
// Unsaved text is flushed on unmount, when the tab is hidden and before it
// closes. Every queued text is also written to the device journal
// (lib/writing/save-journal.ts) and cleared only on a confirmed save; a
// failed save stays queued and retries on a backoff, and at once when the
// connection comes back.
//
// Saves carry the content_version the edits sit on. If another writer saved
// first, the save is held (no retry loop) and the document is listed in
// `conflicts` for the surface to offer KEEP MINE / LOAD THEIRS / COMPARE;
// both texts stay on file either way. If this account cannot write (viewer),
// `denied` is set and nothing is toasted: the words stay in the journal.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUpdateDocumentContent, type BinderDoc } from "@/hooks/use-writing-documents";
import { rollWordSession, type WriteDoc } from "@/hooks/use-write-doc";
import { dropUnsaved, noteUnsaved, patchDocContent } from "@/hooks/use-document-contents";
import { snapshotDocumentText } from "@/hooks/use-document-versions";
import { countWords } from "@/lib/text";
import { reportWordsWritten } from "@/lib/session-words-bus";
import { deviceStorage, dropJournal, retryDelay, settleJournal, writeJournal } from "@/lib/writing/save-journal";
import { isSaveConflict, isSaveDenied, patchRow, type ServerDocCopy } from "@/lib/writing/doc-scale";

const DEBOUNCE_MS = 1200;

/**
 * Put a document's newest HTML into the caches other surfaces open from, the
 * moment it is typed rather than after the save round-trip:
 *   - the unsaved overlay, laid over every content fetch;
 *   - the world's content queries (search, canon badges, capture), if loaded;
 *   - the binder list's word count for the document;
 *   - optionally the single-document query (["write-doc", id]) the main
 *     editor and the split pane open from. The main editor never primes its
 *     OWN document here: its content prop would then chase the caret.
 * Without this, switching surfaces inside the debounce window would open an
 * older copy, and the next save from that surface would drop the difference.
 */
export function primeDocCaches(
  qc: QueryClient,
  worldId: string | undefined,
  docId: string,
  html: string,
  includeWriteDoc: boolean,
): void {
  noteUnsaved(docId, html);
  if (worldId) {
    const words = countWords(html);
    qc.setQueryData<BinderDoc[]>(["writing-documents", worldId], (list) =>
      patchRow(list, docId, { word_count: words }),
    );
    patchDocContent(qc, worldId, docId, { content: html });
  }
  if (includeWriteDoc) {
    qc.setQueryData<WriteDoc | null>(["write-doc", docId], (old) => (old ? { ...old, content: html } : old));
  }
}

interface Pending {
  html: string;
  words: number;
}

/** A held save: the server copy moved on under these words. */
export interface DocConflict {
  docId: string;
  mine: string;
  theirs: ServerDocCopy;
}

export function useDocAutosave(worldId: string | undefined, onWordsLedgered?: () => void) {
  const { user } = useAuth();
  const qc = useQueryClient();
  // Failures are reported once per failure run (below), not once per retry.
  const updateContent = useUpdateDocumentContent(worldId, { silentErrors: true });
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const pending = useRef(new Map<string, Pending>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const baseline = useRef(new Map<string, number>());
  /** Newest HTML seen per document (opening text, then every queue). */
  const latest = useRef(new Map<string, string>());
  /** Server updated_at each document's edits sit on (device journal base). */
  const serverBase = useRef(new Map<string, string | null>());
  /** content_version each document's edits sit on (concurrency check). */
  const version = useRef(new Map<string, number | null>());
  /** Consecutive failed saves per document (retry backoff). */
  const failures = useRef(new Map<string, number>());
  const inFlight = useRef(0);
  const mounted = useRef(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [conflicts, setConflicts] = useState<ReadonlyMap<string, DocConflict>>(new Map());
  const conflictsRef = useRef(conflicts);
  conflictsRef.current = conflicts;
  const [denied, setDenied] = useState(false);
  const deniedRef = useRef(false);
  /** Documents whose editor must reopen on a new text (LOAD THEIRS). */
  const [reloaded, setReloaded] = useState<Readonly<Record<string, { html: string; rev: number }>>>({});

  // Refs so the unmount flush sees the latest closures.
  const mutateRef = useRef(updateContent.mutateAsync);
  mutateRef.current = updateContent.mutateAsync;
  const userRef = useRef(user);
  userRef.current = user;
  const ledgerRef = useRef(onWordsLedgered);
  ledgerRef.current = onWordsLedgered;

  /**
   * Record the word count a document opened with (not counted as writing),
   * the server updated_at of that copy (the device journal's base) and its
   * content_version (the save's concurrency base).
   */
  const register = useCallback(
    (
      docId: string,
      html: string | null | undefined,
      updatedAt?: string | null,
      contentVersion?: number | null,
    ) => {
      if (!baseline.current.has(docId)) baseline.current.set(docId, countWords(html ?? ""));
      if (!latest.current.has(docId)) latest.current.set(docId, html ?? "");
      if (!serverBase.current.has(docId)) serverBase.current.set(docId, updatedAt ?? null);
      if (!version.current.has(docId)) version.current.set(docId, contentVersion ?? null);
    },
    [],
  );

  const flushDoc = useCallback((docId: string): Promise<void> => {
    const t = timers.current.get(docId);
    if (t) {
      clearTimeout(t);
      timers.current.delete(docId);
    }
    // Held: a conflict waits for the writer's choice; a viewer cannot save.
    if (conflictsRef.current.has(docId) || deniedRef.current) return Promise.resolve();
    const p = pending.current.get(docId);
    if (!p) return Promise.resolve();
    pending.current.delete(docId);

    const base = baseline.current.get(docId);
    const delta = base === undefined ? 0 : p.words - base;
    baseline.current.set(docId, p.words);

    inFlight.current += 1;
    setSaving(true);
    return mutateRef
      .current({ docId, content: p.html, baseVersion: version.current.get(docId) ?? null })
      .then((row) => {
        setSavedAt(new Date());
        failures.current.delete(docId);
        // Confirmed: the device copy of exactly this text can go.
        serverBase.current.set(docId, row?.updated_at ?? null);
        if (row && row.content_version !== null) version.current.set(docId, row.content_version);
        settleJournal(deviceStorage(), docId, p.html, row?.updated_at ?? null);
        const u = userRef.current;
        if (u && delta > 0) {
          reportWordsWritten(delta);
          void rollWordSession(u.id, delta).then(() => ledgerRef.current?.());
        }
      })
      .catch((err: unknown) => {
        // Never dropped: the newest text goes back in the queue (it is also
        // in the device journal).
        if (!pending.current.has(docId)) pending.current.set(docId, p);
        if (base !== undefined) baseline.current.set(docId, base);
        if (isSaveConflict(err)) {
          const next = new Map(conflictsRef.current);
          next.set(docId, { docId, mine: latest.current.get(docId) ?? p.html, theirs: err.theirs });
          conflictsRef.current = next;
          setConflicts(next);
          return;
        }
        if (isSaveDenied(err)) {
          deniedRef.current = true;
          setDenied(true);
          return;
        }
        const attempt = (failures.current.get(docId) ?? 0) + 1;
        failures.current.set(docId, attempt);
        if (attempt === 1) {
          toastRef.current({
            title: "SAVE FAILED.",
            description: "Your words are held on this device. Retrying.",
            variant: "destructive",
          });
        }
        if (mounted.current && !timers.current.has(docId)) {
          timers.current.set(
            docId,
            setTimeout(() => {
              timers.current.delete(docId);
              if (typeof navigator !== "undefined" && navigator.onLine === false) return; // "online" retries
              void flushDocRef.current(docId);
            }, retryDelay(attempt)),
          );
        }
      })
      .finally(() => {
        inFlight.current -= 1;
        if (inFlight.current === 0) setSaving(false);
      });
  }, []);
  const flushDocRef = useRef(flushDoc);
  flushDocRef.current = flushDoc;

  const flushAll = useCallback(
    (): Promise<void> => Promise.all([...pending.current.keys()].map((id) => flushDoc(id))).then(() => undefined),
    [flushDoc],
  );

  /** Queue a document's latest HTML. Cheap; safe on every keystroke. */
  const queue = useCallback(
    (docId: string, html: string) => {
      // A blur with nothing new (the editor reports on every blur) is not a save.
      if (latest.current.get(docId) === html) return;
      latest.current.set(docId, html);
      pending.current.set(docId, { html, words: countWords(html) });
      // On this device before it is sent; cleared when the save is confirmed.
      writeJournal(deviceStorage(), docId, html, serverBase.current.get(docId) ?? null);
      // Any editor that mounts this document next (the main editor, after
      // leaving Scrivenings) must open on these words, not a stale fetch.
      primeDocCaches(qc, worldId, docId, html, true);
      // A held conflict shows the newest words as "mine".
      const held = conflictsRef.current.get(docId);
      if (held) {
        const next = new Map(conflictsRef.current);
        next.set(docId, { ...held, mine: html });
        conflictsRef.current = next;
        setConflicts(next);
        return;
      }
      // An editor unmounting after this hook's owner (React tears parents
      // down first) still hands over its last words: save them now.
      if (!mounted.current) {
        void flushDoc(docId);
        return;
      }
      const t = timers.current.get(docId);
      if (t) clearTimeout(t);
      timers.current.set(
        docId,
        setTimeout(() => void flushDoc(docId), DEBOUNCE_MS),
      );
    },
    [flushDoc, qc, worldId],
  );

  const clearConflict = (docId: string) => {
    const next = new Map(conflictsRef.current);
    next.delete(docId);
    conflictsRef.current = next;
    setConflicts(next);
  };

  /**
   * KEEP MINE: their version goes on file as a snapshot, then mine is saved
   * on top of it. Resolves false (and changes nothing) if their copy could
   * not be filed first.
   */
  const keepMine = useCallback(
    async (docId: string): Promise<boolean> => {
      const c = conflictsRef.current.get(docId);
      const u = userRef.current;
      if (!c || !u) return false;
      const filed = await snapshotDocumentText(docId, u.id, c.theirs.content ?? "", "Their version, before KEEP MINE");
      if (!filed) return false;
      version.current.set(docId, c.theirs.content_version);
      serverBase.current.set(docId, c.theirs.updated_at);
      const html = latest.current.get(docId) ?? c.mine;
      pending.current.set(docId, { html, words: countWords(html) });
      // Their words are not this writer's: the ledger counts from theirs.
      baseline.current.set(docId, countWords(c.theirs.content ?? ""));
      clearConflict(docId);
      await flushDoc(docId);
      return true;
    },
    [flushDoc],
  );

  /**
   * LOAD THEIRS: my version goes on file as a snapshot, then the editor
   * reopens on theirs. Resolves false (and changes nothing) if mine could
   * not be filed first.
   */
  const loadTheirs = useCallback(
    async (docId: string): Promise<boolean> => {
      const c = conflictsRef.current.get(docId);
      const u = userRef.current;
      if (!c || !u) return false;
      const mine = latest.current.get(docId) ?? c.mine;
      const filed = await snapshotDocumentText(docId, u.id, mine, "My version, before LOAD THEIRS");
      if (!filed) return false;
      const theirs = c.theirs.content ?? "";
      pending.current.delete(docId);
      latest.current.set(docId, theirs);
      baseline.current.set(docId, countWords(theirs));
      version.current.set(docId, c.theirs.content_version);
      serverBase.current.set(docId, c.theirs.updated_at);
      dropJournal(deviceStorage(), docId);
      dropUnsaved(docId);
      if (worldId) {
        patchDocContent(qc, worldId, docId, {
          content: theirs,
          updated_at: c.theirs.updated_at,
          content_version: c.theirs.content_version,
        });
        qc.setQueryData<BinderDoc[]>(["writing-documents", worldId], (list) =>
          patchRow(list, docId, { word_count: countWords(theirs) }),
        );
      }
      qc.setQueryData<WriteDoc | null>(["write-doc", docId], (old) =>
        old ? { ...old, content: theirs, updated_at: c.theirs.updated_at ?? old.updated_at, content_version: c.theirs.content_version } : old,
      );
      setReloaded((prev) => ({ ...prev, [docId]: { html: theirs, rev: (prev[docId]?.rev ?? 0) + 1 } }));
      clearConflict(docId);
      return true;
    },
    [qc, worldId],
  );

  const hasPending = useCallback(() => pending.current.size > 0, []);
  /** The newest words this hook holds for a document (for remounting). */
  const latestHtml = useCallback((docId: string) => latest.current.get(docId), []);

  useEffect(() => {
    mounted.current = true;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size === 0) return;
      void flushAll();
      e.preventDefault();
    };
    // A hidden tab may never come back (mobile, tab discard): send now.
    const onHide = () => {
      if (document.visibilityState === "hidden") void flushAll();
    };
    const onPageHide = () => void flushAll();
    const onOnline = () => void flushAll();
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHide);
      mounted.current = false;
      void flushAll();
    };
  }, [flushAll]);

  return {
    register,
    queue,
    flushDoc,
    flushAll,
    hasPending,
    latestHtml,
    saving,
    savedAt,
    conflicts,
    keepMine,
    loadTheirs,
    reloaded,
    denied,
  };
}
