import { describe, expect, it } from "vitest";
import { bindClaim, buildBindContext, type BoundClaim } from "@/lib/writing/capture/bind";
import { detectParagraph, type Paragraph } from "@/lib/writing/capture/detect";
import {
  buildCaptureItems,
  claimAssertion,
  classifyClaim,
  compareClaim,
  contradictionKey,
  contradictionSummaryLine,
  countItems,
  indexFactsByPredicate,
  mergeContinuity,
  type LedgerFact,
} from "@/lib/writing/capture/ledger";
import { captureHtml, createCaptureCache } from "@/lib/writing/capture";

const ENTITIES = [
  { id: "kellis", entity_type: "planet" },
  { id: "vorn", entity_type: "planet" },
  { id: "sol", entity_type: "star" },
  { id: "spires", entity_type: "location" },
  { id: "mira", entity_type: "character" },
  { id: "meridian", entity_type: "vessel" },
  { id: "hessi", entity_type: "species" },
];

/** A paragraph with "@Name" mentions turned into mention spans. */
function para(text: string, ids: Record<string, string> = {}): Paragraph {
  const mentions = Object.entries(ids).map(([label, id]) => {
    const start = text.indexOf(label);
    if (start < 0) throw new Error(`no ${label} in ${text}`);
    return { id, start, end: start + label.length };
  });
  return { text, mentions };
}

function bindFirst(p: Paragraph, scene = {}, entities = ENTITIES): BoundClaim | null {
  const [raw] = detectParagraph(p);
  expect(raw, p.text).toBeDefined();
  return bindClaim(raw, p, buildBindContext(entities, scene));
}

const fact = (f: Partial<LedgerFact> & Pick<LedgerFact, "predicate" | "insert">): LedgerFact => ({
  ref: `ref:${f.predicate}:${f.entityId ?? ""}:${f.insert}`,
  entityId: null,
  label: "Fact",
  value: f.insert,
  confidence: "projected",
  href: "/tools/x",
  toolLabel: "Genesis",
  sourceTitle: "Kellis",
  ...f,
});

describe("bindClaim", () => {
  it("binds to a fitting entity named in the sentence", () => {
    const b = bindFirst(para("Kellis has 1.6 g of gravity.", { Kellis: "kellis" }));
    expect(b?.subjectId).toBe("kellis");
    expect(b?.reason).toBe("NAMED IN SENTENCE");
  });

  it("skips a named entity of the wrong type", () => {
    const b = bindFirst(para("Mira felt 1.6 g of gravity on Kellis.", { Mira: "mira", Kellis: "kellis" }));
    expect(b?.subjectId).toBe("kellis");
  });

  it("falls back to the paragraph, then the scene", () => {
    let b = bindFirst(para("Kellis waited. Its gravity was 1.6 g.", { Kellis: "kellis" }));
    expect(b?.subjectId).toBe("kellis");
    b = bindFirst(para("The planet's gravity was 1.6 g."), { settingBodyId: "vorn" });
    expect(b?.subjectId).toBe("vorn");
    expect(b?.reason).toBe("SETTING");
    b = bindFirst(para("The planet's gravity was 1.6 g."), { subjectEntityId: "kellis", settingBodyId: "vorn" });
    expect(b?.reason).toBe("SUBJECT");
  });

  it("binds the only fitting entity on file, and nothing when there are several", () => {
    const onePlanet = ENTITIES.filter((e) => e.id !== "vorn");
    let b = bindFirst(para("The planet's gravity was 1.6 g."), {}, onePlanet);
    expect(b?.subjectId).toBe("kellis");
    expect(b?.reason).toBe("ONLY ONE ON FILE");
    b = bindFirst(para("The planet's gravity was 1.6 g."));
    expect(b?.subjectId).toBeNull();
    expect(b?.reason).toBeNull();
  });

  it("never uses ONLY ONE ON FILE for vessels", () => {
    const b = bindFirst(para("A crew of 4 crammed into the shuttle."));
    expect(b?.subjectId).toBeNull();
  });

  it("chooses the height predicate by subject type, and drops unnamed heights", () => {
    let b = bindFirst(para("The Spires rise a mile and a half through the cloud deck.", { Spires: "spires" }));
    expect(b?.predicate).toBe("place.height");
    b = bindFirst(para("Mira stood two meters tall.", { Mira: "mira" }));
    expect(b?.predicate).toBe("character.height");
    b = bindFirst(para("The tower rose 300 meters."), { setInPlaceId: "spires" });
    expect(b).toBeNull();
  });

  it("binds a first-person height to the POV", () => {
    const b = bindFirst(para("I stood two meters tall among them."), { povEntityId: "mira" });
    expect(b?.subjectId).toBe("mira");
    expect(b?.reason).toBe("POV");
  });

  it("drops a named-only claim about the wrong kind of thing", () => {
    expect(bindFirst(para("Mira is 34 years old.", { Mira: "mira" }))).toBeNull();
    const star = bindFirst(para("Sol is 4.6 billion years old.", { Sol: "sol" }));
    expect(star?.predicate).toBe("star.age");
    expect(star?.subjectId).toBe("sol");
  });
});

