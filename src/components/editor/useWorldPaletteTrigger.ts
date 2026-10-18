// ---------------------------------------------------------------------------
// useWorldPaletteTrigger, the "/" and Ctrl/Cmd+J entry points to the world
// palette inside a manuscript editor.
//
// Mirrors the @ and [[ triggers: it reads the text before the caret on each
// update, which is a string slice, never a lookup. Searching happens in the
// palette, over an index the Studio already built.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { findSlashTrigger, LEAF_PLACEHOLDER } from "@/lib/writing/palette-trigger";

export type PaletteMode = "slash" | "hotkey";

export interface PaletteState {
  open: boolean;
  mode: PaletteMode;
  query: string;
  /** Absolute position of the "/" (slash mode), or of the caret (hotkey). */
  anchor: number;
  position: { top: number; left: number };
}

const CLOSED: PaletteState = { open: false, mode: "slash", query: "", anchor: 0, position: { top: 0, left: 0 } };

export function useWorldPaletteTrigger(editor: Editor | null, enabled: boolean) {
  const [state, setState] = useState<PaletteState>(CLOSED);
  const stateRef = useRef(state);
  stateRef.current = state;
  /** A slash the writer dismissed with Escape stays dismissed. */
  const dismissedAt = useRef<number | null>(null);

  const check = useCallback(() => {
    if (!editor || !enabled) return;
    if (stateRef.current.open && stateRef.current.mode === "hotkey") return;
    const { $from, empty } = editor.state.selection;
    if (!empty || $from.parent.type.name === "codeBlock") {
      if (stateRef.current.open) setState(CLOSED);
      return;
    }
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, LEAF_PLACEHOLDER);
    const hit = findSlashTrigger(textBefore);
    if (!hit) {
      dismissedAt.current = null;
      if (stateRef.current.open) setState(CLOSED);
      return;
    }
    const anchor = $from.pos - $from.parentOffset + hit.at;
    if (dismissedAt.current === anchor) return;
    const coords = editor.view.coordsAtPos($from.pos);
    setState({ open: true, mode: "slash", query: hit.query, anchor, position: { top: coords.bottom, left: coords.left } });
  }, [editor, enabled]);

  useEffect(() => {
    if (!editor || !enabled) return;
    editor.on("selectionUpdate", check);
    editor.on("update", check);
    return () => {
      editor.off("selectionUpdate", check);
      editor.off("update", check);
    };
  }, [editor, enabled, check]);

  /** Ctrl/Cmd+J: open at the caret with the palette's own search field. */
  const openHotkey = useCallback((): boolean => {
    if (!editor || !enabled) return false;
    const pos = editor.state.selection.to;
    const coords = editor.view.coordsAtPos(pos);
    setState({ open: true, mode: "hotkey", query: "", anchor: pos, position: { top: coords.bottom, left: coords.left } });
    return true;
  }, [editor, enabled]);

  const close = useCallback((dismiss = true) => {
    const s = stateRef.current;
    if (dismiss && s.open && s.mode === "slash") dismissedAt.current = s.anchor;
    setState(CLOSED);
  }, []);

  return { state, openHotkey, close };
}
