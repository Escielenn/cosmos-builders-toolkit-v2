// ---------------------------------------------------------------------------
// codex-entity — the pure half of the Codex entity page (Brief F1).
//
// An entity's page IS its wiki article (13-THE-LIFT.md §1). The infobox on
// that page is GENERATED from facts and never hand-edited: every row is a
// value some instrument recorded about this entity, and every row says which
// instrument. This module derives those rows from the worksheets attached to
// the entity through entity_worksheets, using the same extractWorksheetFacts
// projection the Studio's Check tab and Refs rail already read — one
// projection, several surfaces (Law: no Parallel Truth).
//
// Pure by design: no React, no network. The hook feeds it rows; the
// component renders what comes back.
// ---------------------------------------------------------------------------

import { extractWorksheetFacts, type WorksheetFact } from "@/lib/worksheet-facts";

/** One worksheet attached to an entity, as read from entity_worksheets. */
export interface AttachedWorksheet {
  worksheetId: string;
  worksheetTitle: string | null;
  toolType: string;
  /** entity_worksheets.is_primary — the instrument whose value wins a tie. */
  isPrimary: boolean;
  data: unknown;
  updatedAt?: string | null;
}

/** Where a value came from — enough to click through to the producer. */
export interface FactSource {
  worksheetId: string;
  worksheetTitle: string | null;
  toolType: string;
}

/** One infobox row. `conflicts` is non-empty when two instruments disagree. */
export interface InfoboxRow {
  key: string;
  label: string;
  value: string;
  source: FactSource;
  /** Other instruments' differing values for the same key. Surfaced, never hidden. */
  conflicts: Array<{ value: string; source: FactSource }>;
}

/**
 * Build the generated infobox for one entity.
 *
 * Precedence for a key recorded by several worksheets: the primary link
 * first, then the most recently updated. Every other differing value is kept
 * as a conflict on the row — a writer who sees two numbers can fix the one
 * that is wrong; a writer who sees one number silently chosen for them
 * cannot. Identical values from several instruments collapse to one row.
 */
export function buildFactInfobox(attached: readonly AttachedWorksheet[], entityId: string): InfoboxRow[] {
  const ordered = [...attached].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return tb - ta;
  });

  const rows = new Map<string, InfoboxRow>();
  for (const ws of ordered) {
    let facts: WorksheetFact[];
    try {
      facts = extractWorksheetFacts(ws.toolType, ws.data, entityId);
    } catch {
      continue; // a malformed blob must not take the whole infobox down
    }
    const source: FactSource = { worksheetId: ws.worksheetId, worksheetTitle: ws.worksheetTitle, toolType: ws.toolType };
    for (const f of facts) {
      const existing = rows.get(f.key);
      if (!existing) {
        rows.set(f.key, { key: f.key, label: f.label, value: f.value, source, conflicts: [] });
        continue;
      }
      if (existing.value === f.value) continue;
      if (existing.conflicts.some((c) => c.value === f.value && c.source.worksheetId === source.worksheetId)) continue;
      existing.conflicts.push({ value: f.value, source });
    }
  }
  return Array.from(rows.values());
}

/** Aliases live in metadata.aliases as string[]; tolerate junk. */
export function entityAliases(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object") return [];
  const raw = (metadata as Record<string, unknown>).aliases;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

/** Parse the alias field the header edits: comma- or newline-separated. */
export function parseAliases(text: string): string[] {
  return entityAliases({ aliases: text.split(/[,\n]/) });
}

export interface EpochRange {
  from: string | null;
  to: string | null;
}

/**
 * Epoch range lives in metadata.epoch_from / metadata.epoch_to as free-text
 * dates in the world's own calendar (the Chronicle owns the calendar; this
 * page does not parse it). Null means "always" on that end.
 */
export function entityEpochRange(metadata: unknown): EpochRange {
  if (!metadata || typeof metadata !== "object") return { from: null, to: null };
  const m = metadata as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return { from: s(m.epoch_from), to: s(m.epoch_to) };
}

/** Ship's-voice rendering of an epoch range for the header. */
export function formatEpochRange(r: EpochRange): string | null {
  if (!r.from && !r.to) return null;
  if (r.from && r.to) return `${r.from} — ${r.to}`;
  if (r.from) return `FROM ${r.from}`;
  return `UNTIL ${r.to}`;
}
