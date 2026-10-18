// ---------------------------------------------------------------------------
// capture/bind, who a claim is about.
//
// A claim is only useful on the graph once it has a subject: "1.6 g" is a
// fact about Kellis Prime, not about the world in general. Identity is by id
// (11-SIMULATOR-CONSTELLATION §0), never by a name matching, so a claim binds
// to an entity the prose actually mentions (@ or [[ ]]) or to one the scene's
// Card declares, in that order of confidence:
//
//   NAMED IN SENTENCE   a mention of a fitting type in the same sentence,
//                       nearest first, preceding before following
//   NAMED IN PARAGRAPH  the same, anywhere in the paragraph
//   SUBJECT             the Card's ABOUT entity, if it fits
//   SETTING             the body the scene is set on, or the SET IN place
//   POV                 the POV character, only when the sentence is in the
//                       first person ("I stood two metres tall")
//   ONLY ONE ON FILE    the world has exactly one entity of a fitting type
//                       (planets, moons, stars, species only: a world with
//                       one vessel can still have shuttles in the prose)
//
// A rule marked namedOnly binds by mention (or first-person POV) or not at
// all. A claim whose predicate depends on the subject's type (height) is
// dropped when nothing binds. Anything else may stay unbound: subject null,
// a world-level claim, said so plainly in the UI.
//
// Pure, tested.
// ---------------------------------------------------------------------------

import type { Paragraph, RawClaim } from "@/lib/writing/capture/detect";
import { ruleById } from "@/lib/writing/capture/rules";

export type BindReason =
  | "NAMED IN SENTENCE"
  | "NAMED IN PARAGRAPH"
  | "SUBJECT"
  | "SETTING"
  | "POV"
  | "ONLY ONE ON FILE";

export interface SceneBinding {
  subjectEntityId?: string | null;
  /** The body the scene stands on (planet / moon), when known. */
  settingBodyId?: string | null;
  setInPlaceId?: string | null;
  povEntityId?: string | null;
}

export interface BindContext {
  /** Entity type by id; undefined for an id not on file. */
  typeOf(id: string): string | undefined;
  /** Number of entities on file of each type. */
  countByType: ReadonlyMap<string, number>;
  /** The single entity of a type, when there is exactly one. */
  onlyOfType: ReadonlyMap<string, string>;
  scene: SceneBinding;
}

export interface BoundClaim extends RawClaim {
  /** Resolved predicate (never null once bound). */
  predicate: string;
  subjectId: string | null;
  subjectType: string | null;
  reason: BindReason | null;
}

const ONLY_ONE_TYPES = new Set(["planet", "moon", "star", "species"]);
const FIRST_PERSON = /(?:^|[^A-Za-z])(?:I|me|my|myself)(?![A-Za-z])/;

/** Build the lookup a binder needs from the world's entities. */
export function buildBindContext(
  entities: ReadonlyArray<{ id: string; entity_type: string }>,
  scene: SceneBinding,
): BindContext {
  const types = new Map<string, string>();
  const count = new Map<string, number>();
  const only = new Map<string, string>();
  for (const e of entities) {
    types.set(e.id, e.entity_type);
    count.set(e.entity_type, (count.get(e.entity_type) ?? 0) + 1);
    only.set(e.entity_type, e.id);
  }
  for (const [t, n] of count) if (n !== 1) only.delete(t);
  return { typeOf: (id) => types.get(id), countByType: count, onlyOfType: only, scene };
}

function predicateFor(claim: RawClaim, type: string | null): string | null {
  if (claim.predicate) return claim.predicate;
  if (!type) return null;
  return ruleById(claim.ruleId)?.byType?.[type] ?? null;
}

function nearestMention(
  p: Paragraph,
  claim: RawClaim,
  fits: (id: string) => boolean,
  within: { start: number; end: number } | null,
): string | null {
  let best: { id: string; score: number } | null = null;
  for (const m of p.mentions) {
    if (within && (m.start < within.start || m.end > within.end)) continue;
    if (!fits(m.id)) continue;
    // Preceding mentions are the usual subject ("Kellis has 1.4 g"); a
    // following one ("1.4 g, on Kellis") still counts, ranked after.
    const score = m.end <= claim.start ? claim.start - m.end : 10_000 + (m.start - claim.end);
    if (!best || score < best.score) best = { id: m.id, score };
  }
  return best?.id ?? null;
}

/** Bind one claim. Null when the claim cannot be filed honestly. */
export function bindClaim(claim: RawClaim, p: Paragraph, ctx: BindContext): BoundClaim | null {
  const rule = ruleById(claim.ruleId);
  const types = rule?.subjectTypes ?? [];
  const fits = (id: string | null | undefined): id is string => {
    if (!id) return false;
    const t = ctx.typeOf(id);
    return !!t && types.includes(t);
  };
  const done = (subjectId: string | null, reason: BindReason | null): BoundClaim | null => {
    const subjectType = subjectId ? ctx.typeOf(subjectId) ?? null : null;
    const predicate = predicateFor(claim, subjectType);
    if (!predicate) return null;
    return { ...claim, predicate, subjectId, subjectType, reason };
  };

  const sentence = { start: claim.sentenceStart, end: claim.sentenceStart + claim.sentence.length + 1 };
  const inSentence = nearestMention(p, claim, fits, sentence);
  if (inSentence) return done(inSentence, "NAMED IN SENTENCE");
  const inParagraph = nearestMention(p, claim, fits, null);
  if (inParagraph) return done(inParagraph, "NAMED IN PARAGRAPH");

  const { scene } = ctx;
  const firstPerson = FIRST_PERSON.test(claim.sentence);
  if (claim.namedOnly) {
    if (firstPerson && fits(scene.povEntityId)) return done(scene.povEntityId, "POV");
    return null;
  }

  if (fits(scene.subjectEntityId)) return done(scene.subjectEntityId, "SUBJECT");
  if (fits(scene.settingBodyId)) return done(scene.settingBodyId, "SETTING");
  if (fits(scene.setInPlaceId)) return done(scene.setInPlaceId, "SETTING");
  if (firstPerson && fits(scene.povEntityId)) return done(scene.povEntityId, "POV");

  const only = types.filter((t) => ONLY_ONE_TYPES.has(t)).map((t) => ctx.onlyOfType.get(t));
  const candidates = types.reduce((n, t) => n + (ctx.countByType.get(t) ?? 0), 0);
  // Exactly one fitting entity across every fitting type: a one-planet
  // world with no moons, a one-star system.
  if (candidates === 1) {
    const id = only.find((x): x is string => !!x);
    if (id) return done(id, "ONLY ONE ON FILE");
  }

  return done(null, null);
}

/** Bind every claim in a paragraph, dropping the ones that cannot be filed. */
export function bindParagraph(claims: readonly RawClaim[], p: Paragraph, ctx: BindContext): BoundClaim[] {
  const out: BoundClaim[] = [];
  for (const c of claims) {
    const b = bindClaim(c, p, ctx);
    if (b) out.push(b);
  }
  return out;
}
