import { Node, mergeAttributes } from "@tiptap/core";

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
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.className = "sf-wiki-link";
      dom.textContent = node.attrs.title || "Unknown";
      dom.dataset.elementId = node.attrs.elementId;
      dom.dataset.elementType = node.attrs.elementType;

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

      return { dom };
    };
  },
});
