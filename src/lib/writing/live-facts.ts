// ---------------------------------------------------------------------------
// live-facts, the current value of every fact on file, for editor node views.
//
// A Tiptap node view is plain DOM and cannot read React context, but a fact
// ref chip needs to know whether its source has moved on (to show the STALE
// marker). The Studio publishes its memoised world index here; node views
// subscribe. One map swap per index rebuild, never per keystroke.
//
// Also remembers the last focused manuscript editor, so the rail inserts into
// the editor the writer was in (main, split or Scrivenings), not always the
// main one.
// ---------------------------------------------------------------------------

import type { Editor } from "@tiptap/react";
import { factRefId, factRefStatus, type FactRefAttrs, type FactRefStatus } from "@/lib/writing/fact-ref";

interface LiveFact {
  insert: string;
}

let facts: ReadonlyMap<string, LiveFact> = new Map();
let loaded = false;
const listeners = new Set<() => void>();

/** Publish the world's facts (ref → current insert text). */
export function setLiveFacts(next: ReadonlyMap<string, LiveFact>, isLoaded = true): void {
  facts = next;
  loaded = isLoaded;
  for (const fn of listeners) fn();
}

export function clearLiveFacts(): void {
  entityNames = new Map();
  setLiveFacts(new Map(), false);
}

export function subscribeLiveFacts(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Status of one ref against the published index; null until it has loaded. */
export function liveStatus(attrs: FactRefAttrs): FactRefStatus | null {
  if (!loaded) return null;
  return factRefStatus(attrs, facts.get(factRefId(attrs)));
}

// ---------------------------------------------------------------------------
// Entity names, for @mention chips (NAME CHANGED marker)
// ---------------------------------------------------------------------------

let entityNames: ReadonlyMap<string, string> = new Map();

/** Publish the world's entity names (id → current name). Notifies the same listeners. */
export function setLiveEntityNames(next: ReadonlyMap<string, string>): void {
  entityNames = next;
  for (const fn of listeners) fn();
}

/** The published name map; empty until the Studio publishes it. */
export function liveEntityNames(): ReadonlyMap<string, string> {
  return entityNames;
}

// ---------------------------------------------------------------------------
// Active editor
// ---------------------------------------------------------------------------

let active: Editor | null = null;

export function setActiveEditor(ed: Editor | null): void {
  active = ed;
}

/** The manuscript editor the writer was last in, if it still exists. */
export function getActiveEditor(): Editor | null {
  return active && !active.isDestroyed ? active : null;
}

export function forgetEditor(ed: Editor): void {
  if (active === ed) active = null;
}
