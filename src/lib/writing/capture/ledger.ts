// ---------------------------------------------------------------------------
// capture/ledger, claims against the world (Studio Charter §2.2 and §2.3).
//
// Every bound claim is compared with what the world already records for the
// same (subject, predicate):
//
//   nothing on file          → CLAIM DETECTED. NOT ON FILE. ADOPT?
//   on file, same value      → nothing to say (the prose agrees)
//   on file, different value → a contradiction for the ledger
//   not comparable           → nothing to say (never guess)
//
// "Same value" is the writer's precision, not the computer's: "1.5 g" agrees
// with 1.47 g, "nine billion" with 8.7e9, "about 400 crew" with 412. A canon
// fact is the only thing a claim is compared with when one exists; otherwise
// every live source for that slot, and the claim contradicts only if it
// agrees with none of them (the S-FIX rule continuity.ts already follows).
//
// Scope mirrors continuity.ts: facts about the claim's subject first; when
// that subject has none, facts filed with no subject at all (simulator saves,
// unlinked worksheets); facts about a different subject never count.
//
// Pure, tested. Writes nothing.
// ---------------------------------------------------------------------------

import { predicateDef, resolvePredicate } from "@/canon/vocabulary";
import type { Confidence, FactValue } from "@/canon/types";
import type { BoundClaim } from "@/lib/writing/capture/bind";
import { claimHash, claimValueText, hashString, normaliseExcerpt } from "@/lib/writing/capture/detect";
import { spectralParts } from "@/lib/writing/capture/rules";
import { readFactNumber } from "@/lib/writing/capture/units";

/** The slice of a WorldFact the ledger reads (WorldFact satisfies it). */
export interface LedgerFact {
  ref: string;
  predicate?: string;
  entityId: string | null;
  label: string;
  value: string;
  insert: string;
  confidence?: Confidence;
  outrankedBy?: string;
  factId?: string;
  href: string | null;
  toolLabel: string;
  sourceTitle: string;
}

export type FactIndex = ReadonlyMap<string, readonly LedgerFact[]>;