describe("compareClaim and classifyClaim", () => {
  const g = (text: string, scene = { settingBodyId: "kellis" }) => bindFirst(para(text), scene)!;

  it("agrees within the writer's precision", () => {
    const c = g("The planet's gravity was 1.5 g.");
    expect(compareClaim(c, fact({ predicate: "planet.surface_gravity", insert: "1.47 g" }))).toBe("agree");
    expect(compareClaim(c, fact({ predicate: "planet.surface_gravity", insert: "1.4 g" }))).toBe("disagree");
    expect(compareClaim(c, fact({ predicate: "planet.surface_gravity", insert: "heavy" }))).toBe("unknown");
  });

  it("widens for hedged figures and compares counts exactly", () => {
    const exact = bindFirst(para("The Meridian carried a crew of 400.", { Meridian: "meridian" }))!;
    expect(compareClaim(exact, fact({ predicate: "vessel.crew_size", insert: "412" }))).toBe("disagree");
    const hedged = bindFirst(para("The Meridian carried a crew of about 400.", { Meridian: "meridian" }))!;
    expect(compareClaim(hedged, fact({ predicate: "vessel.crew_size", insert: "412" }))).toBe("agree");
  });

  it("compares spectral classes by letter, and subclass when both give one", () => {
    const c = bindFirst(para("Kellis orbits a red dwarf.", { Kellis: "kellis" }), {}, [
      ...ENTITIES.filter((e) => e.id !== "sol"),
      { id: "sol", entity_type: "star" },
    ])!;
    expect(compareClaim(c, fact({ predicate: "star.spectral_class", insert: "M4V" }))).toBe("agree");
    expect(compareClaim(c, fact({ predicate: "star.spectral_class", insert: "K7V" }))).toBe("disagree");
    expect(compareClaim(c, fact({ predicate: "star.spectral_class", insert: "Red Dwarf (M-type)" }))).toBe("agree");
  });

  it("converts units before comparing", () => {
    const c = g("The mean temperature was 15 °C.");
    expect(compareClaim(c, fact({ predicate: "planet.temp_mean", insert: "288 K" }))).toBe("agree");
    expect(compareClaim(c, fact({ predicate: "planet.temp_mean", insert: "250 K" }))).toBe("disagree");
  });

  it("classifies against the subject's facts, then unscoped ones, never another subject's", () => {
    const c = g("The planet's gravity was 1.6 g.");
    let idx = indexFactsByPredicate([fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "vorn" })]);
    expect(classifyClaim(c, idx).status).toBe("not-on-file");
    idx = indexFactsByPredicate([fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "kellis" })]);
    expect(classifyClaim(c, idx).status).toBe("contradiction");
    idx = indexFactsByPredicate([fact({ predicate: "planet.surface_gravity", insert: "1.6 g" })]);
    expect(classifyClaim(c, idx).status).toBe("agrees");
  });

  it("compares with canon alone when canon exists", () => {
    const c = g("The planet's gravity was 1.6 g.");
    const idx = indexFactsByPredicate([
      fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "kellis", confidence: "canon" }),
      fact({ predicate: "planet.surface_gravity", insert: "1.6 g", entityId: "kellis", confidence: "projected" }),
    ]);
    const cls = classifyClaim(c, idx);
    expect(cls.status).toBe("contradiction");
    if (cls.status === "contradiction") expect(cls.fact.confidence).toBe("canon");
  });

  it("agrees when any non-canon source agrees (S-FIX)", () => {
    const c = g("The planet's gravity was 1.6 g.");
    const idx = indexFactsByPredicate([
      fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "kellis" }),
      fact({ predicate: "planet.surface_gravity", insert: "1.6 g", entityId: "kellis", ref: "b" }),
    ]);
    expect(classifyClaim(c, idx).status).toBe("agrees");
  });

  it("ignores outranked facts and resolves predicate aliases", () => {
    const idx = indexFactsByPredicate([
      fact({ predicate: "surfaceGravity", insert: "1.4 g", entityId: "kellis" }),
      fact({ predicate: "planet.surface_gravity", insert: "9 g", entityId: "kellis", outrankedBy: "x" }),
    ]);
    expect(idx.get("planet.surface_gravity")).toHaveLength(1);
  });

  it("skips an unbound claim when another subject has it on file", () => {
    const c = bindFirst(para("The planet's gravity was 1.6 g."))!;
    expect(c.subjectId).toBeNull();
    const idx = indexFactsByPredicate([fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "kellis" })]);
    expect(classifyClaim(c, idx).status).toBe("skip");
  });
});

