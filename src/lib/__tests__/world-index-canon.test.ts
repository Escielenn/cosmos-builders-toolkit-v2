import { describe, it, expect } from "vitest";
import { buildWorldFacts, factToRefAttrs, sourceLine, type WorldIndexInput } from "@/lib/writing/world-index";
import { factRefId, factRefStatus, sanitizeFactRefAttrs } from "@/lib/writing/fact-ref";
import type { CanonFactRow } from "@/canon/types";
import type { Entity } from "@/services/entity-graph-types";

const kellis = {
  id: "kellis",
  world_id: "w",
  user_id: "u",
  name: "Kellis",
  entity_type: "planet",
  custom_type_label: null,
  cascade_stage: "environment",
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
} as Entity;

const input: WorldIndexInput = {
  worldId: "w",
  worksheets: [
    {
      id: "ws-1",
      tool_type: "planetary-profile",
      title: "Kellis Prime",
      data: { physicalCharacteristics: { surfaceGravity: "1.6", dayLength: "30" } },
    },
  ],
  simulations: [],
  subjects: { "ws-1": "kellis" },
  entities: [kellis],
};

function row(p: Partial<CanonFactRow> & Pick<CanonFactRow, "id">): CanonFactRow {
  return {
    world_id: "w",
    subject_id: "kellis",
    predicate: "planet.surface_gravity",
    value: { kind: "scalar", value: 1.4, unit: "g" },
    value_text: "1.4 g",
    unit: "g",
    confidence: "canon",
    source_kind: "manual",
    source_ref: {},
    asserted_by: "u",
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    superseded_at: null,
    ...p,
  };
}

const strip = (facts: ReturnType<typeof buildWorldFacts>) =>
  facts.map(({ confidence: _c, predicate: _p, ...rest }) => rest);

describe("world-index reads through canon", () => {
  const projectedOnly = buildWorldFacts(input);

  it("with nothing stored, projected facts are unchanged apart from their tier", () => {
    expect(buildWorldFacts({ ...input, asserted: [] })).toEqual(projectedOnly);
    for (const f of projectedOnly) expect(f.confidence).toBe("projected");
    const g = projectedOnly.find((f) => f.factKey === "surfaceGravity")!;
    expect(g).toMatchObject({ predicate: "planet.surface_gravity", insert: "1.6 g", sourceKind: "worksheet" });
    expect(g.outrankedBy).toBeUndefined();
  });

  it("a stored canon fact leads, and the projected value it outranks is kept and marked", () => {
    const facts = buildWorldFacts({ ...input, asserted: [row({ id: "c1" })] });
    expect(facts[0]).toMatchObject({
      confidence: "canon",
      sourceKind: "canon",
      insert: "1.4 g",
      label: "Surface gravity",
      entityId: "kellis",
      factId: "c1",
      href: "/worlds/w/codex/kellis",
      provenance: "Manual entry",
    });
    expect(sourceLine(facts[0])).toBe("Canon · Kellis");
    const g = facts.find((f) => f.sourceKind === "worksheet" && f.factKey === "surfaceGravity")!;
    expect(g.outrankedBy).toBe(facts[0].ref);
    // Untouched slots and every projected value survive byte-identical.
    expect(strip(facts.slice(1)).map(({ outrankedBy: _o, ...r }) => r)).toEqual(strip(projectedOnly));
    expect(facts.find((f) => f.factKey === "dayLength")?.outrankedBy).toBeUndefined();
  });

  it("proposed facts sit after canon, carry their row, and outrank projection", () => {
    const facts = buildWorldFacts({
      ...input,
      asserted: [
        row({ id: "p1", confidence: "proposed", source_kind: "prose", value_text: "1.5 g", value: { kind: "scalar", value: 1.5, unit: "g" } }),
        row({ id: "c1", predicate: "planet.rotation_period", value: { kind: "scalar", value: 28, unit: "hours" }, value_text: "28 h" }),
      ],
    });
    expect(facts.slice(0, 2).map((f) => f.confidence)).toEqual(["canon", "proposed"]);
    expect(facts[1]).toMatchObject({ sourceId: "p1", provenance: "Prose" });
    expect(facts.find((f) => f.factKey === "surfaceGravity" && f.sourceKind === "worksheet")?.outrankedBy).toBe(facts[1].ref);
    expect(facts.find((f) => f.factKey === "dayLength")?.outrankedBy).toBe(facts[0].ref);
  });

  it("ignores superseded rows", () => {
    const facts = buildWorldFacts({ ...input, asserted: [row({ id: "c0", superseded_at: "2026-10-02T00:00:00Z" })] });
    expect(facts).toEqual(projectedOnly);
  });

  it("canon refs name the slot, so a cited canon value survives a supersede as STALE", () => {
    const before = buildWorldFacts({ ...input, asserted: [row({ id: "c1" })] })[0];
    const attrs = sanitizeFactRefAttrs(factToRefAttrs(before));
    expect(attrs.sourceKind).toBe("canon");
    expect(factRefId(attrs)).toBe(before.ref);

    const after = buildWorldFacts({
      ...input,
      asserted: [row({ id: "c1", superseded_at: "2026-10-03T00:00:00Z" }), row({ id: "c2", value_text: "1.5 g" })],
    });
    const live = after.find((f) => f.ref === before.ref);
    expect(factRefStatus(attrs, live)).toEqual({ state: "stale", was: "1.4 g", now: "1.5 g" });
  });

  it("source_ref with a tool and worksheet routes back to that worksheet", () => {
    const [f] = buildWorldFacts({
      ...input,
      asserted: [row({ id: "c1", source_kind: "tool", source_ref: { tool: "surface-gravity-calculator", worksheet_id: "ws-9" } })],
    });
    expect(f.href).toBe("/tools/surface-gravity-calculator?worldId=w&worksheetId=ws-9");
  });
});
