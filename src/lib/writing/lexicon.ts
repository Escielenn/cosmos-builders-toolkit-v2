// ---------------------------------------------------------------------------
// lexicon, the world's own dictionary.
//
// A spelling checker that does not know the world flags every name the writer
// invented. This builds the accepted-word list from what the world already
// holds (Codex names and aliases, entity-type names, canon terms, Chronicle
// event names, POV names) plus the writer's own terms, so the assistant never
// argues with canon.
//
//   names   whole names with where they came from (fuzzy matching, "Did you
//           mean", the lexicon manager's counts)
//   words   single tokens handed to the checker's dictionary
//   accepts O(1) check used to drop a spelling flag the dictionary still
//           raised (possessives, apostrophe forms)
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

export const LEXICON_KEY = "writingLexicon";
export const MAX_CUSTOM_TERMS = 1000;
export const MAX_ALIASES = 20;
export const MAX_TERM_LENGTH = 100;
export const MAX_NOTE_LENGTH = 1000;

/** A term the writer added by hand. Stored per world. */
export interface CustomTerm {
  term: string;
  /** Definition or usage note. Reference only; never sent to the checker. */
  note: string;
  aliases: string[];
}

export type LexiconSource = "codex" | "alias" | "type" | "canon" | "chronicle" | "pov" | "custom";

export interface LexiconName {
  name: string;
  source: LexiconSource;
  /** world_entries id, when the name belongs to a Codex entity. */
  entityId?: string;
}

export interface LexiconEntity {
  id: string;
  name: string;
  aliases?: readonly string[];
  /** A custom type's own label ("Vaultborn clan"). */
  typeLabel?: string | null;
}

export interface WorldLexiconInput {
  entities: readonly LexiconEntity[];
  /** Entity-type template labels the world defines. */
  typeLabels?: readonly string[];
  /** Short strings asserted as facts (text and enum values). */
  canonStrings?: readonly string[];
  /** Chronicle event titles. */
  eventTitles?: readonly string[];
  /** Names typed or picked as a document's POV. */
  povNames?: readonly string[];
  custom?: readonly CustomTerm[];
}

