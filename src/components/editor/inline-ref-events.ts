// ---------------------------------------------------------------------------
// inline-ref-events, how inline atoms in the prose (fact refs, @mentions,
// [[wiki links]]) tell the Studio they are being looked at.
//
// Node views are plain DOM. They announce hover, focus and click on one
// window event; the Studio's card layer listens and renders the hover card.
// Anywhere else the editor is used (wiki pages, notes) nobody listens and the
// events cost nothing.
// ---------------------------------------------------------------------------

import type { Editor } from "@tiptap/core";

export const INLINE_REF_EVENT = "sf-inline-ref";

export type InlineRefKind = "fact" | "entity" | "wiki";
/**
 * enter/leave: pointer hover. select/deselect: the node became (or stopped
 * being) the selection, by click or by arrowing onto it, which is how a
 * keyboard writer "focuses" an inline atom.
 */
export type InlineRefPhase = "enter" | "leave" | "select" | "deselect";

export interface InlineRefDetail {
  kind: InlineRefKind;
  phase: InlineRefPhase;
  /** The node's attributes at the moment of the event. */
  attrs: Record<string, unknown>;
  /** The chip, for positioning. */
  dom: HTMLElement;
  editor: Editor;
  getPos: () => number | undefined;
}

export function announceInlineRef(detail: InlineRefDetail): void {
  window.dispatchEvent(new CustomEvent<InlineRefDetail>(INLINE_REF_EVENT, { detail }));
}

/**
 * selectNode/deselectNode for a node view: keeps ProseMirror's selected
 * class (a custom node view must add it itself) and announces the change.
 */
export function selectionHandlers(
  dom: HTMLElement,
  kind: InlineRefKind,
  ctx: { attrs: () => Record<string, unknown>; editor: Editor; getPos: () => number | undefined },
): { selectNode: () => void; deselectNode: () => void } {
  return {
    selectNode: () => {
      dom.classList.add("ProseMirror-selectednode");
      announceInlineRef({ kind, phase: "select", attrs: ctx.attrs(), dom, editor: ctx.editor, getPos: ctx.getPos });
    },
    deselectNode: () => {
      dom.classList.remove("ProseMirror-selectednode");
      announceInlineRef({ kind, phase: "deselect", attrs: ctx.attrs(), dom, editor: ctx.editor, getPos: ctx.getPos });
    },
  };
}

/** Wire hover/leave announcements onto a node view's DOM. */
export function wireInlineRefHover(
  dom: HTMLElement,
  kind: InlineRefKind,
  ctx: { attrs: () => Record<string, unknown>; editor: Editor; getPos: () => number | undefined },
): void {
  dom.addEventListener("mouseenter", () =>
    announceInlineRef({ kind, phase: "enter", attrs: ctx.attrs(), dom, editor: ctx.editor, getPos: ctx.getPos }),
  );
  dom.addEventListener("mouseleave", () =>
    announceInlineRef({ kind, phase: "leave", attrs: ctx.attrs(), dom, editor: ctx.editor, getPos: ctx.getPos }),
  );
}
