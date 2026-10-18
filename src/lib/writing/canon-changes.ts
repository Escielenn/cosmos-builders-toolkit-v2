// ---------------------------------------------------------------------------
// canon-changes, what moved under a document since it was written.
//
// Studio charter 2.5 (canon-changed badges). A document cites the world in two
// ways: fact refs (a value plus its source) and @mentions (an entity id plus
// the name as written). Either can fall behind the world: the source records a
// different value now, or the entity was renamed in the Codex. Each chip
// already shows that one at a time; this module answers it for a whole
// document so the binder can badge it and the Studio can count it.
//
// It reads; it never writes. The prose stays exactly as the writer left it.
//
// Pure: no React, no network, no DOM (regex over attribute strings), tested.
// ---------------------------------------------------------------------------

import type { BinderEntry, BinderNode } from "@/lib/binder-tree";
import { effectiveParents } from "@/lib/binder-tree";
import {
  FACT_REF_TAG,
  extractFactRefs,
  factRefId,
  factRefStatus,
  normalizeFactValue,
  unescapeHtml,
} from "@/lib/writing/fact-ref";

export const ENTITY_MENTION_TAG = "entity-mention";

/** The live world, as much of it as a scan needs. */
export interface CanonIndex {
  /** factRefId → the fact's current insert text. */
  facts: ReadonlyMap<string, { insert: string }>;
  /** entity id → its current name. */
  entityNames: ReadonlyMap<string, string>;
}

export interface StaleFact {
  /** factRefId of the cited fact. */
  ref: string;
  label: string;
  /** The value as written in the prose. */
  was: string;
  /** The source's value now, or null when the source no longer records it. */
  now: string | null;
  state: "stale" | "missing";
}

export interface RenamedMention {
  entityId: string;
  /** The name as written in the prose. */
  was: string;
  /** The entity's name in the Codex now. */
  now: string;
}

export interface CanonChanges {
  staleFacts: StaleFact[];
  renamedMentions: RenamedMention[];
}

export const NO_CANON_CHANGES: CanonChanges = Object.freeze({
  staleFacts: [],
  renamedMentions: [],
}) as CanonChanges;

// ---------------------------------------------------------------------------
// Mentions
// ---------------------------------------------------------------------------

export interface MentionAttrs {
  id: string | null;
  /** The name as written. */
  label: string;
  /**
   * The Codex name the writer chose to keep the written name against (IGNORE).
   * The mention stops counting as renamed while the entity still has this
   * name; a further rename flags it again.
   */
  ackLabel: string | null;
}

const ATTR_RE = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function readAttrs(attrText: string): Record<string, string> {
  const out: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrText)) !== null) {
    out[m[1].toLowerCase()] = unescapeHtml(m[2] ?? m[3] ?? "");
  }
  return out;
}

const MENTION_RE = new RegExp(
  `<${ENTITY_MENTION_TAG}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/${ENTITY_MENTION_TAG}>)`,
  "gi",
);

function nonEmpty(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  return s && s !== "null" && s !== "undefined" ? s : null;
}

/** Every @mention in a document, in order. */
export function extractMentions(html: string | null | undefined): MentionAttrs[] {
  if (!html || !html.includes(ENTITY_MENTION_TAG)) return [];
  const out: MentionAttrs[] = [];
  MENTION_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MENTION_RE.exec(html)) !== null) {
    const rec = readAttrs(m[1] ?? "");
    const label = rec["data-label"] ?? unescapeHtml((m[2] ?? "").replace(/<[^>]+>/g, ""));
    out.push({ id: nonEmpty(rec["data-id"]), label, ackLabel: nonEmpty(rec["data-ack-label"]) });
  }
  return out;
}

/**
 * Is this mention behind the Codex? Null when it is current, unknown (no id,
 * or the entity is gone: that is a missing entity, not a rename) or
 * acknowledged against the entity's current name.
 */
