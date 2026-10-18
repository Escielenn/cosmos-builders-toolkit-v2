// ---------------------------------------------------------------------------
// useTypewriterScroll, keep the caret line at the vertical centre of a scroll
// container while the writer types (Scrivener's typewriter scrolling).
//
// Listens to `selectionchange` (fires on every caret move and keystroke) and
// adjusts scrollTop in the next animation frame, so it never sits between a
// key press and the character appearing. Works for any ProseMirror inside the
// container: the main editor, every Scrivenings section, the split pane.
// The container needs room below the last line (Write.tsx adds a spacer).
// ---------------------------------------------------------------------------

import { useEffect, type RefObject } from "react";

/** Caret rectangle, falling back to its block when the range has no box. */
function caretRect(sel: Selection): DOMRect | null {
  if (sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(false);
  const rects = range.getClientRects();
  if (rects.length > 0) return rects[rects.length - 1];
  // An empty paragraph has no client rect; use the element that holds it.
  const node = range.endContainer;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return el ? el.getBoundingClientRect() : null;
}

export function useTypewriterScroll(container: RefObject<HTMLElement>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    // Only follow the caret when the keyboard moved it. A click to read or
    // place the caret elsewhere must not yank the page under the pointer.
    let lastKey = 0;
    const onKey = () => {
      lastKey = performance.now();
    };
    const onChange = () => {
      if (performance.now() - lastKey > 600) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = container.current;
        const sel = document.getSelection();
        if (!box || !sel || sel.rangeCount === 0) return;
        const anchor = sel.anchorNode;
        const host = anchor && (anchor.nodeType === Node.ELEMENT_NODE ? (anchor as Element) : anchor.parentElement);
        // Only a caret inside an editor in THIS container.
        if (!host || !box.contains(host) || !host.closest(".ProseMirror")) return;
        const rect = caretRect(sel);
        if (!rect || (rect.height === 0 && rect.top === 0)) return;
        const boxRect = box.getBoundingClientRect();
        const caretMid = rect.top + rect.height / 2;
        const centre = boxRect.top + boxRect.height / 2;
        const delta = caretMid - centre;
        if (Math.abs(delta) > 2) box.scrollTop += delta;
      });
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("input", onKey, true);
    document.addEventListener("selectionchange", onChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("input", onKey, true);
      document.removeEventListener("selectionchange", onChange);
    };
  }, [container, enabled]);
}
