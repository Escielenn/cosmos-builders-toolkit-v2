// ---------------------------------------------------------------------------
// save-journal, the device-side copy of words the server has not confirmed.
//
// Every change to a document is written here (localStorage, one entry per
// document) before it is sent, and the entry is cleared only when a save of
// exactly that text is confirmed. A failed save, a dropped connection or a
// closed tab therefore leaves the words on this device, and the next time
// the document opens they are offered back.
//
// Each entry carries `base`: the server's updated_at for the copy the edits
// were made on top of. If the server copy still has that updated_at, nothing
// has written it since, so the journal is strictly newer. If it moved
// (another device, another tab) the journal is compared by time and, when
// older, offered rather than applied. Neither version is ever discarded
// without the writer choosing to.
//
// Storage can be missing or throw (private mode, quota, blocked site data):
// every access is wrapped and failure only means "no journal".
// ---------------------------------------------------------------------------

export const JOURNAL_PREFIX = "sf-unsaved:";

export interface JournalEntry {
  v: 1;
  docId: string;
  html: string;
  /** Server updated_at of the copy these edits were made on (null unknown). */
  base: string | null;
  /** Client time of the last write, ms. */
  at: number;
}

/** The subset of Storage the journal uses (localStorage, or a test double). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function journalKey(docId: string): string {
  return `${JOURNAL_PREFIX}${docId}`;
}

/** window.localStorage, or null where it is unavailable or throws. */
export function deviceStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readJournal(storage: StorageLike | null, docId: string): JournalEntry | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(journalKey(docId));
    if (!raw) return null;
    const e = JSON.parse(raw) as Partial<JournalEntry> | null;
    if (
      !e ||
      typeof e !== "object" ||
      e.docId !== docId ||
      typeof e.html !== "string" ||
      typeof e.at !== "number"
    ) {
      return null;
    }
    return { v: 1, docId, html: e.html, base: typeof e.base === "string" ? e.base : null, at: e.at };
  } catch {
    return null;
  }
}

/** Record the newest unsaved text. Returns false when storage refused it. */
export function writeJournal(
  storage: StorageLike | null,
  docId: string,
  html: string,
  base: string | null,
  now: number = Date.now(),
): boolean {
  if (!storage) return false;
  const entry: JournalEntry = { v: 1, docId, html, base, at: now };
  try {
    storage.setItem(journalKey(docId), JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}

/**
 * A save of `savedHtml` was confirmed, and the server row now carries
 * `savedBase`. Remove the entry if it holds exactly that text; if it holds
 * newer words (typed while the save was in flight), keep them and move their
 * base forward, since they now sit on top of the copy just saved.
 */
export function settleJournal(
  storage: StorageLike | null,
  docId: string,
  savedHtml: string,
  savedBase: string | null,
): void {
  if (!storage) return;
  const e = readJournal(storage, docId);
  if (!e) return;
  try {
    if (e.html === savedHtml) {
      storage.removeItem(journalKey(docId));
    } else if (savedBase) {
      storage.setItem(journalKey(docId), JSON.stringify({ ...e, base: savedBase }));
    }
  } catch {
    /* storage unavailable: nothing to settle */
  }
}

/** Forget a document's journal (the writer chose, or the server already has it). */
export function dropJournal(storage: StorageLike | null, docId: string): void {
  if (!storage) return;
  try {
    storage.removeItem(journalKey(docId));
  } catch {
    /* storage unavailable */
  }
}

export interface ServerCopy {
  content: string | null;
  updated_at: string | null;
}

/**
 * - "none":    no journal
 * - "settled": the server already holds the journal's text; drop it
 * - "recover": the journal is newer than the server copy; restore it into
 *              the editor and say so (KEEP RECOVERED / DISCARD)
 * - "older":   the server copy changed after the journal was written; do not
 *              apply, but offer it (RESTORE / DISCARD)
 */
export type RecoveryDecision = "none" | "settled" | "recover" | "older";

export function decideRecovery(entry: JournalEntry | null, server: ServerCopy): RecoveryDecision {
  if (!entry) return "none";
  if (entry.html === (server.content ?? "")) return "settled";
  if (entry.base !== null && server.updated_at !== null && entry.base === server.updated_at) {
    return "recover";
  }
  const serverMs = server.updated_at ? Date.parse(server.updated_at) : NaN;
  if (Number.isNaN(serverMs) || entry.at > serverMs) return "recover";
  return "older";
}

// ---------------------------------------------------------------------------
// Retry schedule for a failed save while words are unsaved.
// ---------------------------------------------------------------------------

const RETRY_STEPS_MS = [2_000, 4_000, 8_000, 16_000, 30_000];

/** Delay before retry number `attempt` (1-based), capped at 30s. */
export function retryDelay(attempt: number): number {
  const i = Math.min(Math.max(attempt, 1), RETRY_STEPS_MS.length) - 1;
  return RETRY_STEPS_MS[i];
}

// ---------------------------------------------------------------------------
// The footer's save state, as one decision so it cannot contradict itself.
// ---------------------------------------------------------------------------

export type SaveState = "ready" | "saving" | "saved" | "retrying" | "offline";

export function deriveSaveState(s: {
  online: boolean;
  /** Words on this device the server has not confirmed (typed, queued or in flight). */
  dirty: boolean;
  saving: boolean;
  /** The last save attempt failed and nothing has succeeded since. */
  failed: boolean;
  savedOnce: boolean;
}): SaveState {
  if (!s.online && (s.dirty || s.failed)) return "offline";
  if (s.failed && s.dirty) return "retrying";
  if (s.saving || s.dirty) return "saving";
  if (!s.online) return "offline";
  return s.savedOnce ? "saved" : "ready";
}
