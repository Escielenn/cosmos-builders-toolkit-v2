// ---------------------------------------------------------------------------
// useExternalContentSync, apply a content prop to a Tiptap editor only when
// it is genuinely new from outside (see src/lib/editor-sync.ts), and always
// with emitUpdate: false so an external sync is never saved back as an edit.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { decideExternalContent } from "@/lib/editor-sync";

export function useExternalContentSync(editor: Editor | null, content: string): void {
  const state = useRef<{ editor: Editor | null; lastIncoming: string | null; synced: string | null }>({
    editor: null,
    lastIncoming: null,
    synced: null,
  });
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const s = state.current;

    const evaluate = () => {
      if (editor.isDestroyed) return;
      const incoming = contentRef.current;
      const editorHtml = editor.getHTML();
      // A new instance was created with this content: that is the sync point.
      if (s.editor !== editor) {
        s.editor = editor;
        s.lastIncoming = incoming;
        s.synced = editorHtml;
        return;
      }
      const d = decideExternalContent({
        incoming,
        lastIncoming: s.lastIncoming,
        editorHtml,
        syncedHtml: s.synced,
        focused: editor.isFocused,
      });
      if (d === "defer") return; // re-evaluated on blur
      s.lastIncoming = incoming;
      if (d === "in-sync") {
        s.synced = editorHtml;
      } else if (d === "apply") {
        editor.commands.setContent(incoming || "", { emitUpdate: false });
        s.synced = editor.getHTML();
      }
    };

    evaluate();
    editor.on("blur", evaluate);
    return () => {
      editor.off("blur", evaluate);
    };
  }, [content, editor]);
}
