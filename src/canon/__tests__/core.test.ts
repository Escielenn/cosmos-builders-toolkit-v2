import { describe, it, expect } from "vitest";
import { createCanon, CanonError, type AssertInput } from "@/canon/core";
import { memoryStore } from "./memory-store";

const g = (value: number): AssertInput => ({
  worldId: "w",
  subjectId: "kellis",
  predicate: "planet.surface_gravity",
  value: { kind: "scalar", value, unit: "g" },
  sourceKind: "manual",
});

function setup() {
  const mem = memoryStore();
  return { ...mem, canon: createCanon(mem.store) };
}

describe("canon.assert: never silently overwrites canon", () => {
  it("creates canon by default, with a display string", async () => {
    const { canon } = setup();
    const r = await canon.assert(g(1.4));
    expect(r.status).toBe("created");
    if (r.status !== "created") return;
    expect(r.fact).toMatchObject({ confidence: "canon", value_text: "1.4 g", predicate: "planet.surface_gravity" });
  });

  it("the same value again is unchanged, not a second row", async () => {
    const { canon, rows } = setup();
    await canon.assert(g(1.4));
    const r = await canon.assert(g(1.4));
    expect(r.status).toBe("unchanged");
    expect(rows.size).toBe(1);
  });

  it("a different value returns conflict with the existing fact and changes nothing", async () => {
    const { canon, rows } = setup();
    const first = await canon.assert(g(1.4));
    const r = await canon.assert(g(1.6));
    expect(r.status).toBe("conflict");
    if (r.status !== "conflict" || first.status !== "created") return;
    expect(r.existing.id).toBe(first.fact.id);
    expect(rows.size).toBe(1);
    expect([...rows.values()][0]).toMatchObject({ superseded_at: null, value: { value: 1.4 } });
  });

  it("supersede:true is explicit: retires the old row (kept) and writes the new", async () => {
    const { canon, rows } = setup();
    const first = await canon.assert(g(1.4));
    const r = await canon.assert({ ...g(1.6), supersede: true });
    expect(r.status).toBe("created");
    if (r.status !== "created" || first.status !== "created") return;
    expect(r.superseded?.id).toBe(first.fact.id);
    expect(rows.get(first.fact.id)?.superseded_at).not.toBeNull();
    const live = await canon.rows("w");
    expect(live.map((x) => x.value)).toEqual([{ kind: "scalar", value: 1.6, unit: "g" }]);
  });

  it("a failed supersede restores the old canon fact", async () => {
    const { canon, rows, failNext } = setup();
    const first = await canon.assert(g(1.4));
    failNext.insert = { code: "23514", message: "violates check constraint" };
    await expect(canon.assert({ ...g(1.6), supersede: true })).rejects.toThrow("PARAMETERS OUTSIDE OPERATIONAL RANGE.");
    if (first.status !== "created") return;
    expect(rows.get(first.fact.id)?.superseded_at).toBeNull();
  });

  it("deprecated spellings write the canonical predicate and still conflict", async () => {
    const { canon } = setup();
    await canon.assert({ ...g(1), predicate: "planet.mass", value: { kind: "scalar", value: 1, unit: "earth_masses" } });
    const r = await canon.assert({ ...g(2), predicate: "planet.mass_earths", value: { kind: "scalar", value: 2, unit: "earth_masses" } });
    expect(r.status).toBe("conflict");
  });

  it("world-level facts (no subject) obey the same rule", async () => {
    const { canon } = setup();
    const lie = (v: string): AssertInput => ({ worldId: "w", predicate: "world.axiom", value: { kind: "text", value: v }, sourceKind: "tool" });
    await canon.assert(lie("FTL by folding"));
    expect((await canon.assert(lie("No FTL"))).status).toBe("conflict");
  });

  it("rejects predicates outside the vocabulary in Ship's Voice", async () => {
    const { canon } = setup();
    await expect(canon.assert({ ...g(1), predicate: "atlas.gravity" })).rejects.toBeInstanceOf(CanonError);
    await expect(canon.assert({ ...g(1), predicate: "atlas.gravity" })).rejects.toThrow(/^PREDICATE NOT IN VOCABULARY/);
  });

  it("maps a lost race on the unique index to RECORD CONFLICT", async () => {
    const { canon, store } = setup();
    // Simulate a second writer landing between the check and the insert.
    const racing = { ...store, findLiveCanon: async () => null };
    await canon.assert(g(1.4));
    await expect(createCanon(racing).assert(g(1.6))).rejects.toThrow("RECORD CONFLICT. ENTRY ALREADY ON FILE.");
  });
});

