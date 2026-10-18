// ---------------------------------------------------------------------------
// prompt-document.ts, what a new Studio document started from a writing
// prompt looks like.
//
// The prompt goes into the document's card (synopsis) and the writer's notes,
// and its word goal becomes the document target. It never goes into the
// prose: the body starts empty, the writer's words only.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { writeDocMeta } from "@/lib/document-meta";
import type { WritingPrompt } from "@/lib/writing/prompts";

export interface PromptDocumentSeed {
  title: string;
  /** Always empty. The prompt is never written into the prose. */
  content: "";
  metadata: Record<string, unknown>;
}

export function promptDocumentSeed(prompt: WritingPrompt, startedOn: string): PromptDocumentSeed {
  const notes = [
    `Daily prompt: ${prompt.title}`,
    prompt.wordGoal ? `Word goal: ${prompt.wordGoal}` : "",
    `Started ${startedOn}`,
  ]
    .filter(Boolean)
    .join("\n");
  const metadata = writeDocMeta(
    {},
    {
      synopsis: prompt.prompt,
      notes,
      ...(prompt.wordGoal ? { target: prompt.wordGoal } : {}),
    },
  );
  return {
    title: prompt.title.trim() || "Untitled",
    content: "",
    metadata: { ...metadata, workshop: { promptId: prompt.id } },
  };
}

/** The root folder new prompt documents (and migrated workshop entries) live in. */
export function isWorkshopFolder(row: { entry_type: string; metadata: unknown }): boolean {
  if (row.entry_type !== "folder") return false;
  const m = row.metadata;
  return !!m && typeof m === "object" && (m as Record<string, unknown>).workshopFolder === true;
}
