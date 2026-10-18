// ---------------------------------------------------------------------------
// project replace I/O: fetch the documents in scope, file the snapshots,
// write the replaced text, and revert.
//
// The engine (what changes) is pure: src/lib/writing/project-replace.ts.
// This file is the order of operations that keeps the writer's words safe:
//
//   1. Contents are fetched lazily, when the writer opens the preview, not
//      carried in the binder list.
//   2. Each affected document is re-checked against the preview: if its
//      words changed since (another tab, a collaborator), it is skipped.
//   3. A named snapshot of every affected document is filed FIRST. If any
//      one fails, nothing is replaced.
//   4. A document open in the live editor is changed through that editor,
//      so its own save path persists it and Ctrl+Z still works; every other
//      document is written with an updated_at guard, so a newer copy on the
//      server is never overwritten.
//   5. REVERT puts the snapshot text back only where the document still
//      holds exactly what the replace wrote. Anything edited since is left
//      alone and named, so its snapshot can be restored by hand.
// ---------------------------------------------------------------------------

import type { Editor } from "@tiptap/react";
import { supabase } from "@/integrations/supabase/client";
import { fileContentSnapshot } from "@/hooks/use-document-versions";
import {
  applyReplace,
  matchKey,
  planReplace,
  replaceSnapshotName,
  samePlan,
  type DocReplacePlan,
} from "@/lib/writing/project-replace";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface LoadedDoc {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const CHUNK = 100;

/** Fetch documents' contents, returned in the order of `ids`. */
export async function fetchDocsForReplace(ids: string[]): Promise<LoadedDoc[]> {
  const byId = new Map<string, LoadedDoc>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const { data, error } = await db
      .from("world_entries")
      .select("id, title, content, updated_at")
      .in("id", slice)
      .eq("entry_type", "document")
      .is("trashed_at", null);
    if (error) throw error;
    for (const r of (data ?? []) as { id: string; title: string | null; content: string | null; updated_at: string }[]) {
      byId.set(r.id, { id: r.id, title: r.title || "Untitled", content: r.content ?? "", updatedAt: r.updated_at });
    }
  }
  return ids.map((id) => byId.get(id)).filter((d): d is LoadedDoc => !!d);
}

export interface AppliedDoc {
  docId: string;
  title: string;
  snapshotId: string;
  snapshotName: string;
  /** The text before the replace (what the snapshot holds). */
  before: string;
  /** The text the replace wrote. */
  after: string;
  count: number;
}

export interface SkippedDoc {
  docId: string;
  title: string;
  reason: string;
}

export interface ReplaceRecord {
  find: string;
  replacement: string;
  at: string;
  docs: AppliedDoc[];
}

export interface ApplyInput {
  userId: string;
  worldId: string;
  loaded: LoadedDoc[];
  plans: DocReplacePlan[];
  excluded: ReadonlySet<string>;
  re: RegExp;
  find: string;
  replacement: string;
  regex: boolean;
  /** The live editor showing a document, if any. */
  editorFor: (docId: string) => Editor | null;
}

export interface ApplyOutcome {
  record: ReplaceRecord | null;
  skipped: SkippedDoc[];
  /** Ship's Voice; set when nothing was replaced because of a failure. */
  error: string | null;
}

const CHANGED = "CHANGED SINCE PREVIEW. NOT REPLACED.";

