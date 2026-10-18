// ---------------------------------------------------------------------------
// capture/detect, claims in a paragraph of prose (Studio Charter §2.2).
//
// Input is a Paragraph: its plain text, where entity mentions sit in it, and
// any spans that must never be read as a claim (a cited fact-ref already IS
// canon; re-reading it would be the system arguing with itself). Output is a
// list of RawClaims: what was said, where, and in which sentence. Who it is
// about is decided later (bind.ts), because that depends on the scene.
//
// Incremental by construction: detectParagraphs() looks every paragraph up in
// a cache keyed on the paragraph's own signature, so typing in one paragraph
// of a 100k-word manuscript re-reads one paragraph.
//
// Reads; never writes. Pure, no DOM, tested.
// ---------------------------------------------------------------------------

import { isHedged } from "@/lib/writing/capture/numbers";
import { CAPTURE_RULES, type CaptureRule, type ClaimKind, type Reading } from "@/lib/writing/capture/rules";
import { formatWithUnit } from "@/canon/units";

export interface Span {
  start: number;
  end: number;
}

export interface ParagraphMention extends Span {
  /** world_entries id. */
  id: string;
}

export interface Paragraph {
  text: string;
  mentions: readonly ParagraphMention[];
  /** Spans never read as claims (cited fact refs). */
  blocked?: readonly Span[];
}

export interface RawClaim {
  ruleId: string;
  /** Fixed predicate (rule or reading), or null to choose by subject type. */
  predicate: string | null;
  kind: ClaimKind;
  /** Number in `unit`, or the enum value. */
  value: number | string;
  unit: string | null;
  /** Half the precision the writer quoted, in `unit` (0 for enums). */
  halfStep: number;
  /** "about 400", "nearly 1.5 g". */
  approx: boolean;
  /** The words as written. */
  match: string;
  /** Offsets of `match` in the paragraph text. */
  start: number;
  end: number;
  /** The sentence the claim sits in, trimmed. */
  sentence: string;
  sentenceStart: number;
  /** Bind only to an entity the prose names. */
  namedOnly: boolean;
}

// ---------------------------------------------------------------------------
// Sentences
// ---------------------------------------------------------------------------

const SENTENCE_END = /[.!?…]+["'”’)\]]*(?=\s|$)/g;

/** Sentence spans of a paragraph. Decimals ("1.4") never split: no space. */
export function sentenceSpans(text: string): Span[] {
  const out: Span[] = [];
  let start = 0;
  SENTENCE_END.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SENTENCE_END.exec(text)) !== null) {
    const end = m.index + m[0].length;
    if (end > start) out.push({ start, end });
    start = end;
    while (start < text.length && /\s/.test(text[start])) start++;
  }
  if (start < text.length) out.push({ start, end: text.length });
  return out;
}

function spanAt(spans: readonly Span[], at: number): Span {
  for (const s of spans) if (at >= s.start && at < s.end) return s;
  return spans[spans.length - 1] ?? { start: 0, end: 0 };
}

const overlaps = (a: Span, b: Span): boolean => a.start < b.end && b.start < a.end;

// ---------------------------------------------------------------------------
// One paragraph
// ---------------------------------------------------------------------------

function displayNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e7 || abs < 1e-3)) return n.toPrecision(3).replace(/\.?0+e/, "e");
  return String(Number(n.toPrecision(4)));
}

/** "1.6 g", "26 h", "M", "400". */
export function claimValueText(c: Pick<RawClaim, "value" | "unit">): string {
  if (typeof c.value === "string") return c.value;
  if (!c.unit || c.unit === "individuals") return displayNumber(c.value);
  return formatWithUnit(displayNumber(c.value), c.unit);
}

function readingToClaim(
  rule: CaptureRule,
  reading: Reading,
  m: RegExpExecArray,
  sentence: Span,
  text: string,
  namedOnly: boolean,
): RawClaim {
  const lead = m.groups?.lead ?? "";
  const base = {
    ruleId: rule.id,
    kind: rule.kind,
    approx: isHedged(lead),
    match: m[0].trim(),
    start: m.index + (m[0].length - m[0].trimStart().length),
    end: m.index + m[0].trimEnd().length,
    sentence: text.slice(sentence.start, sentence.end).trim(),
    sentenceStart: sentence.start,
    namedOnly,
  };
  if (reading.kind === "enum") {
    return { ...base, predicate: rule.predicate, value: reading.value, unit: null, halfStep: 0 };
  }
  return {
    ...base,
    predicate: reading.predicate ?? rule.predicate,
    value: reading.value,
    unit: reading.unit,
    halfStep: reading.halfStep,
  };
}

