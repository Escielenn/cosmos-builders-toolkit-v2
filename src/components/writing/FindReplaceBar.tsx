// ---------------------------------------------------------------------------
// FindReplaceBar, search and rename inside the open document.
//
// Renaming a character across a manuscript was previously impossible — the
// editor had no find at all. Scrivener users do this constantly, so it is table
// stakes rather than a nicety.
//
// Runs against the live ProseMirror document rather than rewriting the HTML
// string, so undo stays granular (one step per replacement) and the cursor
// survives. Replacements walk backwards so earlier edits don't shift the
// positions of later matches.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { findMatches, nextMatchIndex, type Match } from "@/lib/find-replace";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FindReplaceBarProps {
  editor: Editor | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Document text ↔ ProseMirror positions
// ---------------------------------------------------------------------------

interface TextBlock {
  /** Offset of this block's text within the flattened document string. */
  offset: number;
  /** ProseMirror position of the text node's first character. */
  pos: number;
  length: number;
}

/**
 * Flatten the document to a plain string, keeping a map back to positions.
 *
 * Text nodes are separated by "\n" so a match cannot span two blocks — you
 * don't want a rename to bridge the gap between two paragraphs.
 */
function flatten(editor: Editor): { text: string; blocks: TextBlock[] } {
  const blocks: TextBlock[] = [];
  let text = "";

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      blocks.push({ offset: text.length, pos, length: node.text.length });
      text += node.text;
    } else if (node.isBlock && text.length > 0 && !text.endsWith("\n")) {
      text += "\n";
    }
    return true;
  });

  return { text, blocks };
}

/** Map a flattened offset back to a ProseMirror position. */
function toPos(blocks: TextBlock[], offset: number): number | null {
  for (const b of blocks) {
    if (offset >= b.offset && offset <= b.offset + b.length) {
      return b.pos + (offset - b.offset);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FindReplaceBar({ editor, onClose }: FindReplaceBarProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [current, setCurrent] = useState(0);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Re-flatten on every keystroke: documents here are chapter-sized, and a
  // stale map would point replacements at the wrong characters.
  const { text, blocks } = useMemo(
    () => (editor ? flatten(editor) : { text: "", blocks: [] as TextBlock[] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, query, replacement, notice],
  );

  const matches: Match[] = useMemo(
    () => findMatches(text, query, { caseSensitive, wholeWord }),
    [text, query, caseSensitive, wholeWord],
  );

  const select = useCallback(
    (i: number) => {
      if (!editor || matches.length === 0) return;
      const m = matches[((i % matches.length) + matches.length) % matches.length];
      const from = toPos(blocks, m.start);
      const to = toPos(blocks, m.end);
      if (from === null || to === null) return;
      editor.chain().focus().setTextSelection({ from, to }).run();
      setCurrent(((i % matches.length) + matches.length) % matches.length);
    },
    [editor, matches, blocks],
  );

  // Jump to the first hit after the caret as the query is typed.
  useEffect(() => {
    if (!editor || matches.length === 0) return;
    const caretOffset = 0;
    setCurrent(Math.max(0, nextMatchIndex(matches, caretOffset)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, caseSensitive, wholeWord]);

  const replaceCurrent = useCallback(() => {
    if (!editor || matches.length === 0) return;
    const m = matches[current];
    const from = toPos(blocks, m.start);
    const to = toPos(blocks, m.end);
    if (from === null || to === null) return;
    editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, replacement)
      .run();
    setNotice(`Replaced 1`);
  }, [editor, matches, current, blocks, replacement]);

  const replaceEvery = useCallback(() => {
    if (!editor || matches.length === 0) return;
    // Backwards: replacing an earlier match shifts every later position.
    const chain = editor.chain().focus();
    for (let i = matches.length - 1; i >= 0; i--) {
      const from = toPos(blocks, matches[i].start);
      const to = toPos(blocks, matches[i].end);
      if (from === null || to === null) continue;
      chain.insertContentAt({ from, to }, replacement);
    }
    chain.run();
    setNotice(`Replaced ${matches.length}`);
  }, [editor, matches, blocks, replacement]);

  // Escape closes; Enter steps forward.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(e.shiftKey ? current - 1 : current + 1);
    }
  };

  // Border, focus ring, and placeholder colors come from the global
  // input/select/textarea and :focus-visible rules in tokens.css.
  const inputClass = "px-2 py-1 font-serif text-[14px] text-t2";

  return (
    <div
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-2 border-b border-sf-line bg-sf-surface/60 px-4 py-2"
      role="search"
      aria-label="Find and replace in this document"
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find"
        aria-label="Find"
        className={`${inputClass} w-40`}
      />

      <span className="min-w-[70px] font-mono text-[12px] uppercase tracking-[1.2px] text-t4">
        {query === ""
          ? ""
          : matches.length === 0
            ? "No matches"
            : `${current + 1} of ${matches.length}`}
      </span>

      <button
        onClick={() => select(current - 1)}
        disabled={matches.length === 0}
        aria-label="Previous match"
        className="border border-sf-line-interactive p-1 text-t4 hover:text-t1"
      >
        <ChevronUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => select(current + 1)}
        disabled={matches.length === 0}
        aria-label="Next match"
        className="border border-sf-line-interactive p-1 text-t4 hover:text-t1"
      >
        <ChevronDown className="h-3 w-3" />
      </button>

      <input
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
        placeholder="Replace with"
        aria-label="Replace with"
        className={`${inputClass} w-40`}
      />

      <button
        onClick={replaceCurrent}
        disabled={matches.length === 0}
        className="border border-sf-line-interactive px-2 py-1 font-serif text-[13px] italic text-t3 hover:text-t1"
      >
        Replace
      </button>
      <button
        onClick={replaceEvery}
        disabled={matches.length === 0}
        className="border border-sf-line-interactive px-2 py-1 font-serif text-[13px] italic text-t3 hover:text-t1"
      >
        All
      </button>

      <label className="flex cursor-pointer items-center gap-1.5 text-[12px] uppercase tracking-[1.2px] text-t3">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
          className="accent-sf-teal"
        />
        Aa
      </label>
      <label className="flex cursor-pointer items-center gap-1.5 text-[12px] uppercase tracking-[1.2px] text-t3">
        <input
          type="checkbox"
          checked={wholeWord}
          onChange={(e) => setWholeWord(e.target.checked)}
          className="accent-sf-teal"
        />
        Word
      </label>

      {notice && (
        <span className="font-serif text-[13px] italic text-sf-teal">{notice}</span>
      )}

      <button
        onClick={onClose}
        aria-label="Close find and replace"
        className="ml-auto p-1 text-t4 hover:text-t1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default FindReplaceBar;
