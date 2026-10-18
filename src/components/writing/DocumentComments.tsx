// ---------------------------------------------------------------------------
// DocumentComments, the COMMENTS pane of the document inspector.
//
// Select words in the document, write a comment, file it: the words get a
// faint amber anchor (CommentMark) and the comment lists here, in the order
// its words appear. Click one to land on its words. Resolve hides the
// anchor's highlight; delete removes the comment and its anchor. The words
// themselves are never changed, and compile/export never print a comment.
//
// Collaborators see who wrote each comment (the server stamps the name).
// Register: WRITER for the comment text, INSTRUMENT for the readouts.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Check, MessageSquarePlus, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { COMMENT_BODY_MAX, useDocumentComments, type DocumentComment } from "@/hooks/use-document-comments";
import { findCommentRanges } from "@/components/editor/CommentMark";
import { commentsSummary, orderComments } from "@/lib/writing/comments";

interface DocumentCommentsProps {
  docId: string;
  worldId: string;
  /** The live editor showing this document, or null (another view is open). */
  editor: Editor | null;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // RFC 4122 v4 shape from Math.random, for very old browsers only.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DocumentComments({ docId, worldId, editor }: DocumentCommentsProps): JSX.Element {
  const { user } = useAuth();
  const { comments, unavailable, isLoading, add, setResolved, remove } = useDocumentComments(docId, worldId);
  const live = editor && !editor.isDestroyed ? editor : null;

