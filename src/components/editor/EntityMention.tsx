// ---------------------------------------------------------------------------
// EntityMention — Tiptap Node extension for @entity mentions.
//
// Triggered by typing `@` in the editor. Shows a floating suggestion panel
// listing entities from the current world. On select, inserts an inline
// mention chip (non-editable, colored by entity type).
//
// Stored in HTML as:
//   <entity-mention data-id="uuid" data-label="Name"
//     data-entity-type="character" data-color="#00FF88">Name</entity-mention>
// ---------------------------------------------------------------------------

import { Node, mergeAttributes } from "@tiptap/core";
import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type EntityType,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Tiptap Node Extension
// ---------------------------------------------------------------------------

export const EntityMention = Node.create({
  name: "entityMention",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-id"),
        renderHTML: (attrs) => ({ "data-id": attrs.id }),
      },
      label: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-label"),
        renderHTML: (attrs) => ({ "data-label": attrs.label }),
      },
      entityType: {
        default: "custom",
        parseHTML: (el) => el.getAttribute("data-entity-type"),
        renderHTML: (attrs) => ({ "data-entity-type": attrs.entityType }),
      },
      color: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-color"),
        renderHTML: (attrs) => ({ "data-color": attrs.color }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "entity-mention" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "entity-mention",
      mergeAttributes(HTMLAttributes),
      HTMLAttributes["data-label"] || "Unknown",
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      const entityType = node.attrs.entityType as EntityType;
      const color =
        node.attrs.color ||
        ENTITY_TYPE_COLORS[entityType] ||
        ENTITY_TYPE_COLORS.custom;

      dom.className = "sf-entity-mention";
      dom.setAttribute("data-entity-type", entityType);
      dom.style.setProperty("--mention-color", color);

      // Color dot
      const dot = document.createElement("span");
      dot.className = "sf-entity-mention-dot";
      dot.style.backgroundColor = color;
      dom.appendChild(dot);

      // Label text
      const text = document.createElement("span");
      text.className = "sf-entity-mention-label";
      text.textContent = node.attrs.label || "Unknown";
      dom.appendChild(text);

      dom.addEventListener("click", (e) => {
        e.preventDefault();
        if (node.attrs.id) {
          const rect = dom.getBoundingClientRect();
          window.dispatchEvent(
            new CustomEvent("sf-navigate-entity", {
              detail: {
                entityId: node.attrs.id,
                entityType,
                anchor: {
                  top: rect.bottom + window.scrollY,
                  left: rect.left + window.scrollX,
                  width: rect.width,
                  height: rect.height,
                },
              },
            })
          );
        }
      });

      return { dom };
    };
  },
});

// ---------------------------------------------------------------------------
// useEntityMentionTrigger — monitors editor text for `@` trigger
// ---------------------------------------------------------------------------

interface EntityMentionTriggerState {
  isActive: boolean;
  query: string;
  position: { top: number; left: number };
}

export function useEntityMentionTrigger(editor: Editor | null) {
  const [state, setState] = useState<EntityMentionTriggerState>({
    isActive: false,
    query: "",
    position: { top: 0, left: 0 },
  });

  const checkForTrigger = useCallback(() => {
    if (!editor) return;

    const { state: editorState } = editor;
    const { $from } = editorState.selection;

    // Get text before cursor in current text block
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

    // Find the last @ that could be a mention trigger.
    // It must be either at position 0 or preceded by a whitespace character.
    let lastAt = -1;
    for (let i = textBefore.length - 1; i >= 0; i--) {
      if (textBefore[i] === "@") {
        if (i === 0 || /\s/.test(textBefore[i - 1])) {
          lastAt = i;
        }
        break; // only consider the nearest @
      }
    }

    if (lastAt === -1) {
      if (state.isActive) {
        setState({ isActive: false, query: "", position: { top: 0, left: 0 } });
      }
      return;
    }

    const query = textBefore.slice(lastAt + 1);

    // Close if user typed a space (completed or abandoned the mention)
    // But allow spaces within entity names for multi-word search
    if (query.length > 40) {
      if (state.isActive) {
        setState({ isActive: false, query: "", position: { top: 0, left: 0 } });
      }
      return;
    }

    // Get caret position for popover placement
    const coords = editor.view.coordsAtPos(editorState.selection.from);

    setState({
      isActive: true,
      query,
      position: { top: coords.bottom, left: coords.left },
    });
  }, [editor, state.isActive]);

  useEffect(() => {
    if (!editor) return;

    const handler = () => checkForTrigger();
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);

    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, checkForTrigger]);

  const insertMention = useCallback(
    (entity: {
      id: string;
      name: string;
      entity_type: EntityType;
      color: string | null;
    }) => {
      if (!editor) return;

      const { state: editorState } = editor;
      const { $from } = editorState.selection;
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

      // Find the @ trigger position
      let lastAt = -1;
      for (let i = textBefore.length - 1; i >= 0; i--) {
        if (textBefore[i] === "@") {
          if (i === 0 || /\s/.test(textBefore[i - 1])) {
            lastAt = i;
          }
          break;
        }
      }

      if (lastAt === -1) return;

      // Calculate the absolute position of @ in the document
      const blockStart = $from.pos - $from.parentOffset;
      const deleteFrom = blockStart + lastAt;
      const deleteTo = $from.pos;

      const resolvedColor =
        entity.color || ENTITY_TYPE_COLORS[entity.entity_type] || ENTITY_TYPE_COLORS.custom;

      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: deleteTo })
        .insertContent({
          type: "entityMention",
          attrs: {
            id: entity.id,
            label: entity.name,
            entityType: entity.entity_type,
            color: resolvedColor,
          },
        })
        .insertContent(" ")
        .run();

      setState({ isActive: false, query: "", position: { top: 0, left: 0 } });
    },
    [editor]
  );

  const closeAutocomplete = useCallback(() => {
    setState({ isActive: false, query: "", position: { top: 0, left: 0 } });
  }, []);

  return {
    isActive: state.isActive,
    query: state.query,
    position: state.position,
    insertMention,
    closeAutocomplete,
  };
}
