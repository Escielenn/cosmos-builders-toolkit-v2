// ---------------------------------------------------------------------------
// Document identity (1.7): what a document looks like wherever it is listed.
//
//   marker   the writer's emoji, stored in world_entries.metadata.marker
//   colour   the writer's hue, metadata.color; else the label's; else the
//            status's. One accent per document, used for a card's top edge.
//   status   outline / draft / revised / final (lib/document-meta.ts), shown
//            as a phase glyph and its name, never as colour alone.
//
// No new tables and no new columns: both fields ride the metadata jsonb the
// binder already reads, through useUpdateDocumentMeta. Pure, tested.
// ---------------------------------------------------------------------------

import { STATUS_LABELS, type DocStatus, type DocumentMeta } from "@/lib/document-meta";
import { LABEL_HUES, findLabel, type LabelHue, type WritingLabel } from "@/lib/writing-labels";

/** A document's accent: a named hue, the role colour, or none. */
export type DocAccent = LabelHue | "primary" | "none";

export function isDocColor(v: unknown): v is LabelHue {
  return typeof v === "string" && (LABEL_HUES as readonly string[]).includes(v);
}

/** How far along: the share of the phase glyph that is filled. */
export const STATUS_PHASE: Record<DocStatus, number> = {
  outline: 0,
  draft: 0.5,
  revised: 0.75,
  final: 1,
};

const STATUS_ACCENT: Record<DocStatus, DocAccent> = {
  outline: "none",
  draft: "amber",
  revised: "stellar",
  final: "primary",
};

export function statusAccent(status: DocStatus | ""): DocAccent {
  return status ? STATUS_ACCENT[status] : "none";
}

/** The writer's colour, else the label's, else the status's. */
export function docAccent(
  meta: Pick<DocumentMeta, "color" | "labelId" | "status">,
  labels: WritingLabel[],
): DocAccent {
  if (isDocColor(meta.color)) return meta.color;
  const label = findLabel(labels, meta.labelId);
  if (label) return label.hue;
  return statusAccent(meta.status);
}

/** Static class strings (Tailwind cannot see interpolated names). */
export const ACCENT_BG: Record<DocAccent, string> = {
  amber: "bg-sf-amber",
  azure: "bg-sf-azure",
  emerald: "bg-sf-emerald",
  magenta: "bg-sf-magenta",
  stellar: "bg-sf-stellar",
  violet: "bg-sf-violet",
  teal: "bg-sf-teal",
  crimson: "bg-sf-crimson",
  primary: "bg-sf-primary",
  none: "bg-sf-line-interactive",
};

export const ACCENT_TEXT: Record<DocAccent, string> = {
  amber: "text-sf-amber",
  azure: "text-sf-azure",
  emerald: "text-sf-emerald",
  magenta: "text-sf-magenta",
  stellar: "text-sf-stellar",
  violet: "text-sf-violet",
  teal: "text-sf-teal",
  crimson: "text-sf-crimson",
  primary: "text-sf-primary",
  none: "text-t4",
};

/** The live token behind an accent, for surfaces styled with CSS variables. */
export const ACCENT_VAR: Record<DocAccent, string> = {
  amber: "var(--sf-amber)",
  azure: "var(--sf-azure)",
  emerald: "var(--sf-emerald)",
  magenta: "var(--sf-magenta)",
  stellar: "var(--sf-stellar)",
  violet: "var(--sf-violet)",
  teal: "var(--sf-teal)",
  crimson: "var(--sf-crimson)",
  primary: "var(--sf-primary)",
  none: "var(--sf-line-interactive)",
};

export const HUE_NAMES: Record<LabelHue, string> = {
  amber: "Amber",
  azure: "Azure",
  emerald: "Emerald",
  magenta: "Magenta",
  stellar: "Stellar",
  violet: "Violet",
  teal: "Teal",
  crimson: "Crimson",
};

export function statusName(status: DocStatus | ""): string {
  return status ? STATUS_LABELS[status] : "No status";
}

/** Minutes to read at 250 words a minute; never under one. */
export function readMinutes(words: number): number {
  return Math.max(1, Math.ceil(Math.max(0, words) / 250));
}

export function readTimeLabel(words: number): string {
  const m = readMinutes(words);
  if (m < 60) return `${m} MIN READ`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} H ${rest} MIN READ` : `${h} H READ`;
}

/** Characters as a writer counts them: the visible text, spaces included. */
export function countCharacters(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n+$/g, "");
  // Paragraph breaks are not characters the writer typed into a count.
  return Array.from(text.replace(/\n/g, "")).length;
}

/** "Part one / Dayside" for a document, or "" at the top level. */
export function folderPath(
  docId: string | undefined,
  entries: { id: string; title: string | null; parent_id: string | null; entry_type: string }[],
): string[] {
  if (!docId) return [];
  const byId = new Map(entries.map((e) => [e.id, e]));
  const out: string[] = [];
  const seen = new Set<string>();
  let cur = byId.get(docId)?.parent_id ?? null;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const f = byId.get(cur);
    if (!f || f.entry_type !== "folder") break;
    out.unshift(f.title || "Untitled folder");
    cur = f.parent_id;
  }
  return out;
}
