import { describe, it, expect } from "vitest";
import {
  buildSceneContext,
  entityReason,
  factReason,
  isSceneEmpty,
  mentionedIdsInHtml,
  rankEntities,
  rankFacts,
} from "@/lib/writing/scene-context";

const html =
  '<p><entity-mention data-id="kael" data-label="Kael">Kael</entity-mention> walked to ' +
  '<wiki-link data-element-id="spires" data-title="The Spires">The Spires</wiki-link>; the pull was ' +
  '<fact-ref data-fact-key="g" data-value="1.4 g" data-entity-id="kellis">1.4 g</fact-ref>. ' +
  'Again <entity-mention data-id="kael" data-label="Kael">Kael</entity-mention>.</p>';

const connections = [
  { source_entity_id: "kael", target_entity_id: "mira" }, // one hop from a mention
  { source_entity_id: "far", target_entity_id: "farther" }, // unrelated
  { source_entity_id: "verrid", target_entity_id: "kael" }, // both anchors: no LINKED
];

const ctx = buildSceneContext({
  html,
  povEntityId: "verrid",
  povDossierId: "dossier-1",
  povOriginSheetIds: ["homeworld-sheet"],
  setInPlaceId: "vel-haran",
  settingBodyId: "kellis-body",
  subjectEntityId: "subject",
  connections,
});

describe("mentionedIdsInHtml", () => {
  it("collects @mentions, [[links]] and cited facts' subjects, first mention first, once", () => {
    expect(mentionedIdsInHtml(html)).toEqual(["kael", "spires", "kellis"]);
  });
  it("is empty for plain prose", () => {
    expect(mentionedIdsInHtml("<p>Nothing.</p>")).toEqual([]);
    expect(mentionedIdsInHtml(undefined)).toEqual([]);
  });
});

describe("buildSceneContext", () => {
  it("adds one graph hop from every anchor, and only one", () => {
    expect([...ctx.linked]).toEqual(["mira"]);
  });
  it("knows when a scene declares nothing", () => {
    expect(isSceneEmpty(buildSceneContext({ html: "<p>x</p>", connections: [] }))).toBe(true);
    expect(isSceneEmpty(ctx)).toBe(false);
  });
});

describe("entity ranking", () => {
  it("gives each entity its most specific reason", () => {
    expect(entityReason("kael", ctx)).toBe("IN THIS SCENE");
    expect(entityReason("verrid", ctx)).toBe("POV");
    expect(entityReason("vel-haran", ctx)).toBe("SETTING");
    expect(entityReason("kellis-body", ctx)).toBe("SETTING");
    expect(entityReason("subject", ctx)).toBe("SUBJECT");
    expect(entityReason("mira", ctx)).toBe("LINKED");
    expect(entityReason("far", ctx)).toBeNull();
  });

  it("orders mentioned, POV, setting, subject, linked, then the rest, never dropping any", () => {
    const entities = ["far", "mira", "subject", "vel-haran", "verrid", "spires", "kael"].map((id) => ({ id }));
    const ranked = rankEntities(entities, ctx);
    expect(ranked.map((r) => r.item.id)).toEqual(["kael", "spires", "verrid", "vel-haran", "subject", "mira", "far"]);
    expect(ranked.map((r) => r.reason)).toEqual([
      "IN THIS SCENE",
      "IN THIS SCENE",
      "POV",
      "SETTING",
      "SUBJECT",
      "LINKED",
      null,
    ]);
  });
});

describe("fact ranking", () => {
  it("ranks by subject, by the POV's sheets, and by the setting's gazetteer row", () => {
    expect(factReason({ entityId: "kael", sourceId: null, factKey: "x" }, ctx)).toBe("IN THIS SCENE");
    expect(factReason({ entityId: null, sourceId: "dossier-1", factKey: "characterSpecies" }, ctx)).toBe("POV");
    expect(factReason({ entityId: null, sourceId: "homeworld-sheet", factKey: "surfaceGravity" }, ctx)).toBe("POV");
    expect(factReason({ entityId: null, sourceId: "map", factKey: "surfaceMap.place.vel-haran" }, ctx)).toBe("SETTING");
    expect(factReason({ entityId: "kellis-body", sourceId: "p", factKey: "surfaceGravity" }, ctx)).toBe("SETTING");
    expect(factReason({ entityId: "elsewhere", sourceId: "other", factKey: "k" }, ctx)).toBeNull();
  });

  it("keeps the more specific of two reasons", () => {
    // About the POV (entity) AND from a mentioned subject: mention wins.
    expect(factReason({ entityId: "kael", sourceId: "dossier-1", factKey: "k" }, ctx)).toBe("IN THIS SCENE");
  });

  it("is stable within a reason", () => {
    const facts = [
      { id: 1, entityId: null, sourceId: "x", factKey: "a" },
      { id: 2, entityId: "subject", sourceId: null, factKey: "b" },
      { id: 3, entityId: null, sourceId: "y", factKey: "c" },
      { id: 4, entityId: "subject", sourceId: null, factKey: "d" },
    ];
    expect(rankFacts(facts, ctx).map((r) => r.item.id)).toEqual([2, 4, 1, 3]);
  });
});