  // Re-read the editor's selection and anchors as the writer works.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const bump = () => setTick((t) => t + 1);
    live.on("selectionUpdate", bump);
    live.on("update", bump);
    return () => {
      live.off("selectionUpdate", bump);
      live.off("update", bump);
    };
  }, [live]);

  const [draft, setDraft] = useState<{ from: number; to: number; quote: string } | null>(null);
  const [body, setBody] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const selection = useMemo(() => {
    if (!live) return null;
    const { from, to, empty } = live.state.selection;
    if (empty) return null;
    const quote = live.state.doc.textBetween(from, to, " ", " ").trim();
    return quote ? { from, to, quote } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, tick]);

  const ordered = useMemo(() => {
    const anchors = new Map<string, number | null>();
    if (live) {
      for (const c of comments) {
        const r = findCommentRanges(live.state.doc, c.id);
        anchors.set(c.id, r.length ? r[0].from : null);
      }
    }
    return orderComments(comments, (id) => (live ? anchors.get(id) ?? null : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, live, tick]);
  const visible = ordered.filter((p) => showResolved || !p.comment.resolvedAt);
  const resolvedCount = comments.filter((c) => c.resolvedAt).length;

  const file = async () => {
    if (!draft || !live || !body.trim()) return;
    const id = newId();
    try {
      await add.mutateAsync({ id, body, quote: draft.quote });
    } catch {
      return; // the hook has toasted
    }
    // Anchor on the words chosen, if they are still those words.
    const doc = live.state.doc;
    const to = Math.min(draft.to, doc.content.size);
    if (doc.textBetween(draft.from, to, " ", " ").trim() === draft.quote) {
      live.chain().setTextSelection({ from: draft.from, to }).setComment(id).run();
    }
    setDraft(null);
    setBody("");
  };

  const goTo = (c: DocumentComment) => {
    if (!live) return;
    const r = findCommentRanges(live.state.doc, c.id);
    if (!r.length) return;
    live.chain().focus().setTextSelection({ from: r[0].from, to: r[r.length - 1].to }).scrollIntoView().run();
  };

  const resolve = (c: DocumentComment, resolved: boolean) => {
    setResolved.mutate(
      { id: c.id, resolved },
      { onSuccess: () => live?.commands.setCommentResolved(c.id, resolved) },
    );
  };

  const del = (c: DocumentComment) => {
    if (!window.confirm("Delete this comment? The words it is on are not changed.")) return;
    remove.mutate({ id: c.id }, { onSuccess: () => live?.commands.unsetComment(c.id) });
  };

  if (unavailable) {
    return (
      <p className="px-4 py-4 font-mono text-[12px] text-sf-amber-text" role="status">
        {"// COMMENTS NOT ON FILE YET. STORAGE PENDING."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[12px] text-t3" role="status" aria-live="polite">
          {isLoading ? "READING COMMENTS." : commentsSummary(comments)}
        </p>
        {resolvedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            aria-pressed={showResolved}
            className="min-h-hit px-1 font-sans text-[12px] font-medium uppercase text-t3 transition-colors duration-fast hover:text-sf-primary-text"
          >
            {showResolved ? "Hide resolved" : "Show resolved"}
          </button>
        )}
      </div>

      {/* Compose */}
      {draft ? (
        <div className="flex flex-col gap-2 border border-sf-line bg-sf-surface p-3">
          <p className="line-clamp-2 border-l-2 border-sf-amber pl-2 font-serif text-[14px] italic text-t2">{draft.quote}</p>
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, COMMENT_BODY_MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void file();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraft(null);
              }
            }}
            rows={3}
            aria-label="Comment"
            placeholder="What should change here?"
            className="sf-field sf-sb min-h-[88px] w-full resize-y px-2 py-1.5 font-sans text-[16px] text-t1 placeholder:text-t3"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="min-h-hit border border-sf-line px-3 font-sans text-[13px] font-medium text-t2 transition-colors duration-fast hover:border-sf-line-emphasis hover:text-t1"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!body.trim() || add.isPending}
              onClick={() => void file()}
              className="min-h-hit border border-sf-primary bg-sf-primary px-3 font-sans text-[13px] font-medium text-sf-on-primary transition-colors duration-fast disabled:border-sf-disabled-line disabled:bg-sf-disabled-bg disabled:text-sf-disabled-text"
            >
              {add.isPending ? "Filing" : "Comment"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!selection}
          onClick={() => selection && setDraft(selection)}
          className="flex min-h-hit items-center justify-center gap-2 border border-sf-line px-3 font-sans text-[13px] font-medium text-t2 transition-colors duration-fast hover:border-sf-primary hover:text-t1 disabled:border-sf-disabled-line disabled:text-sf-disabled-text disabled:hover:border-sf-disabled-line"
          title={selection ? "Comment on the selected words" : "Select words in the document first"}
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
          {live ? (selection ? "Comment on selection" : "Select words to comment") : "Open the editor to comment"}
        </button>
      )}

      {/* List */}
      <ul className="flex flex-col gap-2">
        {visible.map(({ comment: c, at }) => {
          const mine = c.userId === user?.id;
          const author = mine ? "You" : c.authorName || "Collaborator";
          return (
            <li
              key={c.id}
              className={`border bg-sf-surface ${c.resolvedAt ? "border-sf-line-hairline" : "border-sf-line"}`}
            >
              <button
                type="button"
                onClick={() => goTo(c)}
                disabled={at === null}
                className="flex w-full flex-col gap-1 px-3 pt-2 text-left transition-colors duration-fast hover:bg-sf-surface-elevated disabled:cursor-default disabled:hover:bg-transparent"
                title={at === null ? undefined : "Go to the words this comment is on"}
              >
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate font-sans text-[12px] font-medium uppercase text-t3">{author}</span>
                  <span className="shrink-0 font-mono text-[12px] text-t4">{when(c.createdAt)}</span>
                </span>
                {c.quote && (
                  <span className="line-clamp-1 border-l-2 border-sf-amber pl-2 font-serif text-[13px] italic text-t3">{c.quote}</span>
                )}
                {at === null && live && (
                  <span className="font-mono text-[12px] text-sf-amber-text">{"// ANCHOR REMOVED. THE WORDS ARE GONE."}</span>
                )}
                <span className="whitespace-pre-wrap font-sans text-[14px] text-t1">{c.body}</span>
                {c.resolvedAt && <span className="font-mono text-[12px] text-t4">RESOLVED {when(c.resolvedAt)}</span>}
              </button>
              <span className="flex justify-end gap-1 px-1 pb-1">
                <button
                  type="button"
                  onClick={() => resolve(c, !c.resolvedAt)}
                  aria-label={c.resolvedAt ? "Reopen comment" : "Resolve comment"}
                  title={c.resolvedAt ? "Reopen" : "Resolve"}
                  className="flex min-h-hit min-w-[44px] items-center justify-center text-t3 transition-colors duration-fast hover:text-sf-primary-text"
                >
                  {c.resolvedAt ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => del(c)}
                  aria-label="Delete comment"
                  title="Delete"
                  className="flex min-h-hit min-w-[44px] items-center justify-center text-t3 transition-colors duration-fast hover:text-sf-crimson-text"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
