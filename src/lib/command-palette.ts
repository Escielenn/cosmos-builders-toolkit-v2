// ---------------------------------------------------------------------------
// command-palette — pure result shaping for ⌘K (GlobalSearch).
//
// The palette searches worlds, Codex entries, Studio documents (titles only)
// and worksheets. cmdk filters on each item's `value`, so the value carries
// what a writer would type: the title, the world, the type. Two items with
// the same value would highlight together, so duplicates get a counter.
// ---------------------------------------------------------------------------

import { getToolDisplayName } from "@/lib/tools-config";
import { worksheetHref } from "@/lib/world-tool-routes";
import {
  UNTITLED_DOC,
  codexHref,
  docHref,
  worksheetTitle,
  type RecentCodexEntry,
  type RecentDoc,
  type RecentWorksheet,
} from "@/lib/recent-work";

export type PaletteKind = "world" | "document" | "codex" | "worksheet";

export interface PaletteItem {
  key: string;
  kind: PaletteKind;
  /** cmdk filter string; unique across the palette. */
  value: string;
  label: string;
  /** World name, type, or tool. */
  detail: string;
  href: string;
  /** For worksheets: the tool id (icon lookup). */
  toolType?: string;
}

export interface PaletteGroups {
  worlds: PaletteItem[];
  documents: PaletteItem[];
  codex: PaletteItem[];
  worksheets: PaletteItem[];
}

export const PALETTE_LIMITS = {
  worlds: 50,
  documents: 150,
  codex: 150,
  worksheets: 50,
} as const;

export interface PaletteInput {
  worlds: readonly { id: string; name: string }[];
  docs: readonly RecentDoc[];
  entries: readonly RecentCodexEntry[];
  worksheets: readonly RecentWorksheet[];
}

function typeLabel(entryType: string): string {
  return entryType.replace(/[_-]+/g, " ").trim().toLowerCase() || "entry";
}

/**
 * Shape raw rows into palette groups. Rows outside the listed worlds are
 * dropped (the palette never links into a world it does not show), each
 * group is capped, and values are made unique.
 */
export function shapePaletteGroups(input: PaletteInput): PaletteGroups {
  const worldNames = new Map(input.worlds.map((w) => [w.id, w.name]));
  const seen = new Map<string, number>();
  const unique = (base: string): string => {
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  };

  const worlds: PaletteItem[] = input.worlds.slice(0, PALETTE_LIMITS.worlds).map((w) => ({
    key: `world:${w.id}`,
    kind: "world",
    value: unique(`world ${w.name}`),
    label: w.name,
    detail: "World",
    href: `/worlds/${w.id}`,
  }));

  const documents: PaletteItem[] = [];
  for (const d of input.docs) {
    if (documents.length >= PALETTE_LIMITS.documents) break;
    const worldName = worldNames.get(d.world_id);
    if (!worldName) continue;
    const label = d.title?.trim() || UNTITLED_DOC;
    documents.push({
      key: `document:${d.id}`,
      kind: "document",
      value: unique(`document ${label} ${worldName}`),
      label,
      detail: worldName,
      href: docHref(d),
    });
  }

  const codex: PaletteItem[] = [];
  for (const e of input.entries) {
    if (codex.length >= PALETTE_LIMITS.codex) break;
    const worldName = worldNames.get(e.world_id);
    if (!worldName) continue;
    const label = e.title?.trim() || UNTITLED_DOC;
    const type = typeLabel(e.entry_type);
    codex.push({
      key: `codex:${e.id}`,
      kind: "codex",
      value: unique(`codex ${label} ${type} ${worldName}`),
      label,
      detail: `${type} · ${worldName}`,
      href: codexHref(e),
    });
  }

  const worksheets: PaletteItem[] = [];
  for (const w of input.worksheets) {
    if (worksheets.length >= PALETTE_LIMITS.worksheets) break;
    const href = worksheetHref(w);
    if (!href) continue;
    const label = worksheetTitle(w);
    const tool = getToolDisplayName(w.tool_type);
    const worldName = w.world_id ? worldNames.get(w.world_id) : undefined;
    worksheets.push({
      key: `worksheet:${w.id}`,
      kind: "worksheet",
      value: unique(`worksheet ${label} ${tool}${worldName ? ` ${worldName}` : ""}`),
      label,
      detail: worldName ? `${tool} · ${worldName}` : tool,
      href,
      toolType: w.tool_type,
    });
  }

  return { worlds, documents, codex, worksheets };
}