export interface WorldLexicon {
  names: LexiconName[];
  /** Unique tokens for the checker's dictionary, sorted. */
  words: string[];
  /** Changes exactly when `words` changes. */
  signature: string;
  accepts(word: string): boolean;
  counts: Record<LexiconSource, number>;
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const APOSTROPHES = /[‘’ʼ]/g;
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;
const HAS_LETTER = /\p{L}/u;
const POSSESSIVE = /(?:'s|s'|')$/i;

/** Curly and modifier apostrophes read as the plain one. */
export function normalizeApostrophes(s: string): string {
  return s.replace(APOSTROPHES, "'");
}

/** "Kellis's" -> "Kellis"; "Vaultborns'" -> "Vaultborns". */
export function stripPossessive(word: string): { stem: string; suffix: string } {
  const w = normalizeApostrophes(word);
  const m = POSSESSIVE.exec(w);
  if (!m || m.index === 0) return { stem: word, suffix: "" };
  // "s'" keeps its s: the possessive of a plural.
  if (m[0].toLowerCase() === "s'") return { stem: word.slice(0, m.index + 1), suffix: word.slice(m.index + 1) };
  return { stem: word.slice(0, m.index), suffix: word.slice(m.index) };
}

/**
 * The dictionary words in a name: "K'thar Vault-born" gives K'thar, thar,
 * Vault-born, Vault, born. Parts are included because the checker may split a
 * word at an apostrophe or hyphen and flag the half it does not know.
 */
export function lexiconWords(name: string): string[] {
  const out: string[] = [];
  const push = (w: string) => {
    const t = w.replace(/^['-]+|['-]+$/g, "");
    if (t.length < 2 || t.length > MAX_TERM_LENGTH || !HAS_LETTER.test(t)) return;
    if (!out.includes(t)) out.push(t);
  };
  for (const m of normalizeApostrophes(name).matchAll(WORD_RE)) {
    const whole = m[0];
    push(whole);
    if (/['-]/.test(whole)) for (const part of whole.split(/['-]/)) push(part);
  }
  return out;
}

/**
 * The invented-looking terms in a canon string. A short value ("Kellis
 * Prime", "Vaultborn") is taken whole; in a sentence only capitalised words
 * that do not open it are, since the first word is capitalised by grammar.
 */
export function canonTerms(value: string): string[] {
  const text = value.trim();
  if (!text || text.length > 400) return [];
  const words = [...normalizeApostrophes(text).matchAll(WORD_RE)].map((m) => ({ w: m[0], at: m.index ?? 0 }));
  if (words.length === 0) return [];
  if (words.length <= 4) return words.filter((x) => /^\p{Lu}/u.test(x.w)).map((x) => x.w);
  const out: string[] = [];
  for (const { w, at } of words) {
    if (!/^\p{Lu}/u.test(w)) continue;
    const before = text.slice(0, at).trimEnd();
    if (before === "" || /[.!?:;]$/.test(before)) continue;
    out.push(w);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The writer's own terms
// ---------------------------------------------------------------------------

function cleanTerm(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function sanitizeAliases(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[,\n]/) : [];
  const out: string[] = [];
  for (const v of list) {
    const t = cleanTerm(v, MAX_TERM_LENGTH);
    if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
    if (out.length >= MAX_ALIASES) break;
  }
  return out;
}

/** Stored value -> a valid list. Junk, duplicates and overflow are dropped. */
export function sanitizeLexicon(raw: unknown): CustomTerm[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomTerm[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const term = cleanTerm(r.term, MAX_TERM_LENGTH);
    if (!term || !HAS_LETTER.test(term)) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      term,
      note: typeof r.note === "string" ? r.note.trim().slice(0, MAX_NOTE_LENGTH) : "",
      aliases: sanitizeAliases(r.aliases).filter((a) => a.toLowerCase() !== key),
    });
    if (out.length >= MAX_CUSTOM_TERMS) break;
  }
  return out;
}

export type LexiconRefusal = "empty" | "duplicate" | "full";

/** `list` is the new list when ok, the list unchanged when refused. */
export interface LexiconEdit {
  ok: boolean;
  list: CustomTerm[];
  reason?: LexiconRefusal;
}

/**
 * Add a term, or replace the one at `editIndex`. Ship's Voice for each
 * refusal is the caller's; this only names the reason.
 */
export function upsertCustomTerm(
  list: readonly CustomTerm[],
  input: { term: string; note?: string; aliases?: unknown },
  editIndex: number | null = null,
): LexiconEdit {
  const term = cleanTerm(stripPossessive(input.term).stem, MAX_TERM_LENGTH);
  const refuse = (reason: LexiconRefusal): LexiconEdit => ({ ok: false, list: [...list], reason });
  if (!term || !HAS_LETTER.test(term)) return refuse("empty");
  const key = term.toLowerCase();
  if (list.some((e, i) => i !== editIndex && e.term.toLowerCase() === key)) return refuse("duplicate");
  if (editIndex === null && list.length >= MAX_CUSTOM_TERMS) return refuse("full");
  const entry: CustomTerm = {
    term,
    note: (input.note ?? "").trim().slice(0, MAX_NOTE_LENGTH),
    aliases: sanitizeAliases(input.aliases).filter((a) => a.toLowerCase() !== key),
  };
  const next =
    editIndex !== null && editIndex >= 0 && editIndex < list.length
      ? list.map((e, i) => (i === editIndex ? entry : e))
      : [...list, entry];
  return { ok: true, list: next };
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function buildWorldLexicon(input: WorldLexiconInput): WorldLexicon {
  const names: LexiconName[] = [];
  const seen = new Set<string>();
  const counts: Record<LexiconSource, number> = {
    codex: 0, alias: 0, type: 0, canon: 0, chronicle: 0, pov: 0, custom: 0,
  };
  const add = (raw: string | null | undefined, source: LexiconSource, entityId?: string) => {
    const name = cleanTerm(raw, MAX_TERM_LENGTH);
    if (!name || !HAS_LETTER.test(name)) return;
    // A Codex name outranks the same string from a weaker source.
    const key = `${name}\u0000${entityId ?? ""}`;
    if (seen.has(key) || (!entityId && seen.has(`${name}\u0000*`))) return;
    seen.add(key);
    seen.add(`${name}\u0000*`);
    names.push(entityId ? { name, source, entityId } : { name, source });
    counts[source] += 1;
  };

  for (const e of input.entities) {
    add(e.name, "codex", e.id);
    for (const a of e.aliases ?? []) add(a, "alias", e.id);
  }
  for (const e of input.entities) if (e.typeLabel) add(e.typeLabel, "type");
  for (const t of input.typeLabels ?? []) add(t, "type");
  for (const p of input.povNames ?? []) add(p, "pov");
  for (const t of input.eventTitles ?? []) add(t, "chronicle");
  for (const c of input.custom ?? []) {
    add(c.term, "custom");
    for (const a of c.aliases) add(a, "custom");
  }
  for (const s of input.canonStrings ?? []) for (const t of canonTerms(s)) add(t, "canon");

  const wordSet = new Set<string>();
  for (const n of names) for (const w of lexiconWords(n.name)) wordSet.add(w);
  const words = [...wordSet].sort();
  const lower = new Set(words.map((w) => w.toLowerCase()));

  const accepts = (word: string): boolean => {
    const w = normalizeApostrophes(word).replace(/^['-]+|['-]+$/g, "");
    if (!w) return false;
    if (wordSet.has(w)) return true;
    const { stem, suffix } = stripPossessive(w);
    if (suffix && wordSet.has(stem)) return true;
    // ALL CAPS and sentence-case forms of a known word are the same word.
    // A lower-case form of a capitalised name is NOT accepted: that is the
    // case slip "Did you mean" exists for.
    const bare = suffix ? stem : w;
    if (bare === bare.toUpperCase() && bare !== bare.toLowerCase() && lower.has(bare.toLowerCase())) return true;
    if (/^\p{Lu}/u.test(bare) && wordSet.has(bare[0].toLowerCase() + bare.slice(1))) return true;
    return false;
  };

  return { names, words, signature: `${words.length}:${hash(words.join("\n"))}`, accepts, counts };
}

/** FNV-1a, enough to tell two word lists apart. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
