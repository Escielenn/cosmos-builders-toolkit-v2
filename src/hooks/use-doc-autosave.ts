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
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { WorldEntry } from "@/services/world-data";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUpdateDocumentContent } from "@/hooks/use-writing-documents";
import { rollWordSession, type WriteDoc } from "@/hooks/use-write-doc";
import { countWords } from "@/lib/text";
import { reportWordsWritten } from "@/lib/session-words-bus";
import { deviceStorage, retryDelay, settleJournal, writeJournal } from "@/lib/writing/save-journal";

const DEBOUNCE_MS = 1200;

/**
 * Put a document's newest HTML into the caches other surfaces open from, the
 * moment it is typed rather than after the save round-trip:
 *   - the binder list (["writing-documents", worldId]), which Scrivenings,
 *     the split pane, the Outliner and the Board read;
 *   - optionally the single-document query (["write-doc", id]) the main
 *     editor opens from. The main editor never primes its OWN document here:
 *     its content prop would then chase the caret.
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
  if (worldId) {
    qc.setQueryData<WorldEntry[]>(["writing-documents", worldId], (list) =>
      list ? list.map((e) => (e.id === docId ? { ...e, content: html } : e)) : list,
    );
  }
  if (includeWriteDoc) {
    qc.setQueryData<WriteDoc | null>(["write-doc", docId], (old) => (old ? { ...old, content: html } : old));
  }
}

interface Pending {
  html: string;
  words: number;
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
  /** Consecutive failed saves per document (retry backoff). */
  const failures = useRef(new Map<string, number>());
  const inFlight = useRef(0);
  const mounted = useRef(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Refs so the unmount flush sees the latest closures.
  const mutateRef = useRef(updateContent.mutateAsync);
  mutateRef.current = updateContent.mutateAsync;
  const userRef = useRef(user);
  userRef.current = user;
  const ledgerRef = useRef(onWordsLedgered);
  ledgerRef.current = onWordsLedgered;

  /**
   * Record the word count a document opened with (not counted as writing),
   * and the server updated_at of that copy (the device journal's base).
   */
  const register = useCallback(
    (docId: string, html: string | null | undefined, updatedAt?: string | null) => {
      if (!baseline.current.has(docId)) baseline.current.set(docId, countWords(html ?? ""));
      if (!latest.current.has(docId)) latest.current.set(docId, html ?? "");
      if (!serverBase.current.has(docId)) serverBase.current.set(docId, updatedAt ?? null);
    },
    [],
  );

  const flushDoc = useCallback((docId: string): Promise<void> => {
    const t = timers.current.get(docId);
    if (t) {
      clearTimeout(t);
      timers.current.delete(docId);
    }
    const p = pending.current.get(docId);
    if (!p) return Promise.resolve();
    pending.current.delete(docId);

    const base = baseline.current.get(docId);
    const delta = base === undefined ? 0 : p.words - base;
    baseline.current.set(docId, p.words);

    inFlight.current += 1;
    setSaving(true);
    return mutateRef
      .current({ docId, content: p.html })
      .then((row) => {
        setSavedAt(new Date());
        failures.current.delete(docId);
        // Confirmed: the device copy of exactly this text can go.
        serverBase.current.set(docId, row?.updated_at ?? null);
        settleJournal(deviceStorage(), docId, p.html, row?.updated_at ?? null);
        const u = userRef.current;
        if (u && delta > 0) {
          reportWordsWritten(delta);
          void rollWordSession(u.id, delta).then(() => ledgerRef.current?.());
        }
      })
      .catch(() => {
        // The mutation's onError told the writer. Keep the newest text queued
        // (it is also in the device journal) and try again on a backoff.
        if (!pending.current.has(docId)) pending.current.set(docId, p);
        if (base !== undefined) baseline.current.set(docId, base);
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

  const hasPending = useCallback(() => pending.current.size > 0, []);

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

  return { register, queue, flushDoc, flushAll, hasPending, saving, savedAt };
}