export function mentionRename(
  m: Pick<MentionAttrs, "id" | "label" | "ackLabel">,
  entityNames: ReadonlyMap<string, string>,
): RenamedMention | null {
  if (!m.id) return null;
  const now = entityNames.get(m.id);
  if (now === undefined || !now.trim()) return null;
  if (normalizeFactValue(now) === normalizeFactValue(m.label)) return null;
  if (m.ackLabel !== null && normalizeFactValue(m.ackLabel) === normalizeFactValue(now)) return null;
  return { entityId: m.id, was: m.label, now };
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

/** Cheap pre-check: only documents that cite anything are worth a scan. */
export function mayCiteCanon(html: string | null | undefined): boolean {
  return !!html && (html.includes(`<${FACT_REF_TAG}`) || html.includes(`<${ENTITY_MENTION_TAG}`));
}

/** Everything in one document that the world has moved past. */
export function scanCanonChanges(html: string | null | undefined, index: CanonIndex): CanonChanges {
  if (!mayCiteCanon(html)) return NO_CANON_CHANGES;
  const staleFacts: StaleFact[] = [];
  for (const a of extractFactRefs(html)) {
    const ref = factRefId(a);
    const status = factRefStatus(a, index.facts.get(ref));
    if (status.state === "stale") {
      staleFacts.push({ ref, label: a.label, was: status.was, now: status.now, state: "stale" });
    } else if (status.state === "missing") {
      staleFacts.push({ ref, label: a.label, was: status.was, now: null, state: "missing" });
    }
  }
  const renamedMentions: RenamedMention[] = [];
  for (const m of extractMentions(html)) {
    const r = mentionRename(m, index.entityNames);
    if (r) renamedMentions.push(r);
  }
  if (staleFacts.length === 0 && renamedMentions.length === 0) return NO_CANON_CHANGES;
  return { staleFacts, renamedMentions };
}

// ---------------------------------------------------------------------------
// Counts, roll-up, filter
// ---------------------------------------------------------------------------

export interface CanonCount {
  facts: number;
  names: number;
}

export function countOf(c: CanonChanges): CanonCount {
  return { facts: c.staleFacts.length, names: c.renamedMentions.length };
}

export function canonTotal(c: CanonCount): number {
  return c.facts + c.names;
}

/** "3 CITED VALUES CHANGED · 1 NAME CHANGED". Ship's Voice. */
export function canonCountLine(c: CanonCount): string {
  const parts: string[] = [];
  if (c.facts > 0) parts.push(`${c.facts} CITED ${c.facts === 1 ? "VALUE" : "VALUES"} CHANGED`);
  if (c.names > 0) parts.push(`${c.names} ${c.names === 1 ? "NAME" : "NAMES"} CHANGED`);
  return parts.join(" · ");
}

/** "PARAMETER REVISED. 4 DOCUMENTS AFFECTED." */
export function canonSummaryLine(documents: number): string {
  return `PARAMETER REVISED. ${documents} ${documents === 1 ? "DOCUMENT" : "DOCUMENTS"} AFFECTED.`;
}

/**
 * Per-document counts plus every folder's sum of everything beneath it, so a
 * collapsed folder still says something under it moved.
 */
export function rollUpCanonCounts<T extends BinderEntry>(
  entries: T[],
  byDoc: ReadonlyMap<string, CanonCount>,
): Map<string, CanonCount> {
  const out = new Map<string, CanonCount>();
  if (byDoc.size === 0) return out;
  const parent = effectiveParents(entries);
  for (const [id, c] of byDoc) {
    if (canonTotal(c) === 0) continue;
    out.set(id, { ...c });
    let cur = parent.get(id) ?? null;
    const seen = new Set<string>([id]);
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const prev = out.get(cur) ?? { facts: 0, names: 0 };
      out.set(cur, { facts: prev.facts + c.facts, names: prev.names + c.names });
      cur = parent.get(cur) ?? null;
    }
  }
  return out;
}

/**
 * The binder cut down to the given documents and the folders that lead to
 * them. Order and nesting are kept. Empty folders are dropped.
 */
export function pruneTree<T extends BinderEntry>(
  tree: BinderNode<T>[],
  keep: ReadonlySet<string>,
): BinderNode<T>[] {
  const out: BinderNode<T>[] = [];
  for (const n of tree) {
    if (n.isFolder) {
      const children = pruneTree(n.children, keep);
      if (children.length > 0) out.push({ ...n, children });
    } else if (keep.has(n.entry.id)) {
      out.push(n);
    }
  }
  return out;
}
