// ---------------------------------------------------------------------------
// recent-work — pure shaping for the signed-in home ("your worlds + continue
// writing") and the ⌘K palette. The rows come from
// src/services/recent-work.ts; nothing here touches the network.
// ---------------------------------------------------------------------------

import { getToolDisplayName } from "@/lib/tools-config";
import { worksheetHref } from "@/lib/world-tool-routes";

/** A Studio document, metadata only (never content). */
export interface RecentDoc {
  id: string;
  world_id: string;
  title: string | null;
  updated_at: string;
}

/** A Codex entry: any world_entries row that is not a document or folder. */
export interface RecentCodexEntry {
  id: string;
  world_id: string;
  title: string | null;
  entry_type: string;
  updated_at: string;
}

export interface RecentWorksheet {
  id: string;
  world_id: string | null;
  tool_type: string;
  title: string | null;
  updated_at: string;
  data?: unknown;
}

export interface WorldLite {
  id: string;
  name: string;
  icon?: string | null;
  updated_at: string;
}

export const UNTITLED_DOC = "Untitled";

export function docHref(doc: Pick<RecentDoc, "id">): string {
  return `/write/${doc.id}`;
}

export function codexHref(entry: Pick<RecentCodexEntry, "id" | "world_id">): string {
  return `/worlds/${entry.world_id}/codex/${entry.id}`;
}

function ts(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/**
 * The most recently edited document in each world. Ties keep the first row
 * seen, so a caller that pre-sorts by updated_at desc gets a stable answer.
 */
export function latestDocByWorld(docs: readonly RecentDoc[]): Map<string, RecentDoc> {
  const out = new Map<string, RecentDoc>();
  for (const doc of docs) {
    const prev = out.get(doc.world_id);
    if (!prev || ts(doc.updated_at) > ts(prev.updated_at)) out.set(doc.world_id, doc);
  }
  return out;
}

export interface ContinueTarget<W extends WorldLite = WorldLite> {
  world: W;
  /** The document CONTINUE opens; null when the world has none on file. */
  doc: RecentDoc | null;
  /** The later of the world's own update and its latest document. */
  lastTouched: string;
}

/**
 * Worlds ordered by when the writer last touched them, each paired with the
 * document CONTINUE should open. A world whose prose changed yesterday ranks
 * above one whose settings changed last week, even though writing a document
 * does not bump worlds.updated_at.
 */
export function continueTargets<W extends WorldLite>(
  worlds: readonly W[],
  docs: readonly RecentDoc[],
  limit = 6,
): ContinueTarget<W>[] {
  const latest = latestDocByWorld(docs);
  return worlds
    .map((world) => {
      const doc = latest.get(world.id) ?? null;
      const lastTouched =
        doc && ts(doc.updated_at) > ts(world.updated_at) ? doc.updated_at : world.updated_at;
      return { world, doc, lastTouched };
    })
    .sort((a, b) => ts(b.lastTouched) - ts(a.lastTouched))
    .slice(0, Math.max(0, limit));
}

export type ActivityKind = "document" | "codex" | "worksheet";

export interface ActivityItem {
  key: string;
  kind: ActivityKind;
  title: string;
  /** Short type label: DOCUMENT, a Codex type, or the tool's name. */
  label: string;
  worldId: string | null;
  worldName: string | null;
  updatedAt: string;
  href: string;
}

function humanType(entryType: string): string {
  return entryType.replace(/[_-]+/g, " ").trim().toUpperCase() || "ENTRY";
}

/** The worksheet's own name when it has one (Phylo stores a species name). */
export function worksheetTitle(ws: RecentWorksheet): string {
  const data = ws.data as { speciesName?: unknown } | null | undefined;
  if (data && typeof data.speciesName === "string" && data.speciesName.trim()) {
    return data.speciesName.trim();
  }
  return ws.title?.trim() || getToolDisplayName(ws.tool_type);
}

/**
 * One feed of what changed last, across documents, Codex entries and
 * worksheets, newest first. Rows in worlds the caller does not know about
 * (archived, or not the writer's) are dropped so the feed never links into a
 * world the home page does not list. Worksheets with no route are dropped.
 */
export function mergeActivity(
  input: {
    docs: readonly RecentDoc[];
    entries: readonly RecentCodexEntry[];
    worksheets: readonly RecentWorksheet[];
  },
  worldNames: ReadonlyMap<string, string>,
  limit = 8,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const known = (worldId: string | null) => !!worldId && worldNames.has(worldId);

  for (const d of input.docs) {
    if (!known(d.world_id)) continue;
    items.push({
      key: `document:${d.id}`,
      kind: "document",
      title: d.title?.trim() || UNTITLED_DOC,
      label: "DOCUMENT",
      worldId: d.world_id,
      worldName: worldNames.get(d.world_id) ?? null,
      updatedAt: d.updated_at,
      href: docHref(d),
    });
  }
  for (const e of input.entries) {
    if (!known(e.world_id)) continue;
    items.push({
      key: `codex:${e.id}`,
      kind: "codex",
      title: e.title?.trim() || UNTITLED_DOC,
      label: humanType(e.entry_type),
      worldId: e.world_id,
      worldName: worldNames.get(e.world_id) ?? null,
      updatedAt: e.updated_at,
      href: codexHref(e),
    });
  }
  for (const w of input.worksheets) {
    if (!known(w.world_id)) continue;
    const href = worksheetHref(w);
    if (!href) continue;
    items.push({
      key: `worksheet:${w.id}`,
      kind: "worksheet",
      title: worksheetTitle(w),
      label: getToolDisplayName(w.tool_type).toUpperCase(),
      worldId: w.world_id,
      worldName: w.world_id ? worldNames.get(w.world_id) ?? null : null,
      updatedAt: w.updated_at,
      href,
    });
  }

  return items
    .sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt))
    .slice(0, Math.max(0, limit));
}
