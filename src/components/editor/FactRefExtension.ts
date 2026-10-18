// ---------------------------------------------------------------------------
// FactRef, the cited fact as a Tiptap inline atom.
//
// Renders as the value text, in the prose's own type, with a quiet underline
// in the producing tool's accent. A ref whose source has moved on carries a
// small STALE marker (data-state="stale"); the hover card says what changed.
// The node's stored value is the prose and never changes on its own.
//
// Serialisation and staleness live in lib/writing/fact-ref.ts (pure, tested).
// ---------------------------------------------------------------------------

import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { getToolAccent } from "@/lib/tool-accents";
import {
  FACT_REF_DOM_ATTRS,
  FACT_REF_TAG,
  sanitizeFactRefAttrs,
  type FactRefAttrs,
} from "@/lib/writing/fact-ref";
import { liveStatus, subscribeLiveFacts } from "@/lib/writing/live-facts";
import { selectionHandlers, wireInlineRefHover } from "@/components/editor/inline-ref-events";

function attrsOf(node: PMNode): FactRefAttrs {
  return sanitizeFactRefAttrs(node.attrs as Partial<Record<keyof FactRefAttrs, unknown>>);
}

export const FactRef = Node.create({
  name: "factRef",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    const out: Record<string, { default: string | null; parseHTML: (el: HTMLElement) => string | null; renderHTML: (a: Record<string, unknown>) => Record<string, string> }> = {};
    for (const [field, attr] of FACT_REF_DOM_ATTRS) {
      out[field] = {
        default: field === "worksheetId" || field === "entityId" ? null : "",
        parseHTML: (el) => {
          const v = el.getAttribute(attr);
          // A ref saved without data-value keeps its text as the value.
          if (field === "value" && !v) return el.textContent ?? "";
          return v;
        },
        renderHTML: (a) => {
          const v = a[field];
          return v === null || v === undefined || v === "" ? {} : { [attr]: String(v) };
        },
      };
    }
    return out;
  },

  parseHTML() {
    return [{ tag: FACT_REF_TAG }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // The text content is the stored value, so every tag-stripping exporter
    // prints exactly what the writer inserted.
    return [FACT_REF_TAG, mergeAttributes(HTMLAttributes), attrsOf(node).value];
  },

  renderText({ node }) {
    return attrsOf(node).value;
  },

  addNodeView() {
    return ({ node: initial, editor, getPos }) => {
      let node = initial;
      const dom = document.createElement("span");
      dom.className = "sf-fact-ref";

      const paint = () => {
        const a = attrsOf(node);
        dom.textContent = a.value || "—";
        dom.dataset.accent = getToolAccent(a.tool || "codex");
        const status = liveStatus(a);
        dom.dataset.state = status?.state ?? "unknown";
      };
      paint();
      const unsubscribe = subscribeLiveFacts(paint);

      const ctx = { attrs: () => node.attrs as Record<string, unknown>, editor, getPos };
      wireInlineRefHover(dom, "fact", ctx);

      return {
        dom,
        ...selectionHandlers(dom, "fact", ctx),
        update: (next) => {
          if (next.type !== node.type) return false;
          node = next;
          paint();
          return true;
        },
        destroy: unsubscribe,
      };
    };
  },
});
