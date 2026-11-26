// ---------------------------------------------------------------------------
// protocol, the messages between the page and the checker's worker.
// Types only, shared by both sides. Text goes page -> worker and nowhere
// else: the worker has no network code of its own.
// ---------------------------------------------------------------------------

/** harper.js Dialect values (American = 0 ... Indian = 4). */
export const DIALECTS = ["American", "British", "Australian", "Canadian", "Indian"] as const;

/** harper.js SuggestionKind. */
export const SUGGEST_REPLACE = 0;
export const SUGGEST_REMOVE = 1;
export const SUGGEST_INSERT_AFTER = 2;

export interface WireSuggestion {
  text: string;
  kind: number;
}

export interface WireLint {
  /** UTF-16 offsets into the block's text. */
  start: number;
  end: number;
  problem: string;
  message: string;
  kind: string;
  suggestions: WireSuggestion[];
}

export type ToWorker =
  | { type: "configure"; dialect: number; words: string[] }
  | { type: "lint"; id: number; blocks: Array<{ key: number; text: string }>; max: number };

export type FromWorker =
  | { type: "ready" }
  | { type: "result"; id: number; blocks: Array<{ key: number; lints: WireLint[] }>; capped: boolean }
  | { type: "error"; id?: number; fatal: boolean };