export async function applyProjectReplace(input: ApplyInput): Promise<ApplyOutcome> {
  const { loaded, plans, excluded, re, replacement, regex, editorFor } = input;
  const byId = new Map(loaded.map((d) => [d.id, d]));
  const name = replaceSnapshotName(input.find, replacement);
  const skipped: SkippedDoc[] = [];

  // 1. What each affected document holds now, re-checked against the preview.
  const work: { plan: DocReplacePlan; doc: LoadedDoc; base: string; live: Editor | null; include: (i: number) => boolean; count: number }[] = [];
  for (const plan of plans) {
    const include = (i: number) => !excluded.has(matchKey(plan.docId, i));
    const count = plan.matches.filter((m) => include(m.index)).length;
    const doc = byId.get(plan.docId);
    if (!count || !doc) continue;
    const live = editorFor(plan.docId);
    const base = live && !live.isDestroyed ? live.getHTML() : doc.content;
    if (!samePlan(planReplace(base, re, replacement, regex), plan.matches)) {
      skipped.push({ docId: plan.docId, title: plan.title, reason: CHANGED });
      continue;
    }
    work.push({ plan, doc, base, live: live && !live.isDestroyed ? live : null, include, count });
  }
  if (work.length === 0) return { record: null, skipped, error: skipped.length ? null : "NOTHING SELECTED." };

  // 2. Snapshots first. One failure and nothing is replaced.
  const snapIds = await Promise.all(
    work.map((w) =>
      fileContentSnapshot({
        documentId: w.doc.id,
        worldId: input.worldId,
        userId: input.userId,
        title: w.doc.title,
        content: w.base,
        name,
      }),
    ),
  );
  if (snapIds.some((id) => !id)) {
    return { record: null, skipped, error: "SNAPSHOT FAILED. NOTHING REPLACED." };
  }

  // 3. Write.
  const applied: AppliedDoc[] = [];
  for (let i = 0; i < work.length; i++) {
    const w = work[i];
    const result = applyReplace(w.base, re, replacement, regex, w.include);
    if (result.replaced === 0) continue;
    let after = result.html;
    if (w.live) {
      // Through the editor: its save path persists it, its undo can reverse it.
      w.live.commands.setContent(after, { emitUpdate: true });
      after = w.live.getHTML();
    } else {
      const { data, error } = await db
        .from("world_entries")
        .update({ content: after })
        .eq("id", w.doc.id)
        .eq("updated_at", w.doc.updatedAt)
        .select("id");
      if (error || !data || data.length === 0) {
        skipped.push({ docId: w.doc.id, title: w.doc.title, reason: error ? "WRITE FAILED. NOT REPLACED." : CHANGED });
        continue;
      }
    }
    applied.push({
      docId: w.doc.id,
      title: w.doc.title,
      snapshotId: snapIds[i]!,
      snapshotName: name,
      before: w.base,
      after,
      count: result.replaced,
    });
  }

  return {
    record: applied.length ? { find: input.find, replacement, at: new Date().toISOString(), docs: applied } : null,
    skipped,
    error: null,
  };
}

export interface RevertOutcome {
  restored: AppliedDoc[];
  skipped: SkippedDoc[];
}

/**
 * Put back the text each snapshot holds, only where the document still
 * holds exactly what the replace wrote.
 */
export async function revertProjectReplace(
  record: ReplaceRecord,
  editorFor: (docId: string) => Editor | null,
): Promise<RevertOutcome> {
  const restored: AppliedDoc[] = [];
  const skipped: SkippedDoc[] = [];
  const edited = (d: AppliedDoc) => `EDITED SINCE THE REPLACE. RESTORE "${d.snapshotName}" FROM SNAPSHOTS.`;

  for (const d of record.docs) {
    const live = editorFor(d.docId);
    if (live && !live.isDestroyed) {
      if (live.getHTML() !== d.after) {
        skipped.push({ docId: d.docId, title: d.title, reason: edited(d) });
        continue;
      }
      live.commands.setContent(d.before, { emitUpdate: true });
      restored.push(d);
      continue;
    }
    const { data: row, error: readErr } = await db
      .from("world_entries")
      .select("content, updated_at")
      .eq("id", d.docId)
      .maybeSingle();
    if (readErr || !row) {
      skipped.push({ docId: d.docId, title: d.title, reason: "DOCUMENT NOT FOUND. RESTORE FROM SNAPSHOTS." });
      continue;
    }
    if ((row.content ?? "") !== d.after) {
      skipped.push({ docId: d.docId, title: d.title, reason: edited(d) });
      continue;
    }
    const { data, error } = await db
      .from("world_entries")
      .update({ content: d.before })
      .eq("id", d.docId)
      .eq("updated_at", row.updated_at)
      .select("id");
    if (error || !data || data.length === 0) {
      skipped.push({ docId: d.docId, title: d.title, reason: edited(d) });
      continue;
    }
    restored.push(d);
  }
  return { restored, skipped };
}
