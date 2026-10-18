// ---------------------------------------------------------------------------
// writing-collections, Scrivener-style saved collections for one world.
//
// A collection is either a saved SEARCH (re-run live, so it stays current as
// the manuscript changes) or a MANUAL set of documents. Stored beside the
// label set at worlds.settings.writingCollections; membership is resolved at
// read time, so a trashed document simply drops out.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { matchingDocIds, type SearchableDoc } from "@/lib/binder-search";
import { readSettingsKey, writeSettingsKey } from "@/lib/world-settings";

export const COLLECTIONS_KEY = "writingCollections";
export const MAX_COLLECTIONS = 40;
export const MAX_COLLECTION_NAME = 60;
const MAX_QUERY = 200;
const MAX_DOC_IDS = 2000;

export interface SearchCollection {
  id: string;
  name: string;
  kind: "search";
  query: string;
  regex: boolean;
  caseSensitive: boolean;
}

export interface ManualCollection {
  id: string;
  name: string;
  kind: "manual";
  docIds: string[];
}

export type WritingCollection = SearchCollection | ManualCollection;

/** Validate a collection list from untyped JSON. Never throws. */
export function sanitizeCollections(raw: unknown): WritingCollection[] {
  if (!Array.isArray(raw)) return [];
  const out: WritingCollection[] = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim().slice(0, MAX_COLLECTION_NAME) : "";
    if (!id || !name || ids.has(id)) continue;
    if (r.kind === "search") {
      const query = typeof r.query === "string" ? r.query.slice(0, MAX_QUERY) : "";
      if (!query.trim()) continue;
      out.push({ id, name, kind: "search", query, regex: r.regex === true, caseSensitive: r.caseSensitive === true });
    } else if (r.kind === "manual") {
      const docIds = Array.isArray(r.docIds)
        ? [...new Set(r.docIds.filter((d): d is string => typeof d === "string" && d.length > 0))].slice(0, MAX_DOC_IDS)
        : [];
      out.push({ id, name, kind: "manual", docIds });
    } else {
      continue;
    }
    ids.add(id);
    if (out.length >= MAX_COLLECTIONS) break;
  }
  return out;
}

export function readCollections(settings: unknown): WritingCollection[] {
  return sanitizeCollections(readSettingsKey(settings, COLLECTIONS_KEY));
}

export function writeCollections(settings: unknown, list: WritingCollection[]): Record<string, unknown> {
  return writeSettingsKey(settings, COLLECTIONS_KEY, sanitizeCollections(list));
}

export function newCollectionId(): string {
  return `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * The documents in a collection, in the order of `readingOrder` (pass the
 * binder's reading order). Manual collections keep only documents that still
 * exist; search collections re-run their query.
 */
export function collectionDocs<T extends SearchableDoc>(c: WritingCollection, readingOrder: T[]): T[] {
  if (c.kind === "manual") {
    const want = new Set(c.docIds);
    return readingOrder.filter((d) => want.has(d.id));
  }
  const hit = new Set(matchingDocIds(readingOrder, c.query, { regex: c.regex, caseSensitive: c.caseSensitive }));
  return readingOrder.filter((d) => hit.has(d.id));
}