/** Claims in one paragraph, in reading order. */
export function detectParagraph(p: Paragraph): RawClaim[] {
  const text = p.text;
  if (!text || !/[0-9]|dwarf|star|sun|primary|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|half|dozen|an?)\b/i.test(text)) {
    return [];
  }
  const sentences = sentenceSpans(text);
  const fenced: Span[] = [...p.mentions, ...(p.blocked ?? [])];
  const out: RawClaim[] = [];

  for (const rule of CAPTURE_RULES) {
    if (!rule.hint.test(text)) continue;
    for (const pat of rule.patterns) {
      const re = pat.re;
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        const span = { start: m.index, end: m.index + m[0].length };
        // A number inside a name ("Kepler-442b") or a cited value is not a claim.
        if (fenced.some((f) => overlaps(f, span))) continue;
        const sentence = spanAt(sentences, m.index);
        const s = text.slice(sentence.start, sentence.end);
        if (pat.requires && !pat.requires.test(s)) continue;
        if (pat.forbids && pat.forbids.test(s)) continue;
        const reading = rule.read(m);
        if (!reading) continue;
        out.push(readingToClaim(rule, reading, m, sentence, text, !!pat.namedOnly));
      }
    }
  }

  // Overlapping matches of the same rule are one claim: keep the longest.
  out.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: RawClaim[] = [];
  for (const c of out) {
    if (kept.some((k) => k.ruleId === c.ruleId && overlaps(k, c))) continue;
    kept.push(c);
  }
  return kept;
}

// ---------------------------------------------------------------------------
// Many paragraphs, incrementally
// ---------------------------------------------------------------------------

/** What identifies a paragraph's claims: its text, mentions and fences. */
export function paragraphSignature(p: Paragraph): string {
  let sig = p.text;
  for (const m of p.mentions) sig += `\u0001${m.id}@${m.start}-${m.end}`;
  for (const b of p.blocked ?? []) sig += `\u0002${b.start}-${b.end}`;
  return sig;
}

export interface CaptureCache {
  get(sig: string): RawClaim[] | undefined;
  set(sig: string, claims: RawClaim[]): void;
  /** Paragraphs actually read (cache misses), for tests and telemetry. */
  readonly misses: number;
  readonly size: number;
}

/** A bounded memo of paragraph → claims, shared across documents. */
export function createCaptureCache(limit = 50_000): CaptureCache {
  let map = new Map<string, RawClaim[]>();
  let misses = 0;
  return {
    get(sig) {
      return map.get(sig);
    },
    set(sig, claims) {
      misses++;
      if (map.size >= limit) map = new Map();
      map.set(sig, claims);
    },
    get misses() {
      return misses;
    },
    get size() {
      return map.size;
    },
  };
}

/** Claims per paragraph, reading each paragraph at most once per signature. */
export function detectParagraphs(paragraphs: readonly Paragraph[], cache: CaptureCache): RawClaim[][] {
  return paragraphs.map((p) => {
    const sig = paragraphSignature(p);
    const hit = cache.get(sig);
    if (hit) return hit;
    const claims = detectParagraph(p);
    cache.set(sig, claims);
    return claims;
  });
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** FNV-1a, 32-bit, as 8 hex chars. Stable across sessions and devices. */
export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function normaliseExcerpt(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * A claim's identity inside its document: predicate + words + sentence. Edits
 * elsewhere leave it alone; rewriting the sentence makes it a new claim (and
 * a dismissal of the old sentence no longer applies, which is right).
 */
export function claimHash(c: Pick<RawClaim, "ruleId" | "match" | "sentence">, predicate: string | null): string {
  return hashString(`${predicate ?? c.ruleId}|${normaliseExcerpt(c.match)}|${normaliseExcerpt(c.sentence)}`);
}
