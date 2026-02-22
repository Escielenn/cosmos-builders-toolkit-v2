import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface WikiLinkTriggerState {
  isActive: boolean;
  query: string;
  position: { top: number; left: number };
}

/**
 * Monitors TipTap editor text for `[[` trigger and manages
 * autocomplete state. Returns current trigger state + handlers
 * for inserting a wiki-link node.
 */
export function useWikiLinkTrigger(editor: Editor | null) {
  const [state, setState] = useState<WikiLinkTriggerState>({
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

    // Find the last [[ that isn't closed by ]]
    const lastOpen = textBefore.lastIndexOf("[[");
    if (lastOpen === -1) {
      if (state.isActive) {
        setState({ isActive: false, query: "", position: { top: 0, left: 0 } });
      }
      return;
    }

    // Check if there's a ]] after the [[
    const afterOpen = textBefore.slice(lastOpen + 2);
    if (afterOpen.includes("]]")) {
      if (state.isActive) {
        setState({ isActive: false, query: "", position: { top: 0, left: 0 } });
      }
      return;
    }

    // We have an active [[ trigger
    const query = afterOpen;

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

  const insertWikiLink = useCallback(
    (element: { id: string; title: string; type: string }) => {
      if (!editor) return;

      const { state: editorState } = editor;
      const { $from } = editorState.selection;
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const lastOpen = textBefore.lastIndexOf("[[");

      if (lastOpen === -1) return;

      // Calculate the absolute position of [[ in the document
      const blockStart = $from.pos - $from.parentOffset;
      const deleteFrom = blockStart + lastOpen;
      const deleteTo = $from.pos;

      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: deleteTo })
        .insertContent({
          type: "wikiLink",
          attrs: {
            elementId: element.id,
            title: element.title,
            elementType: element.type,
          },
        })
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
    insertWikiLink,
    closeAutocomplete,
  };
}
