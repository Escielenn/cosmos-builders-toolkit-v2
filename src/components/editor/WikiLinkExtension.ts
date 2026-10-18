import { Node, mergeAttributes } from "@tiptap/core";
import { selectionHandlers, wireInlineRefHover } from "@/components/editor/inline-ref-events";

/**
 * TipTap extension for [[wiki-links]].
 *
 * Stored in content as: <wiki-link data-element-id="uuid" data-title="Name" data-element-type="type">Name</wiki-link>
 * Displayed as: styled inline link (via addNodeView)
 * Triggered by: typing [[ which opens an autocomplete popover (handled by plugin in editor setup)
 */
export const WikiLink = Node.create({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      elementId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-element-id"),
        renderHTML: (attrs) => ({ "data-element-id": attrs.elementId }),
      },
      title: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-title"),
        renderHTML: (attrs) => ({ "data-title": attrs.title }),
      },
      elementType: {
        default: "unknown",
        parseHTML: (el) => el.getAttribute("data-element-type"),
        renderHTML: (attrs) => ({ "data-element-type": attrs.elementType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "wiki-link" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "wiki-link",
      mergeAttributes(HTMLAttributes),
      HTMLAttributes["data-title"] || "Unknown",
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("span");
      dom.className = "sf-wiki-link";
      dom.textContent = node.attrs.title || "Unknown";
      dom.dataset.elementId = node.attrs.elementId;
      dom.dataset.elementType = node.attrs.elementType;

      const refCtx = { attrs: () => node.attrs as Record<string, unknown>, editor, getPos };
      wireInlineRefHover(dom, "wiki", refCtx);

      dom.addEventListener("click", (e) => {
        e.preventDefault();
        if (node.attrs.elementId) {
          window.dispatchEvent(
            new CustomEvent("sf-navigate-element", {
              detail: { elementId: node.attrs.elementId },
            })
          );
        }
      });

      return { dom, ...selectionHandlers(dom, "wiki", refCtx) };
    };
  },
});
