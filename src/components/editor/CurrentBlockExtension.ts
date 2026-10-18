// ---------------------------------------------------------------------------
// CurrentBlock, marks the top-level block that holds the caret with the class
// `sf-current-block`.
//
// Drives the writing space's "fade other paragraphs" reading aid: CSS under
// `.sf-fade-others` (src/index.css) recolours every other block to a dimmer
// text tier while the editor has focus. A decoration, not a DOM poke, so
// ProseMirror's own re-renders can never strip it. Costs one node lookup per
// transaction; never touches the document.
// ---------------------------------------------------------------------------

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const key = new PluginKey("sfCurrentBlock");

export const CurrentBlock = Extension.create({
  name: "sfCurrentBlock",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        props: {
          decorations(state) {
            const { $head } = state.selection;
            if ($head.depth < 1) return DecorationSet.empty;
            const from = $head.before(1);
            const node = state.doc.nodeAt(from);
            if (!node) return DecorationSet.empty;
            return DecorationSet.create(state.doc, [
              Decoration.node(from, from + node.nodeSize, { class: "sf-current-block" }),
            ]);
          },
        },
      }),
    ];
  },
});

export default CurrentBlock;
