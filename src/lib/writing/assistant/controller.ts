// ---------------------------------------------------------------------------
// controller, the thin, always-loaded half of the writing assistant.
//
// The Manuscript imports this file; it is a few lines. The engine (the
// decoration plugin, the matching, the worker and its WebAssembly) is pulled
// in with a dynamic import the first time the writer turns the assistant on,
// so none of it is in the Manuscript's chunk or the initial bundle.
//
// One engine at a time, owned here. stop() terminates the worker.
// ---------------------------------------------------------------------------

import type { Editor } from "@tiptap/react";
import { getRoom, patchAssistant, roomEditor } from "@/lib/writing/room-store";
import type { WorldLexicon } from "@/lib/writing/lexicon";
import type { AssistantEngine, MentionAttrs } from "./engine";

let engine: AssistantEngine | null = null;
let loading: Promise<void> | null = null;
let wanted = false;
let lexicon: WorldLexicon | null = null;

/** Turn the checker on: load the engine if needed and bind the open editor. */
export function startAssistant(): Promise<void> {
  wanted = true;
  if (engine) return Promise.resolve();
  if (loading) return loading;
  patchAssistant({ phase: "loading", note: "LOADING CHECKER. ABOUT 20 MB, FIRST USE ONLY.", issues: [] });
  loading = import("./engine")
    .then(({ AssistantEngine: Engine }) => {
      loading = null;
      // Turned off again while the code was on its way.
      if (!wanted) return;
      const { settings } = getRoom().assistant;
      engine = new Engine({
        dialect: settings.dialect,
        auto: settings.auto,
        lexicon,
        onUpdate: (u) => {
          if (wanted) patchAssistant(u);
        },
      });
      engine.syncEditor(roomEditor());
    })
    .catch(() => {
      loading = null;
      if (wanted) patchAssistant({ phase: "failed", note: "CHECKER DID NOT LOAD. THE EDITOR IS UNAFFECTED.", issues: [] });
    });
  return loading;
}

/** Turn the checker off: underlines gone, worker terminated. */
export function stopAssistant(): void {
  wanted = false;
  engine?.dispose();
  engine = null;
  patchAssistant({ phase: "off", issues: [], note: "", picked: null });
}

/** Point the engine at the Manuscript's current editor (cheap; call freely). */
export function syncAssistantEditor(editor: Editor | null = roomEditor()): void {
  engine?.syncEditor(editor);
}

export function setAssistantLexicon(next: WorldLexicon | null): void {
  lexicon = next;
  engine?.setLexicon(next);
}

export function configureAssistant(settings: { dialect: number; auto: boolean }): void {
  engine?.configure(settings);
}

export const assistant = {
  reviewDocument: (): void => engine?.reviewDocument(),
  checkParagraph: (): void => engine?.checkParagraph(true),
  apply: (id: string, index: number): void => engine?.apply(id, index),
  replaceWith: (id: string, text: string): void => engine?.replaceWith(id, text),
  link: (id: string, attrs: MentionAttrs): void => engine?.link(id, attrs),
  ignore: (id: string): void => engine?.ignore(id),
  reveal: (id: string): void => engine?.reveal(id),
  canLink: (): boolean => engine?.canLink() ?? false,
};
