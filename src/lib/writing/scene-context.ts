// ---------------------------------------------------------------------------
// scene-context, what the open document is about, and what that makes
// relevant.
//
// The Studio Charter (§2.1): the rail is "not a flat index. Scoped and
// ranked". A scene declares its world in four ways: the entities its prose
// mentions, its POV character, the place it is set in, and the entity it is
// about. One graph hop from those (world_connections) is the second ring.
// Everything else is the rest of the world, still listed, just lower.
//
// Identity is by id only (11-SIMULATOR-CONSTELLATION §0): a fact is related
// to a scene because its subject id, its source worksheet or its place id
// says so, never because a name happens to match.
//
// Pure: no React, no network, tested. Callers memoise; nothing here is on the
// typing path.
// ---------------------------------------------------------------------------

export type RankReason = "IN THIS SCENE" | "POV" | "SETTING" | "SUBJECT" | "LINKED";

/** Earlier is more relevant. */
export const REASON_ORDER: readonly RankReason[] = ["IN THIS SCENE", "POV", "SETTING", "SUBJECT", "LINKED"];

const RANK: Record<RankReason, number> = {
  "IN THIS SCENE": 0,
  POV: 1,
  SETTING: 2,
  SUBJECT: 3,
  LINKED: 4,
};
const UNRANKED = 5;

export function reasonRank(r: RankReason | null): number {
  return r ? RANK[r] : UNRANKED;
}

export interface SceneContext {
  /** Entity ids the prose mentions (@, [[ ]], or a cited fact's subject). */
  mentioned: ReadonlySet<string>;
  povEntityId: string | null;
  /** The POV's Dossier and the worksheets it inherits from. */
  povSheetIds: ReadonlySet<string>;
  /** The place the scene is set in, and the body that place stands on. */
  settingIds: ReadonlySet<string>;
  subjectEntityId: string | null;
  /** One hop from any of the above. */
  linked: ReadonlySet<string>;
}

export const EMPTY_SCENE: SceneContext = {
  mentioned: new Set(),
  povEntityId: null,
  povSheetIds: new Set(),
  settingIds: new Set(),
  subjectEntityId: null,
  linked: new Set(),
};

// ---------------------------------------------------------------------------
// Mentions in prose
// ---------------------------------------------------------------------------

const MENTION_RES: RegExp[] = [
  /<entity-mention\b[^>]*?\bdata-id\s*=\s*"([^"]+)"/gi,
  /<wiki-link\b[^>]*?\bdata-element-id\s*=\s*"([^"]+)"/gi,
  /<fact-ref\b[^>]*?\bdata-entity-id\s*=\s*"([^"]+)"/gi,
];

