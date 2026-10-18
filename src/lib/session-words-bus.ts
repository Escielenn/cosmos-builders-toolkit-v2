// ---------------------------------------------------------------------------
// session-words-bus, every editor in the writing space reports the words it
// adds here, once, at the moment it writes them to the streak ledger.
//
// The daily total already comes back from writing_sessions; a per-SESSION
// target (reset when the writer chooses, not at midnight) needs the same
// deltas without another table. The main editor, Scrivenings sections and the
// split pane all report through this, so the session count covers every
// surface. Tiny pub/sub; no React.
// ---------------------------------------------------------------------------

type Listener = (delta: number) => void;

const listeners = new Set<Listener>();

/** Report words added (positive deltas only; deletions are not "writing"). */
export function reportWordsWritten(delta: number): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  for (const l of listeners) l(delta);
}

export function onWordsWritten(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
