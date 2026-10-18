// ---------------------------------------------------------------------------
// world-index, everything the writer made, as one searchable list.
//
// The writing surface reads five stores that never knew about each other:
// worksheets (tool values), simulation saves, Codex entities (infobox
// fields), Chronicle events and branches. Each already had a reader
// (worksheet-facts, simulation-facts, entity master fields, chronicle data);
// this joins their output into one WorldFact shape with provenance and a
// route back to the place the value is edited (Law III).
//
// Consumers: the Refs tab, the in-editor world palette, the fact-ref hover
// card (staleness), mention cards and the rail ranking. All of them read one
// memoised build, so nothing here runs on the typing path.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { extractWorksheetFacts, type WorksheetFact } from "@/lib/worksheet-facts";
import { extractSimulationFacts } from "@/lib/simulation-facts";
import { ENTITY_MASTER_FIELDS, readMasterField } from "@/lib/entity-config";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";
import { getToolAccent, type ToolAccent } from "@/lib/tool-accents";
import { ENTITY_TYPE_LABELS, type Entity } from "@/services/entity-graph-types";
import { factRefId, type FactRefAttrs, type FactSourceKind } from "@/lib/writing/fact-ref";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorldFact {
  /** factRefId: the key fact refs and the live index share. */
  ref: string;
  factKey: string;
  label: string;
  /** Display value. */
  value: string;
  /** What goes into the prose: the value with its unit, or a proper noun. */
  insert: string;
  tool: string;
  /** Brand name of the producing tool, "Genesis", "Dossier", "Codex". */
  toolLabel: string;
  sourceKind: FactSourceKind;
  /** worksheet / simulation save / chronicle record id; null for Codex. */
  sourceId: string | null;
  /** The source's own title, "Kellis Prime". */
  sourceTitle: string;
  /** The world_entries id the fact is about, when known. */
  entityId: string | null;
  /** Where the writer goes to change it. */
  href: string | null;
  accent: ToolAccent;
  /** The fact's own provenance line, when its reader supplied one. */
  provenance?: string;
}

export interface IndexWorksheet {
  id: string;
  tool_type: string;
  title: string | null;
  data: unknown;
}

export interface IndexSimulation {
  id: string;
  simulator_type: string;
  name: string;
  data: unknown;
}

export interface IndexEvent {
  id: string;
  title: string;
  eventDate: string;
  description?: string | null;
  branchId?: string | null;
  linkedEntryId?: string | null;
  children?: IndexEvent[];
}

export interface IndexBranch {
  id: string;
  name: string;
  description?: string | null;
}

