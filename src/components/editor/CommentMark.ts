// ---------------------------------------------------------------------------
// CommentMark, the anchor of an inline comment.
//
// A comment is a note ON the prose, never IN it: the text the writer wrote
// is untouched. The anchor is a mark (<span data-comment-id>) carrying only
// the comment's id and whether it is resolved; the comment itself (body,
// author, times) lives in document_comments (src/hooks/use-document-
// comments.ts). Being a mark, the anchor rides ProseMirror's own position
// mapping: type before it, inside it, delete around it, and it stays on the
// words it was put on. Delete every word it covers and it is gone; the rail
// then lists the comment as ANCHOR REMOVED.
//
// Compile and export strip it for free: every exporter reads text, and the
// span is an unknown inline element whose text is the prose (lib/manuscript/
// blocks.ts). Search, word counts and project replace see the same text.
//
// Registered in every StellarForgeEditor, as FactRef is, so a document with
// comments keeps them whichever surface opens it (an editor without the mark
// would drop the spans on its next save).
// ---------------------------------------------------------------------------

import { Mark, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";

export const COMMENT_MARK = "comment";

export interface CommentRange {
  from: number;
  to: number;
  text: string;
}

/** Every stretch of text a comment's anchor covers, merged where adjacent. */
export function findCommentRanges(doc: PMNode, commentId: string): CommentRange[] {
  const out: CommentRange[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const has = node.marks.some((m) => m.type.name === COMMENT_MARK && m.attrs.commentId === commentId);
    if (!has) return false;
    const from = pos;
    const to = pos + node.nodeSize;
    const last = out[out.length - 1];
    if (last && last.to === from) {
      last.to = to;
      last.text += node.text ?? "";
    } else {
      out.push({ from, to, text: node.text ?? "" });
    }
    return false;
  });
  return out;
}

/** Every comment id anchored in a document, in document order. */
export function commentIdsInDoc(doc: PMNode): string[] {
  const seen = new Set<string>();
  doc.descendants((node) => {
    if (!node.isText) return true;
    for (const m of node.marks) {
      if (m.type.name === COMMENT_MARK && typeof m.attrs.commentId === "string") seen.add(m.attrs.commentId);
    }
    return false;
  });
  return [...seen];
}

/** Remove one comment's anchor, or (with `resolved`) re-mark it. Text untouched. */
function rewriteAnchor(
  state: EditorState,
  tr: Transaction,
  commentId: string,
  next: { resolved: boolean } | null,
): boolean {
  const type = state.schema.marks[COMMENT_MARK];
  if (!type) return false;
  let changed = false;
  state.doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const mark = node.marks.find((m) => m.type === type && m.attrs.commentId === commentId);
    if (!mark) return false;
    const to = pos + node.nodeSize;
    tr.removeMark(pos, to, mark);
    if (next) tr.addMark(pos, to, type.create({ commentId, resolved: next.resolved }));
    changed = true;
    return false;
  });
  return changed;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      /** Anchor a comment on the current selection. */
      setComment: (commentId: string) => ReturnType;
      /** Remove a comment's anchor (the words stay). */
      unsetComment: (commentId: string) => ReturnType;
      /** Mark a comment's anchor resolved or open (the words stay). */
      setCommentResolved: (commentId: string, resolved: boolean) => ReturnType;
    };
  }
}

export const CommentMark = Mark.create({
  name: COMMENT_MARK,
  // Typing at either edge of a comment does not extend it.
  inclusive: false,
  // Comments may overlap: each anchor is its own mark instance.
  excludes: "",
  spanning: true,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-comment-id"),
        renderHTML: (a: Record<string, unknown>) => (a.commentId ? { "data-comment-id": String(a.commentId) } : {}),
      },
      resolved: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-resolved") === "true",
        renderHTML: (a: Record<string, unknown>) => (a.resolved ? { "data-resolved": "true" } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ class: "sf-comment" }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setComment:
        (commentId) =>
        ({ state, tr, dispatch }) => {
          const { from, to, empty } = state.selection;
          const type = state.schema.marks[COMMENT_MARK];
          if (empty || !type) return false;
          if (dispatch) tr.addMark(from, to, type.create({ commentId, resolved: false }));
          return true;
        },
      unsetComment:
        (commentId) =>
        ({ state, tr }) =>
          rewriteAnchor(state, tr, commentId, null),
      setCommentResolved:
        (commentId, resolved) =>
        ({ state, tr }) =>
          rewriteAnchor(state, tr, commentId, { resolved }),
    };
  },
});
