// ---------------------------------------------------------------------------
// fact-ref, the cited fact: a value in the prose that remembers its source.
//
// Inserting "1.4 g" from the Refs tab used to drop three characters of plain
// text into the manuscript and forget where they came from. If Genesis later
// said 1.6 g, nothing on the page knew. A fact ref is an inline atom that
// carries its provenance (Law II) and the value AS INSERTED, so the Studio can
// say "WAS 1.4 g · NOW 1.6 g" without ever touching the sentence itself.
//
// The stored value is the prose. It changes only when the writer clicks
// UPDATE THIS MENTION on that one ref, which is the writer editing their own
// text, not the Studio rewriting it.
//
// Stored in HTML as:
//   <fact-ref data-fact-key="surfaceGravity" data-value="1.4 g"
//     data-tool="planetary-profile" data-source-kind="worksheet"
//     data-worksheet-id="uuid" data-entity-id="uuid"
//     data-label="Surface Gravity (g)">1.4 g</fact-ref>
//
// Every exporter that strips tags therefore already prints "1.4 g";
// flattenFactRefs makes that a guarantee rather than an accident.
//
// Pure: no React, no network, no DOM (regex over attribute strings), tested.
// ---------------------------------------------------------------------------

export const FACT_REF_TAG = "fact-ref";

/** Where a cited value lives, which decides how OPEN SOURCE gets there. */
export type FactSourceKind = "worksheet" | "simulation" | "entity" | "chronicle";

const SOURCE_KINDS: readonly FactSourceKind[] = ["worksheet", "simulation", "entity", "chronicle"];

export interface FactRefAttrs {
  /** The fact's key in its source, e.g. "surfaceGravity". */
  factKey: string;
  /** The value as inserted. This is what the prose says. */
  value: string;
  /** Tool slug, simulator type, "codex" or "chronicle". */
  tool: string;
  /**
   * Id of the source record: a worksheet, a simulation save or a chronicle
   * event/branch. Null for a value read off a Codex entity's own infobox.
   */
  worksheetId: string | null;
  sourceKind: FactSourceKind;
  /** The world_entries id the fact is about, when known. */
  entityId: string | null;
  /** Human label, e.g. "Surface Gravity (g)". */
  label: string;
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * A stable id for "this fact in this source". Two refs to the same fact share
 * it, and the live world index is keyed by it, so staleness is one lookup.
 */
export function factRefId(
  a: Pick<FactRefAttrs, "sourceKind" | "worksheetId" | "entityId" | "factKey">,
): string {
  return `${a.sourceKind}:${a.worksheetId ?? a.entityId ?? ""}:${a.factKey}`;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function idOrNull(v: unknown): string | null {
  const s = str(v).trim();
  return s && s !== "null" && s !== "undefined" ? s : null;
}

/** Tolerant reader: whatever is in the attributes, a well-formed ref comes out. */
export function sanitizeFactRefAttrs(raw: Partial<Record<keyof FactRefAttrs, unknown>>): FactRefAttrs {
  const kind = str(raw.sourceKind) as FactSourceKind;
  return {
    factKey: str(raw.factKey),
    value: str(raw.value),
    tool: str(raw.tool),
    worksheetId: idOrNull(raw.worksheetId),
    sourceKind: SOURCE_KINDS.includes(kind) ? kind : "worksheet",
    entityId: idOrNull(raw.entityId),
    label: str(raw.label),
  };
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

/** attribute name ↔ field. Order is the order they serialise in. */
export const FACT_REF_DOM_ATTRS: ReadonlyArray<[keyof FactRefAttrs, string]> = [
  ["factKey", "data-fact-key"],
  ["value", "data-value"],
  ["tool", "data-tool"],
  ["sourceKind", "data-source-kind"],
  ["worksheetId", "data-worksheet-id"],
  ["entityId", "data-entity-id"],
  ["label", "data-label"],
];

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function unescapeHtml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** One ref as HTML, exactly the shape the editor writes. */
export function factRefToHtml(a: FactRefAttrs): string {
  const attrs = FACT_REF_DOM_ATTRS.flatMap(([field, attr]) => {
    const v = a[field];
    return v === null || v === "" ? [] : [`${attr}="${escapeHtml(String(v))}"`];
  }).join(" ");
  return `<${FACT_REF_TAG} ${attrs}>${escapeHtml(a.value)}</${FACT_REF_TAG}>`;
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

function attrsFromRecord(rec: Record<string, string>, inner: string): FactRefAttrs {
  const raw: Partial<Record<keyof FactRefAttrs, unknown>> = {};
  for (const [field, attr] of FACT_REF_DOM_ATTRS) raw[field] = rec[attr];
  // A ref written without data-value still has its text: use it.
  if (!raw.value) raw.value = unescapeHtml(inner.replace(/<[^>]+>/g, ""));
  return sanitizeFactRefAttrs(raw);
}

// <fact-ref ...>inner</fact-ref>, or self-closing.
const REF_RE = new RegExp(
  `<${FACT_REF_TAG}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/${FACT_REF_TAG}>)`,
  "gi",
);

/** Every fact ref in a document, in order. */
export function extractFactRefs(html: string | null | undefined): FactRefAttrs[] {
  if (!html || !html.includes(FACT_REF_TAG)) return [];
  const out: FactRefAttrs[] = [];
  REF_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REF_RE.exec(html)) !== null) {
    out.push(attrsFromRecord(readAttrs(m[1] ?? ""), m[2] ?? ""));
  }
  return out;
}

/**
 * Replace every fact ref with the plain text of its STORED value.
 *
 * The compile and export paths call this first, so a manuscript always prints
 * what the writer inserted (or chose to update), never the live tool value
 * and never markup. Old documents have no refs and pass through untouched.
 */
export function flattenFactRefs(html: string): string {
  if (!html || !html.includes(FACT_REF_TAG)) return html;
  return html.replace(REF_RE, (_all, attrText: string, inner: string | undefined) =>
    escapeHtml(attrsFromRecord(readAttrs(attrText ?? ""), inner ?? "").value),
  );
}

// ---------------------------------------------------------------------------
// Staleness
// ---------------------------------------------------------------------------

export type FactRefStatus =
  | { state: "current"; now: string }
  | { state: "stale"; was: string; now: string }
  /** The source no longer records this fact (deleted, emptied, renamed). */
  | { state: "missing"; was: string };

/** Comparison ignores whitespace noise, nothing else (case is meaning). */
export function normalizeFactValue(v: string): string {
  return v.trim().replace(/\s+/g, " ");
}

/**
 * Compare a ref's stored value with what its source records now.
 *
 * `live` is the fact's CURRENT insert text (what the Refs tab would insert
 * today), so a ref is stale exactly when inserting it again would write
 * something different.
 */
export function factRefStatus(
  attrs: Pick<FactRefAttrs, "value">,
  live: { insert: string } | null | undefined,
): FactRefStatus {
  if (!live) return { state: "missing", was: attrs.value };
  if (normalizeFactValue(live.insert) === normalizeFactValue(attrs.value)) {
    return { state: "current", now: live.insert };
  }
  return { state: "stale", was: attrs.value, now: live.insert };
}

/** "WAS 1.4 g · NOW 1.6 g", the line the hover card shows. */
export function staleLine(status: FactRefStatus): string {
  if (status.state === "stale") return `WAS ${status.was} · NOW ${status.now}`;
  if (status.state === "missing") return `WAS ${status.was} · NO LONGER ON FILE`;
  return "";
}
