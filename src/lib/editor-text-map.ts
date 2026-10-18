// ---------------------------------------------------------------------------
// editor-text-map, a ProseMirror document as plain text with a map back to
// document positions.
//
// Shared by the in-document find (FindReplaceBar) and the binder-wide search
// jump, so both agree on what "the Nth match" is. Text nodes are separated by
// "\n" at block boundaries (and at hard breaks), so a match can never bridge
// two paragraphs; src/lib/binder-search.ts flattens HTML the same way.
// ---------------------------------------------------------------------------

import type { Editor } from "@tiptap/react";
import { findAllMatches, type Span } from "@/lib/binder-search";

export interface TextBlock {
  /** Offset of this text node within the flattened document string. */
  offset: number;
  /** ProseMirror position of the text node's first character. */
  pos: number;
  length: number;
}

export function flattenEditor(editor: Editor): { text: string; blocks: TextBlock[] } {
  const blocks: TextBlock[] = [];
  let text = "";

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      blocks.push({ offset: text.length, pos, length: node.text.length });
      text += node.text;
    } else if ((node.isBlock || node.type.name === "hardBreak") && text.length > 0 && !text.endsWith("\n")) {
      text += "\n";
    }
    return true;
  });

  return { text, blocks };
}

/** Map a flattened offset back to a ProseMirror position. */
export function offsetToPos(blocks: TextBlock[], offset: number): number | null {
  for (const b of blocks) {
    if (offset >= b.offset && offset <= b.offset + b.length) {
      return b.pos + (offset - b.offset);
    }
  }
  return null;
}

/**
 * Select the `occurrence`-th match of `re` in the editor and scroll it into
 * view. Clamps to the last match if the document changed since the search.
 * Returns false when there is no match at all.
 */
export function selectMatch(editor: Editor, re: RegExp, occurrence: number): boolean {
  const { text, blocks } = flattenEditor(editor);
  const spans: Span[] = findAllMatches(text, re);
  if (spans.length === 0) return false;
  const span = spans[Math.min(Math.max(0, occurrence), spans.length - 1)];
  const from = offsetToPos(blocks, span.start);
  const to = offsetToPos(blocks, span.end);
  if (from === null || to === null) return false;
  editor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
  return true;
}
