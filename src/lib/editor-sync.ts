// ---------------------------------------------------------------------------
// editor-sync, when may a content prop from outside replace what an editor
// is showing?
//
// The editors used to call setContent whenever the prop differed from the
// editor and the editor was not focused. A save invalidates the document
// query, the refetch can land holding an OLDER copy than the editor (the
// writer kept typing while the request was in flight), and on the next blur
// that older copy was put back on screen. Tiptap 3's setContent emits an
// update by default, so the stale text was then saved over the newer words.
//
// The rule: external content is applied only when it is genuinely new from
// outside (the prop changed), the editor is not already showing it, and the
// editor holds no local edits since it last matched the outside copy. Local
// edits always win until the outside copy catches up with them; the save
// path, not the refetch, is the source of truth for words typed here.
// ---------------------------------------------------------------------------

export interface ExternalContentInput {
  /** The content prop now. */
  incoming: string;
  /** The content prop the last time it was evaluated (null before the first). */
  lastIncoming: string | null;
  /** What the editor shows now (editor.getHTML()). */
  editorHtml: string;
  /** What the editor showed the last time it matched the outside copy. */
  syncedHtml: string | null;
  /** The writer is in the editor. */
  focused: boolean;
}

/**
 * - "apply":   replace the editor's content (always with emitUpdate: false)
 * - "in-sync": the editor already shows it; record it as the synced point
 * - "skip":    leave the editor alone (not new, or local edits pending)
 * - "defer":   new and safe, but the writer is in the editor; retry on blur
 */
export type ExternalContentDecision = "apply" | "in-sync" | "skip" | "defer";

export function decideExternalContent(i: ExternalContentInput): ExternalContentDecision {
  if (i.incoming === i.editorHtml) return "in-sync";
  if (i.lastIncoming !== null && i.incoming === i.lastIncoming) return "skip";
  // Words typed here that the outside copy has not caught up with yet.
  if (i.syncedHtml !== null && i.editorHtml !== i.syncedHtml) return "skip";
  if (i.focused) return "defer";
  return "apply";
}