export interface WorldIndexInput {
  worldId: string;
  worksheets: readonly IndexWorksheet[];
  simulations: readonly IndexSimulation[];
  /** worksheet id → the entity it is about (entity_worksheets). */
  subjects: Readonly<Record<string, string | undefined>>;
  entities: readonly Entity[];
  events?: readonly IndexEvent[];
  branches?: readonly IndexBranch[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "Genesis: Planetary Profile" → "Genesis". */
export function toolBrand(tool: string): string {
  if (tool === "codex") return "Codex";
  if (tool === "chronicle") return "Chronicle";
  const full = getToolDisplayName(tool);
  const i = full.indexOf(":");
  return i > 0 ? full.slice(0, i) : full;
}

const PLAIN_NUMBER = /^-?\d[\d,]*(?:\.\d+)?(?:e[+-]?\d+)?$/i;

/**
 * The unit a label carries in parentheses, attached to a bare number:
 * ("Surface Gravity (g)", "1.4") → "1.4 g". A value that already reads as
 * words, or a label with no unit, is returned unchanged.
 */
export function withUnit(value: string, label: string): string {
  const v = value.trim();
  if (!PLAIN_NUMBER.test(v)) return v;
  const m = label.match(/\(([^()]{1,20})\)\s*$/);
  if (!m) return v;
  const unit = m[1].trim();
  // "(character)" and friends are qualifiers, not units.
  if (!unit || /^(character|optional|if any|est\.?)$/i.test(unit)) return v;
  return `${v} ${unit}`;
}

function worksheetHref(worldId: string, tool: string, id: string): string | null {
  const route = getToolRoute(tool);
  return route ? `${route}?worldId=${worldId}&worksheetId=${id}` : null;
}

function simulationHref(worldId: string, tool: string): string | null {
  const route = getToolRoute(tool);
  return route ? `${route}?worldId=${worldId}` : null;
}

function fromWorksheetFact(
  f: WorksheetFact,
  base: {
    tool: string;
    sourceKind: FactSourceKind;
    sourceId: string;
    sourceTitle: string;
    entityId: string | null;
    href: string | null;
  },
): WorldFact {
  const entityId = f.subject_id ?? base.entityId;
  return {
    ref: factRefId({ sourceKind: base.sourceKind, worksheetId: base.sourceId, entityId, factKey: f.key }),
    factKey: f.key,
    label: f.label,
    value: f.value,
    insert: f.insert ?? withUnit(f.value, f.label),
    tool: base.tool,
    toolLabel: toolBrand(base.tool),
    sourceKind: base.sourceKind,
    sourceId: base.sourceId,
    sourceTitle: base.sourceTitle,
    entityId,
    href: base.href,
    accent: getToolAccent(base.tool),
    ...(f.source ? { provenance: f.source } : {}),
  };
}

/** A Codex entity's own infobox values (metadata), as facts. */
export function entityInfoboxFacts(entity: Entity, worldId: string): WorldFact[] {
  const fields = ENTITY_MASTER_FIELDS[entity.entity_type] ?? [];
  const out: WorldFact[] = [];
  for (const field of fields) {
    if (field.key === "name" || field.key === "description") continue;
    const raw = readMasterField(entity.metadata, field);
    if (raw === undefined || raw === null || typeof raw === "object") continue;
    const value = String(raw).trim();
    if (!value) continue;
    out.push({
      ref: factRefId({ sourceKind: "entity", worksheetId: null, entityId: entity.id, factKey: field.key }),
      factKey: field.key,
      label: field.label,
      value,
      insert: withUnit(value, field.label),
      tool: "codex",
      toolLabel: "Codex",
      sourceKind: "entity",
      sourceId: null,
      sourceTitle: entity.name,
      entityId: entity.id,
      href: `/worlds/${worldId}/codex/${entity.id}`,
      accent: "teal",
    });
  }
  return out;
}

function flattenEvents(events: readonly IndexEvent[]): IndexEvent[] {
  const out: IndexEvent[] = [];
  const walk = (list: readonly IndexEvent[]) => {
    for (const e of list) {
      out.push(e);
      if (e.children?.length) walk(e.children);
    }
  };
  walk(events);
  return out;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

/**
 * Every fact on file, worksheets first (a value the writer typed outranks
 * one a simulator derived), then simulations, Codex infoboxes, Chronicle.
 * Duplicate refs keep their first occurrence.
 */
export function buildWorldFacts(input: WorldIndexInput): WorldFact[] {
  const { worldId } = input;
  const out: WorldFact[] = [];
  const seen = new Set<string>();
  const push = (f: WorldFact) => {
    if (seen.has(f.ref)) return;
    seen.add(f.ref);
    out.push(f);
  };

  for (const ws of input.worksheets) {
    const subject = input.subjects[ws.id] ?? null;
    const base = {
      tool: ws.tool_type,
      sourceKind: "worksheet" as const,
      sourceId: ws.id,
      sourceTitle: ws.title || getToolDisplayName(ws.tool_type),
      entityId: subject,
      href: worksheetHref(worldId, ws.tool_type, ws.id),
    };
    for (const f of extractWorksheetFacts(ws.tool_type, ws.data, subject)) push(fromWorksheetFact(f, base));
  }

  for (const sim of input.simulations) {
    const base = {
      tool: sim.simulator_type,
      sourceKind: "simulation" as const,
      sourceId: sim.id,
      sourceTitle: sim.name || getToolDisplayName(sim.simulator_type),
      entityId: null,
      href: simulationHref(worldId, sim.simulator_type),
    };
    for (const f of extractSimulationFacts(sim.simulator_type, sim.data)) push(fromWorksheetFact(f, base));
  }

  for (const e of input.entities) for (const f of entityInfoboxFacts(e, worldId)) push(f);

  const branchName = new Map((input.branches ?? []).map((b) => [b.id, b.name]));
  for (const ev of flattenEvents(input.events ?? [])) {
    if (!ev.eventDate?.trim()) continue;
    const branch = ev.branchId ? branchName.get(ev.branchId) : undefined;
    push({
      ref: factRefId({ sourceKind: "chronicle", worksheetId: ev.id, entityId: null, factKey: "event.date" }),
      factKey: "event.date",
      label: ev.title || "Untitled event",
      value: branch ? `${ev.eventDate} · ${branch}` : ev.eventDate,
      insert: ev.eventDate,
      tool: "chronicle",
      toolLabel: "Chronicle",
      sourceKind: "chronicle",
      sourceId: ev.id,
      sourceTitle: ev.title || "Untitled event",
      entityId: ev.linkedEntryId ?? null,
      href: `/worlds/${worldId}/chronicle`,
      accent: getToolAccent("chronicle"),
    });
  }
  for (const b of input.branches ?? []) {
    if (!b.name.trim()) continue;
    push({
      ref: factRefId({ sourceKind: "chronicle", worksheetId: b.id, entityId: null, factKey: "branch.name" }),
      factKey: "branch.name",
      label: "Timeline branch",
      value: b.name,
      insert: b.name,
      tool: "chronicle",
      toolLabel: "Chronicle",
      sourceKind: "chronicle",
      sourceId: b.id,
      sourceTitle: b.name,
      entityId: null,
      href: `/worlds/${worldId}/chronicle`,
      accent: getToolAccent("chronicle"),
    });
  }
  return out;
}

/** Index by ref, for staleness lookups. */
export function indexFacts(facts: readonly WorldFact[]): Map<string, WorldFact> {
  return new Map(facts.map((f) => [f.ref, f]));
}

/** The attributes a fact ref is created with. */
export function factToRefAttrs(f: WorldFact): FactRefAttrs {
  return {
    factKey: f.factKey,
    value: f.insert,
    tool: f.tool,
    worksheetId: f.sourceId,
    sourceKind: f.sourceKind,
    entityId: f.entityId,
    label: f.label,
  };
}

/** "Genesis · Kellis Prime". */
export function sourceLine(f: Pick<WorldFact, "toolLabel" | "sourceTitle">): string {
  return f.toolLabel === f.sourceTitle ? f.toolLabel : `${f.toolLabel} · ${f.sourceTitle}`;
}

/** One line about an entity: summary, else the first sentence of its description. */
export function entityOneLine(e: Pick<Entity, "summary" | "description">): string {
  const summary = (e.summary ?? "").trim();
  if (summary) return summary;
  const text = (e.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const m = text.match(/^(.{1,160}?[.!?])(\s|$)/);
  return m ? m[1] : text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export function entityTypeLabel(e: Pick<Entity, "entity_type" | "custom_type_label">): string {
  return e.custom_type_label || ENTITY_TYPE_LABELS[e.entity_type] || e.entity_type;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Fuzzy match score, 0 = no match. Every query character must appear in
 * order; contiguous runs, word starts and an exact prefix score higher.
 * Cheap enough to run over a few thousand rows per keystroke in the palette.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = text.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 - Math.min(t.length, 200);
  const idx = t.indexOf(q);
  if (idx >= 0) {
    const wordStart = idx === 0 || /[\s\-_./(]/.test(t[idx - 1]);
    return (wordStart ? 600 : 400) - Math.min(idx, 100);
  }
  // Subsequence.
  let score = 0;
  let ti = 0;
  let run = 0;
  let prev = -2;
  for (const ch of q) {
    if (ch === " ") continue;
    let found = -1;
    while (ti < t.length) {
      if (t[ti] === ch) {
        found = ti;
        break;
      }
      ti++;
    }
    if (found < 0) return 0;
    const atWord = found === 0 || /[\s\-_./(]/.test(t[found - 1]);
    run = found === prev + 1 ? run + 1 : 0;
    score += 10 + (atWord ? 15 : 0) + run * 5;
    prev = found;
    ti = found + 1;
  }
  return Math.max(1, Math.min(score, 380));
}

export type PaletteItem =
  | { kind: "fact"; fact: WorldFact; score: number }
  | { kind: "entity"; entity: Entity; score: number };

/**
 * The world palette's results: facts and entities matched against the query,
 * best first. `boost` lets the caller lift what relates to the open scene.
 */
export function searchWorld(
  facts: readonly WorldFact[],
  entities: readonly Entity[],
  query: string,
  opts: { limit?: number; boost?: (item: PaletteItem) => number } = {},
): PaletteItem[] {
  const limit = opts.limit ?? 30;
  const items: PaletteItem[] = [];
  for (const e of entities) {
    const s = Math.max(fuzzyScore(query, e.name), fuzzyScore(query, entityTypeLabel(e)) * 0.4);
    if (s > 0) items.push({ kind: "entity", entity: e, score: s + 5 });
  }
  for (const f of facts) {
    const s = Math.max(
      fuzzyScore(query, f.label),
      fuzzyScore(query, `${f.sourceTitle} ${f.label}`) * 0.9,
      fuzzyScore(query, f.value) * 0.6,
    );
    if (s > 0) items.push({ kind: "fact", fact: f, score: s });
  }
  if (opts.boost) for (const it of items) it.score += opts.boost(it);
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, limit);
}