/** Live facts by canonical predicate. Build once per world change. */
export function indexFactsByPredicate(facts: readonly LedgerFact[]): Map<string, LedgerFact[]> {
  const out = new Map<string, LedgerFact[]>();
  for (const f of facts) {
    if (!f.predicate || f.outrankedBy) continue;
    const p = resolvePredicate(f.predicate).predicate;
    const list = out.get(p);
    if (list) list.push(f);
    else out.set(p, [f]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

export type Comparison = "agree" | "disagree" | "unknown";

const REL_EXACT = 0.02;
const REL_APPROX = 0.15;

export function compareClaim(claim: BoundClaim, fact: LedgerFact): Comparison {
  if (claim.kind === "enum") {
    const a = spectralParts(String(claim.value));
    const b = spectralParts(fact.insert || fact.value) ?? spectralParts(fact.value);
    if (!a || !b) return "unknown";
    if (a.letter !== b.letter) return "disagree";
    if (a.sub && b.sub && Math.abs(Number(a.sub) - Number(b.sub)) >= 1) return "disagree";
    return "agree";
  }
  const claimed = typeof claim.value === "number" ? claim.value : Number(claim.value);
  if (!Number.isFinite(claimed)) return "unknown";
  const recorded = readFactNumber(fact.insert || fact.value, claim.unit) ?? null;
  if (recorded === null || !Number.isFinite(recorded)) return "unknown";
  if (claim.kind === "count" && !claim.approx) {
    return Math.round(claimed) === Math.round(recorded) ? "agree" : "disagree";
  }
  const rel = claim.approx ? REL_APPROX : REL_EXACT;
  const tol = Math.max(claim.halfStep, Math.abs(recorded) * rel, 1e-9);
  return Math.abs(claimed - recorded) <= tol ? "agree" : "disagree";
}

export type Classification =
  | { status: "not-on-file" }
  | { status: "agrees"; fact: LedgerFact }
  | { status: "contradiction"; fact: LedgerFact }
  | { status: "skip" };

/** Facts that speak for this claim's slot (see the scope rule above). */
export function factsInScope(claim: BoundClaim, index: FactIndex): { scoped: LedgerFact[]; elsewhere: boolean } {
  const all = index.get(resolvePredicate(claim.predicate).predicate) ?? [];
  if (all.length === 0) return { scoped: [], elsewhere: false };
  const unscoped = all.filter((f) => !f.entityId);
  if (claim.subjectId) {
    const mine = all.filter((f) => f.entityId === claim.subjectId);
    return { scoped: mine.length ? mine : unscoped, elsewhere: false };
  }
  return { scoped: unscoped, elsewhere: unscoped.length === 0 };
}

export function classifyClaim(claim: BoundClaim, index: FactIndex): Classification {
  const { scoped, elsewhere } = factsInScope(claim, index);
  // An unbound claim when some entity has this on file: ambiguous. Saying
  // NOT ON FILE would be false; saying CONTRADICTS would be a guess.
  if (elsewhere) return { status: "skip" };
  if (scoped.length === 0) return { status: "not-on-file" };
  const canon = scoped.filter((f) => f.confidence === "canon");
  const against = canon.length ? canon : scoped;
  let firstDisagree: LedgerFact | null = null;
  for (const f of against) {
    const c = compareClaim(claim, f);
    if (c === "agree") return { status: "agrees", fact: f };
    if (c === "disagree" && !firstDisagree) firstDisagree = f;
  }
  return firstDisagree ? { status: "contradiction", fact: firstDisagree } : { status: "skip" };
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface CaptureResolution {
  /** dismissed: not a claim / leave it. both: an epoch boundary (§2.3). */
  r: "dismissed" | "both";
  note?: string;
  at: string;
}

export type CaptureResolutions = Readonly<Record<string, CaptureResolution>>;

interface ItemBase {
  /** Resolution key: the claim hash, plus the fact for a contradiction. */
  key: string;
  /** The claim's own hash (document + excerpt identity). */
  hash: string;
  docId: string;
  paragraphIndex: number;
  claim: BoundClaim;
  /** "1.6 g": the claim's value for display and for writing. */
  valueText: string;
}

export interface ClaimItem extends ItemBase {
  kind: "claim";
}

export interface ContradictionItem extends ItemBase {
  kind: "contradiction";
  fact: LedgerFact;
}

export type CaptureItem = ClaimItem | ContradictionItem;

export function contradictionKey(hash: string, fact: Pick<LedgerFact, "ref" | "insert">): string {
  return `${hash}~${hashString(`${fact.ref}|${fact.insert}`)}`;
}

/**
 * The ledger items for one document: claims not on file and contradictions,
 * in reading order, minus anything the writer already resolved.
 */
export function buildCaptureItems(
  docId: string,
  claimsByParagraph: ReadonlyArray<readonly BoundClaim[]>,
  index: FactIndex,
  resolutions: CaptureResolutions = {},
): CaptureItem[] {
  const out: CaptureItem[] = [];
  claimsByParagraph.forEach((claims, paragraphIndex) => {
    for (const claim of claims) {
      const cls = classifyClaim(claim, index);
      if (cls.status === "agrees" || cls.status === "skip") continue;
      const hash = claimHash(claim, claim.predicate);
      const base = { hash, docId, paragraphIndex, claim, valueText: claimValueText(claim) };
      if (cls.status === "not-on-file") {
        if (resolutions[hash]) continue;
        out.push({ ...base, kind: "claim", key: hash });
      } else {
        const key = contradictionKey(hash, cls.fact);
        if (resolutions[key]) continue;
        out.push({ ...base, kind: "contradiction", key, fact: cls.fact });
      }
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Continuity findings (lib/continuity.ts) in the same ledger
// ---------------------------------------------------------------------------

export interface ContinuityLike {
  factKey: string;
  factLabel: string;
  worldValue: string;
  proseValue: string;
  excerpt: string;
  message: string;
}

export function continuityKey(n: ContinuityLike): string {
  return `continuity:${hashString(`${n.factKey}|${normaliseExcerpt(n.excerpt)}|${n.worldValue}`)}`;
}

/**
 * Continuity findings not already said by a capture contradiction on the
 * same predicate, and not resolved by the writer.
 */
export function mergeContinuity<T extends ContinuityLike>(
  notes: readonly T[],
  items: readonly CaptureItem[],
  resolutions: CaptureResolutions = {},
): Array<T & { key: string }> {
  const said = new Set(items.filter((i) => i.kind === "contradiction").map((i) => i.claim.predicate));
  const out: Array<T & { key: string }> = [];
  for (const n of notes) {
    const p = resolvePredicate(n.factKey).predicate;
    if (said.has(p)) continue;
    const key = continuityKey(n);
    if (resolutions[key]) continue;
    out.push({ ...n, key });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Writing a claim to canon
// ---------------------------------------------------------------------------

export interface ClaimAssertion {
  subjectId: string | null;
  predicate: string;
  value: FactValue;
  valueText: string;
  unit: string | null;
  sourceRef: Record<string, unknown>;
}

/**
 * What ADOPT / ADOPT AS CANON / PROSE IS RIGHT write: the claim's typed
 * value, its subject, and a source_ref that points back at the prose
 * ({ document_id, excerpt, offset }, plus enough to find it again).
 */
export function claimAssertion(item: CaptureItem): ClaimAssertion {
  const c = item.claim;
  const def = predicateDef(c.predicate);
  // Counts carry no unit unless the vocabulary gives one (population does).
  const unit = c.unit === "individuals" && !def?.unit ? null : c.unit;
  const value: FactValue =
    typeof c.value === "string"
      ? { kind: "enum", value: c.value }
      : { kind: "scalar", value: Number(c.value.toPrecision(6)), ...(unit ? { unit } : {}) };
  return {
    subjectId: c.subjectId,
    predicate: c.predicate,
    value,
    valueText: item.valueText,
    unit,
    sourceRef: {
      document_id: item.docId,
      excerpt: c.sentence,
      offset: c.start,
      paragraph: item.paragraphIndex,
      match: c.match,
      claim_hash: item.hash,
      rule: c.ruleId,
      ...(c.reason ? { bound_by: c.reason } : {}),
    },
  };
}

export interface CaptureCount {
  claims: number;
  contradictions: number;
}

export function countItems(items: readonly CaptureItem[]): CaptureCount {
  let claims = 0;
  let contradictions = 0;
  for (const i of items) {
    if (i.kind === "claim") claims++;
    else contradictions++;
  }
  return { claims, contradictions };
}

/** Footer line: "3 CONTRADICTIONS" (world level). */
export function contradictionSummaryLine(n: number): string {
  return n === 1 ? "1 CONTRADICTION" : `${n} CONTRADICTIONS`;
}
