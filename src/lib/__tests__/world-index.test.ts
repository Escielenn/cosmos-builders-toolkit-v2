import { describe, it, expect } from "vitest";
import {
  buildWorldFacts,
  entityOneLine,
  factToRefAttrs,
  fuzzyScore,
  searchWorld,
  sourceLine,
  withUnit,
} from "@/lib/writing/world-index";
import { factRefId, factRefStatus } from "@/lib/writing/fact-ref";
import { findSlashTrigger } from "@/lib/writing/palette-trigger";
import type { Entity } from "@/services/entity-graph-types";

function entity(p: Partial<Entity> & { id: string; name: string }): Entity {
  return {
    world_id: "w",
    user_id: "u",
    entity_type: "custom",
    custom_type_label: null,
    cascade_stage: "culture",
    color: null,
    icon: null,
    summary: null,
    image_url: null,
    description: null,
    notes: null,
    parent_entity_id: null,
    sort_order: 0,
    tags: [],
    graph_x: null,
    graph_y: null,
    pinned: false,
    metadata: {},
    created_at: "",
    updated_at: "",
    ...p,
  };
}

const kellis = entity({ id: "kellis", name: "Kellis", entity_type: "planet", metadata: { surfaceGravity: 1.4 } });

const facts = buildWorldFacts({
  worldId: "w",
  worksheets: [
    {
      id: "ws-1",
      tool_type: "planetary-profile",
      title: "Kellis Prime",
      data: { physicalCharacteristics: { surfaceGravity: "1.6" } },
    },
  ],
  simulations: [],
  subjects: { "ws-1": "kellis" },
  entities: [kellis, entity({ id: "kael", name: "Kael", entity_type: "character" })],
  events: [
    { id: "ev-1", title: "Fall of Ashgrave", eventDate: "2340", branchId: "b-1", children: [{ id: "ev-2", title: "Aftermath", eventDate: "2341" }] },
  ],
  branches: [{ id: "b-1", name: "The Long Night" }],
});

describe("withUnit", () => {
  it("attaches the label's unit to a bare number", () => {
    expect(withUnit("1.4", "Surface Gravity (g)")).toBe("1.4 g");
    expect(withUnit("10000", "Civilization Longevity (years)")).toBe("10000 years");
  });
  it("leaves words, unit-less labels and qualifiers alone", () => {
    expect(withUnit("1.4 g", "Surface Gravity (g)")).toBe("1.4 g");
    expect(withUnit("Vel Haran", "Capital (city)")).toBe("Vel Haran");
    expect(withUnit("12", "Moons")).toBe("12");
    expect(withUnit("7", "Dominant Sense (character)")).toBe("7");
  });
});

describe("buildWorldFacts", () => {
  it("reads worksheets with their subject, source and route", () => {
    const g = facts.find((f) => f.sourceKind === "worksheet" && f.factKey === "surfaceGravity")!;
    expect(g).toMatchObject({
      insert: "1.6 g",
      entityId: "kellis",
      toolLabel: "Genesis",
      sourceTitle: "Kellis Prime",
      accent: "azure",
    });
    expect(g.href).toContain("worksheetId=ws-1");
    expect(sourceLine(g)).toBe("Genesis · Kellis Prime");
  });

  it("reads Codex infoboxes as facts about the entity", () => {
    const g = facts.find((f) => f.sourceKind === "entity" && f.factKey === "surfaceGravity")!;
    expect(g).toMatchObject({ insert: "1.4 g", entityId: "kellis", href: "/worlds/w/codex/kellis", toolLabel: "Codex" });
  });

  it("reads Chronicle events (nested too) and branches", () => {
    const ev = facts.find((f) => f.sourceId === "ev-1")!;
    expect(ev).toMatchObject({ label: "Fall of Ashgrave", value: "2340 · The Long Night", insert: "2340" });
    expect(facts.some((f) => f.sourceId === "ev-2")).toBe(true);
    expect(facts.find((f) => f.sourceId === "b-1")?.insert).toBe("The Long Night");
  });

  it("refs built from a fact find that fact again, so staleness is one lookup", () => {
    for (const f of facts) {
      const attrs = factToRefAttrs(f);
      expect(factRefId(attrs)).toBe(f.ref);
      expect(factRefStatus(attrs, f).state).toBe("current");
    }
  });

  it("has no duplicate refs", () => {
    expect(new Set(facts.map((f) => f.ref)).size).toBe(facts.length);
  });
});

describe("search", () => {
  it("scores exact > prefix > word start > substring > subsequence > miss", () => {
    const exact = fuzzyScore("gravity", "gravity");
    const prefix = fuzzyScore("grav", "gravity well");
    const word = fuzzyScore("grav", "surface gravity");
    const inner = fuzzyScore("rav", "surface gravity");
    const subseq = fuzzyScore("sfgr", "surface gravity");
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(inner);
    expect(inner).toBeGreaterThan(subseq);
    expect(subseq).toBeGreaterThan(0);
    expect(fuzzyScore("xyz", "surface gravity")).toBe(0);
  });

  it("finds facts and entities, and lets the scene lift what relates", () => {
    const entities = [kellis, entity({ id: "kael", name: "Kael", entity_type: "character" })];
    const plain = searchWorld(facts, entities, "ka");
    expect(plain[0]).toMatchObject({ kind: "entity" });
    const boosted = searchWorld(facts, entities, "", {
      boost: (it) => (it.kind === "fact" && it.fact.sourceId === "ev-2" ? 500 : 0),
    });
    expect(boosted[0]).toMatchObject({ kind: "fact" });
    expect(boosted[0].kind === "fact" && boosted[0].fact.sourceId).toBe("ev-2");
  });
});

describe("entityOneLine", () => {
  it("prefers the summary, else the first sentence of the description", () => {
    expect(entityOneLine({ summary: "A cold world.", description: "x" })).toBe("A cold world.");
    expect(entityOneLine({ summary: null, description: "<p>Tidally locked. Wet.</p>" })).toBe("Tidally locked.");
    expect(entityOneLine({ summary: "", description: null })).toBe("");
  });
});

describe("findSlashTrigger", () => {
  it("opens at a word boundary only", () => {
    expect(findSlashTrigger("/grav")).toEqual({ at: 0, query: "grav" });
    expect(findSlashTrigger("The pull was /surface gra")).toEqual({ at: 13, query: "surface gra" });
    expect(findSlashTrigger("and/or")).toBeNull();
    expect(findSlashTrigger("9.8 m/s")).toBeNull();
    expect(findSlashTrigger("see https://x")).toBeNull();
  });
  it("closes when the writer moves on", () => {
    expect(findSlashTrigger("a / then")).toBeNull();
    expect(findSlashTrigger("a /two  spaces")).toBeNull();
    expect(findSlashTrigger(`a /${"x".repeat(41)}`)).toBeNull();
    expect(findSlashTrigger("a /x￼y")).toBeNull();
  });
});
