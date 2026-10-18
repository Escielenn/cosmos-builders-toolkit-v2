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
// Unsaved text is flushed on unmount and before the tab closes; a failed save
// stays queued and retries on the next flush.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { WorldEntry } from "@/services/world-data";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateDocumentContent } from "@/hooks/use-writing-documents";
import { rollWordSession, type WriteDoc } from "@/hooks/use-write-doc";
import { countWords } from "@/lib/text";
import { reportWordsWritten } from "@/lib/session-words-bus";

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
  const updateContent = useUpdateDocumentContent(worldId);
  const pending = useRef(new Map<string, Pending>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const baseline = useRef(new Map<string, number>());
  /** Newest HTML seen per document (opening text, then every queue). */
  const latest = useRef(new Map<string, string>());
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

  /** Record the word count a document opened with (not counted as writing). */
  const register = useCallback((docId: string, html: string | null | undefined) => {
    if (!baseline.current.has(docId)) baseline.current.set(docId, countWords(html ?? ""));
    if (!latest.current.has(docId)) latest.current.set(docId, html ?? "");
  }, []);

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
      .then(() => {
        setSavedAt(new Date());
        const u = userRef.current;
        if (u && delta > 0) {
          reportWordsWritten(delta);
          void rollWordSession(u.id, delta).then(() => ledgerRef.current?.());
        }
      })
      .catch(() => {
        // The mutation's onError told the writer. Keep the newest text queued.
        if (!pending.current.has(docId)) pending.current.set(docId, p);
        if (base !== undefined) baseline.current.set(docId, base);
      })
      .finally(() => {
        inFlight.current -= 1;
        if (inFlight.current === 0) setSaving(false);
      });
  }, []);

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
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      mounted.current = false;
      void flushAll();
    };
  }, [flushAll]);

  return { register, queue, flushDoc, flushAll, hasPending, saving, savedAt };
}