/** Entity ids referenced in a document's HTML, first mention first. */
export function mentionedIdsInHtml(html: string | null | undefined): string[] {
  if (!html) return [];
  const hits: Array<{ at: number; id: string }> = [];
  for (const re of MENTION_RES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const id = m[1].trim();
      if (id && id !== "null") hits.push({ at: m.index, id });
    }
  }
  hits.sort((a, b) => a.at - b.at);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of hits) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    out.push(h.id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface SceneInput {
  html: string | null | undefined;
  povEntityId?: string | null;
  povDossierId?: string | null;
  /** Worksheets the POV's dossier inherits from (homeworld, species, …). */
  povOriginSheetIds?: readonly string[];
  setInPlaceId?: string | null;
  /** The body the place stands on, when known. */
  settingBodyId?: string | null;
  subjectEntityId?: string | null;
  connections: ReadonlyArray<{ source_entity_id: string; target_entity_id: string }>;
}

export function buildSceneContext(input: SceneInput): SceneContext {
  const mentioned = new Set(mentionedIdsInHtml(input.html));
  const povEntityId = input.povEntityId || null;
  const povSheetIds = new Set(
    [input.povDossierId, ...(input.povOriginSheetIds ?? [])].filter((x): x is string => !!x),
  );
  const settingIds = new Set([input.setInPlaceId, input.settingBodyId].filter((x): x is string => !!x));
  const subjectEntityId = input.subjectEntityId || null;

  const anchors = new Set<string>([...mentioned, ...settingIds]);
  if (povEntityId) anchors.add(povEntityId);
  if (subjectEntityId) anchors.add(subjectEntityId);

  const linked = new Set<string>();
  for (const c of input.connections) {
    if (anchors.has(c.source_entity_id) && !anchors.has(c.target_entity_id)) linked.add(c.target_entity_id);
    if (anchors.has(c.target_entity_id) && !anchors.has(c.source_entity_id)) linked.add(c.source_entity_id);
  }
  return { mentioned, povEntityId, povSheetIds, settingIds, subjectEntityId, linked };
}

/** Why an entity is relevant to this scene, most specific reason first. */
export function entityReason(id: string, ctx: SceneContext): RankReason | null {
  if (ctx.mentioned.has(id)) return "IN THIS SCENE";
  if (ctx.povEntityId === id) return "POV";
  if (ctx.settingIds.has(id)) return "SETTING";
  if (ctx.subjectEntityId === id) return "SUBJECT";
  if (ctx.linked.has(id)) return "LINKED";
  return null;
}

export interface FactLike {
  entityId: string | null;
  sourceId: string | null;
  factKey: string;
}

/**
 * Why a fact is relevant. A POV's dossier and the sheets it inherits from
 * count as POV even when they carry no subject id; a gazetteer row for the
 * scene's own place counts as SETTING.
 */
export function factReason(f: FactLike, ctx: SceneContext): RankReason | null {
  const byEntity = f.entityId ? entityReason(f.entityId, ctx) : null;
  let best = byEntity;
  const consider = (r: RankReason) => {
    if (reasonRank(r) < reasonRank(best)) best = r;
  };
  if (f.sourceId && ctx.povSheetIds.has(f.sourceId)) consider("POV");
  if (f.factKey.startsWith("surfaceMap.place.")) {
    const placeId = f.factKey.slice("surfaceMap.place.".length);
    if (ctx.settingIds.has(placeId)) consider("SETTING");
    else if (ctx.mentioned.has(placeId)) consider("IN THIS SCENE");
  }
  return best;
}

export interface Ranked<T> {
  item: T;
  reason: RankReason | null;
}

/**
 * Stable rank: by reason, then by the caller's original order (or, for
 * mentions, by first appearance in the prose). Never drops an item.
 */
export function rankBy<T>(items: readonly T[], reasonOf: (t: T) => RankReason | null): Ranked<T>[] {
  return items
    .map((item, i) => ({ item, reason: reasonOf(item), i }))
    .sort((a, b) => reasonRank(a.reason) - reasonRank(b.reason) || a.i - b.i)
    .map(({ item, reason }) => ({ item, reason }));
}

export function rankEntities<T extends { id: string }>(entities: readonly T[], ctx: SceneContext): Ranked<T>[] {
  const order = [...ctx.mentioned];
  const pos = new Map(order.map((id, i) => [id, i]));
  return rankBy(entities, (e) => entityReason(e.id, ctx)).sort((a, b) => {
    // Within "in this scene", the order the prose introduced them.
    if (a.reason === "IN THIS SCENE" && b.reason === "IN THIS SCENE") {
      return (pos.get(a.item.id) ?? 0) - (pos.get(b.item.id) ?? 0);
    }
    return 0;
  });
}

export function rankFacts<T extends FactLike>(facts: readonly T[], ctx: SceneContext): Ranked<T>[] {
  return rankBy(facts, (f) => factReason(f, ctx));
}

/** True when the scene declares nothing, so ranking has nothing to say. */
export function isSceneEmpty(ctx: SceneContext): boolean {
  return (
    ctx.mentioned.size === 0 &&
    !ctx.povEntityId &&
    ctx.povSheetIds.size === 0 &&
    ctx.settingIds.size === 0 &&
    !ctx.subjectEntityId
  );
}