describe("canon.propose / promote / retract", () => {
  it("proposals never conflict; several may coexist with canon", async () => {
    const { canon } = setup();
    await canon.assert(g(1.4));
    expect((await canon.propose({ ...g(1.6), sourceKind: "prose" })).status).toBe("created");
    expect((await canon.propose({ ...g(1.7), sourceKind: "prose" })).status).toBe("created");
    expect((await canon.rows("w")).map((r) => r.confidence).sort()).toEqual(["canon", "proposed", "proposed"]);
  });

  it("promote turns a proposal into canon when the slot is empty", async () => {
    const { canon } = setup();
    const p = await canon.propose(g(1.6));
    if (p.status !== "created") throw new Error("setup");
    const r = await canon.promote(p.fact.id);
    expect(r).toMatchObject({ status: "created", fact: { id: p.fact.id, confidence: "canon" } });
  });

  it("promote follows the conflict rule, and supersedes only when asked", async () => {
    const { canon, rows } = setup();
    const c = await canon.assert(g(1.4));
    const p = await canon.propose(g(1.6));
    if (p.status !== "created" || c.status !== "created") throw new Error("setup");

    const blocked = await canon.promote(p.fact.id);
    expect(blocked).toMatchObject({ status: "conflict", existing: { id: c.fact.id } });
    expect(rows.get(p.fact.id)?.confidence).toBe("proposed");

    const ok = await canon.promote(p.fact.id, { supersede: true });
    expect(ok).toMatchObject({ status: "created", superseded: { id: c.fact.id } });
    expect(rows.get(c.fact.id)?.superseded_at).not.toBeNull();
    expect(rows.get(p.fact.id)?.confidence).toBe("canon");
  });

  it("promoting a proposal that matches canon is unchanged", async () => {
    const { canon } = setup();
    await canon.assert(g(1.4));
    const p = await canon.propose(g(1.4));
    if (p.status !== "created") throw new Error("setup");
    expect((await canon.promote(p.fact.id)).status).toBe("unchanged");
  });

  it("retract keeps the row with superseded_at set; missing ids are not on file", async () => {
    const { canon, rows } = setup();
    const c = await canon.assert(g(1.4));
    if (c.status !== "created") throw new Error("setup");
    const r = await canon.retract(c.fact.id);
    expect(r.superseded_at).not.toBeNull();
    expect(rows.size).toBe(1);
    expect(await canon.rows("w")).toEqual([]);
    // The slot is free again.
    expect((await canon.assert(g(1.9))).status).toBe("created");
    await expect(canon.retract("nope")).rejects.toThrow("COORDINATES DO NOT MATCH ANY KNOWN RECORD.");
  });
});

describe("canon.facts", () => {
  it("unions stored rows with a supplied projection, canon first", async () => {
    const { canon } = setup();
    await canon.assert(g(1.4));
    const facts = await canon.facts("w", {
      projected: [
        {
          ref: "worksheet:ws:surfaceGravity",
          factKey: "surfaceGravity",
          label: "Surface Gravity (g)",
          value: "1.6",
          insert: "1.6 g",
          entityId: "kellis",
          href: null,
          sourceKind: "worksheet",
          toolLabel: "Genesis",
          sourceTitle: "Kellis Prime",
          tool: "planetary-profile",
        },
        {
          ref: "worksheet:ws:dayLength",
          factKey: "dayLength",
          label: "Day Length (hours)",
          value: "30",
          insert: "30 hours",
          entityId: "kellis",
          href: null,
          sourceKind: "worksheet",
          toolLabel: "Genesis",
          sourceTitle: "Kellis Prime",
          tool: "planetary-profile",
        },
      ],
    });
    expect(facts.map((f) => [f.predicate, f.confidence, f.valueText])).toEqual([
      ["planet.surface_gravity", "canon", "1.4 g"],
      ["planet.rotation_period", "projected", "30 hours"],
    ]);
    expect(facts[0].conflicted).toBe(true);
  });

  it("uses the projector when no projection is supplied", async () => {
    const mem = memoryStore();
    let asked = "";
    const c = createCanon(mem.store, async (worldId) => {
      asked = worldId;
      return [];
    });
    expect(await c.facts("w")).toEqual([]);
    expect(asked).toBe("w");
  });
});

describe("canon.annotate: both are right (epoch boundary note)", () => {
  const note = { note: "after the terraforming", prose_value: "1.6 g", document_id: "d1", excerpt: "It was 1.6 g." };

  it("appends to source_ref.epoch_notes and changes nothing else", async () => {
    const { canon } = setup();
    const r = await canon.assert({ ...g(1.4), sourceRef: { tool: "atlas" } });
    if (r.status !== "created") throw new Error("setup");
    const a = await canon.annotate(r.fact.id, note);
    expect(a.value).toEqual(r.fact.value);
    expect(a.confidence).toBe("canon");
    expect(a.source_ref.tool).toBe("atlas");
    expect(a.source_ref.epoch_notes).toHaveLength(1);
    const b = await canon.annotate(r.fact.id, { ...note, note: "" });
    const notes = b.source_ref.epoch_notes as Array<{ note: string; at: string }>;
    expect(notes.map((n) => n.note)).toEqual(["after the terraforming", ""]);
    expect(notes[0].at).toBeTruthy();
  });

  it("refuses a retracted or missing fact", async () => {
    const { canon } = setup();
    const r = await canon.assert(g(1.4));
    if (r.status !== "created") throw new Error("setup");
    await canon.retract(r.fact.id);
    await expect(canon.annotate(r.fact.id, note)).rejects.toBeInstanceOf(CanonError);
    await expect(canon.annotate("nope", note)).rejects.toBeInstanceOf(CanonError);
  });
});