describe("buildCaptureItems and resolutions", () => {
  const ctx = buildBindContext(ENTITIES, { settingBodyId: "kellis" });
  const html =
    "<p>The planet's gravity was 1.6 g.</p><p>Its day lasts 30 hours.</p>" +
    '<p><entity-mention data-id="meridian" data-label="Meridian">Meridian</entity-mention> carried a crew of 400.</p>';
  const facts = [
    fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "kellis", confidence: "canon", factId: "f1" }),
    fact({ predicate: "vessel.crew_size", insert: "400", entityId: "meridian" }),
  ];

  it("lists claims not on file and contradictions, in reading order", () => {
    const items = captureHtml("doc1", html, createCaptureCache(), ctx, indexFactsByPredicate(facts));
    expect(items.map((i) => `${i.kind}:${i.claim.predicate}:${i.paragraphIndex}`)).toEqual([
      "contradiction:planet.surface_gravity:0",
      "claim:planet.rotation_period:1",
    ]);
    expect(countItems(items)).toEqual({ claims: 1, contradictions: 1 });
    expect(items[0].valueText).toBe("1.6 g");
  });

  it("hides what the writer resolved, until the canon value changes", () => {
    const index = indexFactsByPredicate(facts);
    const items = captureHtml("doc1", html, createCaptureCache(), ctx, index);
    const res = Object.fromEntries(items.map((i) => [i.key, { r: "dismissed" as const, at: "t" }]));
    expect(captureHtml("doc1", html, createCaptureCache(), ctx, index, res)).toEqual([]);
    const moved = indexFactsByPredicate([{ ...facts[0], insert: "1.3 g" }, facts[1]]);
    const again = captureHtml("doc1", html, createCaptureCache(), ctx, moved, res);
    expect(again.map((i) => i.kind)).toEqual(["contradiction"]);
    expect(again[0].key).toBe(contradictionKey(again[0].hash, { ref: facts[0].ref, insert: "1.3 g" }));
  });

  it("buildCaptureItems with no claims is empty", () => {
    expect(buildCaptureItems("d", [[]], new Map())).toEqual([]);
  });
});

describe("mergeContinuity", () => {
  const note = (factKey: string) => ({
    factKey,
    factLabel: "Surface Gravity",
    worldValue: "1.4",
    proseValue: "1.6",
    excerpt: "The planet's gravity was 1.6 g.",
    message: "m",
  });

  it("drops findings a capture contradiction already says, and resolved ones", () => {
    const ctx = buildBindContext(ENTITIES, { settingBodyId: "kellis" });
    const items = captureHtml(
      "d",
      "<p>The planet's gravity was 1.6 g.</p>",
      createCaptureCache(),
      ctx,
      indexFactsByPredicate([fact({ predicate: "planet.surface_gravity", insert: "1.4 g", entityId: "kellis" })]),
    );
    expect(mergeContinuity([note("surfaceGravity"), note("dayLength")], items).map((n) => n.factKey)).toEqual([
      "dayLength",
    ]);
    const [kept] = mergeContinuity([note("dayLength")], []);
    expect(mergeContinuity([note("dayLength")], [], { [kept.key]: { r: "dismissed", at: "t" } })).toEqual([]);
  });

  it("claimAssertion writes the typed value and points back at the prose", () => {
    const ctx = buildBindContext(ENTITIES, { settingBodyId: "kellis" });
    const [g, crew, star] = captureHtml(
      "doc9",
      "<p>The planet's gravity was 1.6 g.</p>" +
        '<p><entity-mention data-id="meridian" data-label="Meridian">Meridian</entity-mention> had a crew of forty.</p>' +
        '<p><entity-mention data-id="kellis" data-label="Kellis">Kellis</entity-mention> orbits a red dwarf.</p>',
      createCaptureCache(),
      ctx,
      new Map(),
    );
    const a = claimAssertion(g);
    expect(a).toMatchObject({
      subjectId: "kellis",
      predicate: "planet.surface_gravity",
      value: { kind: "scalar", value: 1.6, unit: "g" },
      valueText: "1.6 g",
      sourceRef: { document_id: "doc9", excerpt: "The planet's gravity was 1.6 g.", paragraph: 0, rule: "gravity", bound_by: "SETTING" },
    });
    // The match is "gravity was 1.6 g", starting at "gravity".
    expect(a.sourceRef.offset).toBe(13);
    expect(a.sourceRef.match).toBe("gravity was 1.6 g");
    expect(claimAssertion(crew).value).toEqual({ kind: "scalar", value: 40 });
    expect(claimAssertion(star).value).toEqual({ kind: "enum", value: "M" });
  });

  it("summary line", () => {
    expect(contradictionSummaryLine(1)).toBe("1 CONTRADICTION");
    expect(contradictionSummaryLine(4)).toBe("4 CONTRADICTIONS");
  });
});
