import { describe, it, expect } from "vitest";
import {
  buildBackMatter,
  mentionedEntities,
  selectDramatis,
  selectGlossary,
  selectSeriesBible,
  type BackMatterEntity,
  type BackMatterFact,
} from "@/lib/manuscript/back-matter";
import { DEFAULT_COMPILE, buildManuscript, type CompileNode } from "@/lib/manuscript/compile";
import { manuscriptToMarkdown, manuscriptToText } from "@/lib/manuscript/text-formats";
import { toBackMatterEntity, toBackMatterFact } from "@/lib/manuscript/back-matter-data";
import { runsText } from "@/lib/manuscript/blocks";
import type { Entity } from "@/services/entity-graph-types";
import type { CanonFact } from "@/canon/types";

const ent = (id: string, name: string, type: string, extra: Partial<BackMatterEntity> = {}): BackMatterEntity => ({
  id,
  name,
  type,
  typeLabel: type === "character" ? "Character" : type[0].toUpperCase() + type.slice(1),
  summary: `${name} summary.`,
  ...extra,
});

const MARA = ent("c-mara", "Mara Voss", "character", { role: "Pilot", aliases: ["the Pilot"] });
const OREN = ent("c-oren", "Oren", "character", { role: "Archivist" });
const IDA = ent("c-ida", "Ida", "character");
const KELLIS = ent("p-kellis", "Kellis", "planet");
const VEIL = ent("x-veil", "The Veil", "concept", { summary: null });
const ALL = [MARA, OREN, IDA, KELLIS, VEIL];

const fact = (subjectName: string | null, label: string, valueText: string, layer: BackMatterFact["layer"], confidence = "canon"): BackMatterFact => ({
  subjectId: subjectName ? `s-${subjectName}` : null,
  subjectName,
  label,
  valueText,
  confidence,
  layer,
});

describe("mention detection", () => {
  it("finds explicit mentions and plain names, by first appearance across documents", () => {
    const docs = [
      `<p>The storm hid <entity-mention data-id="p-kellis" data-label="Kellis">@Kellis</entity-mention>.</p>`,
      `<p>Oren waited. Mara Voss landed.</p><p>Oren again.</p>`,
    ];
    expect(mentionedEntities(docs, ALL).map((m) => m.entity.id)).toEqual(["p-kellis", "c-oren", "c-mara"]);
  });

  it("matches whole words with their capitalisation only", () => {
    const docs = ["<p>Orens and oren and Idaho, but not Ida-less? Ida.</p>"];
    // "Ida-less" has Ida as a whole word (hyphen is a boundary); Orens and oren are not Oren.
    expect(mentionedEntities(docs, ALL).map((m) => m.entity.id)).toEqual(["c-ida"]);
  });

  it("matches aliases and wiki links", () => {
    const docs = [`<p>the Pilot</p><p><wiki-link data-element-id="x-veil" data-title="The Veil">V</wiki-link></p>`];
    expect(mentionedEntities(docs, ALL).map((m) => m.entity.id)).toEqual(["c-mara", "x-veil"]);
  });

  it("ignores names shorter than three letters and unknown ids", () => {
    const docs = [`<p>Al <entity-mention data-id="nope">@X</entity-mention></p>`];
    expect(mentionedEntities(docs, [ent("a", "Al", "character")])).toEqual([]);
  });
});

describe("selection", () => {
  const mentions = mentionedEntities(["<p>Oren, Kellis, Mara Voss, The Veil.</p>"], ALL);

  it("dramatis personae: characters by first appearance", () => {
    expect(selectDramatis(mentions).map((e) => e.name)).toEqual(["Oren", "Mara Voss"]);
  });

  it("glossary: alphabetical; characters only when the dramatis is off", () => {
    expect(selectGlossary(mentions, true).map((e) => e.name)).toEqual(["Kellis", "The Veil"]);
    expect(selectGlossary(mentions, false).map((e) => e.name)).toEqual(["Kellis", "Mara Voss", "Oren", "The Veil"]);
  });

  it("series bible: canon only, grouped in cascade order", () => {
    const facts = [
      fact("Kellis", "Culture Note", "Salt rites", "culture"),
      fact("Kellis", "Surface Gravity", "1.4 g", "physics"),
      fact("Kellis", "Day Length", "34 h", "physics", "proposed"),
      fact(null, "Founding Year", "2210", "other"),
      fact("Kellis", "Mean Temperature", "", "environment"),
      fact("Aster", "Albedo", "0.3", "physics", "projected"),
      fact("Aster", "Mass", "1.1 M⊕", "physics"),
    ];
    const groups = selectSeriesBible(facts);
    expect(groups.map((g) => g.layer)).toEqual(["physics", "culture", "other"]);
    expect(groups[0].facts.map((f) => `${f.subjectName}/${f.label}`)).toEqual(["Aster/Mass", "Kellis/Surface Gravity"]);
  });
});

describe("compile integration", () => {
  const tree: CompileNode[] = [
    {
      id: "f1",
      title: "Chapter One",
      isFolder: true,
      html: "",
      children: [
        { id: "d1", title: "Scene", isFolder: false, html: "<p>Oren met Mara Voss on Kellis.</p>", children: [] },
        { id: "d2", title: "Cut", isFolder: false, html: "<p>Ida appears only here.</p>", children: [] },
      ],
    },
  ];
  const data = { entities: ALL, facts: [fact("Kellis", "Surface Gravity", "1.4 g", "physics")] };
  const settings = { ...DEFAULT_COMPILE, includeGlossary: true, includeDramatis: true, includeSeriesBible: true, excluded: ["d2"] };

  it("only included documents count", () => {
    const m = buildManuscript(tree, settings, { backMatter: data });
    const dramatis = m.backMatter.find((b) => b.id === "dramatis")!;
    expect(dramatis.blocks.map((b) => (b.type === "p" ? runsText(b.runs) : ""))).toEqual([
      "Oren (Archivist): Oren summary.",
      "Mara Voss (Pilot): Mara Voss summary.",
    ]);
    expect(m.backMatter.map((b) => b.id)).toEqual(["dramatis", "glossary", "bible"]);
  });

  it("off by default, and nothing without data", () => {
    expect(buildManuscript(tree, DEFAULT_COMPILE, { backMatter: data }).backMatter).toEqual([]);
    expect(buildManuscript(tree, settings).backMatter).toEqual([]);
  });

  it("prints in markdown and plain text", () => {
    const m = buildManuscript(tree, settings, { backMatter: data });
    const md = manuscriptToMarkdown(m);
    expect(md).toContain("## Dramatis Personae");
    expect(md).toContain("**Kellis** (Planet): Kellis summary.");
    expect(md).toContain("## Appendix: Series Bible");
    expect(md).toContain("- *Kellis ·* Surface Gravity: 1.4 g");
    const txt = manuscriptToText(m);
    expect(txt).toContain("GLOSSARY");
    expect(txt).toContain("Kellis (Planet): Kellis summary.");
  });

  it("an empty section is left out", () => {
    const out = buildBackMatter(["<p>nobody</p>"], { glossary: true, dramatis: true, seriesBible: true }, { entities: ALL, facts: [] });
    expect(out).toEqual([]);
  });
});

describe("data adapters", () => {
  it("reads role and aliases from a character's dossier fields", () => {
    const e = {
      id: "c1",
      name: "Mara Voss",
      entity_type: "character",
      custom_type_label: null,
      summary: null,
      description: "A pilot.",
      metadata: { characterRole: "Pilot", characterAliases: "Mara; the Pilot" },
    } as unknown as Entity;
    expect(toBackMatterEntity(e)).toMatchObject({ role: "Pilot", aliases: ["Mara", "the Pilot"], summary: "A pilot.", typeLabel: "Character" });
  });

  it("places a fact on its predicate's cascade layer", () => {
    const f = { subjectId: "p1", predicate: "nope.unknown", label: "X", valueText: "1", confidence: "canon" } as unknown as CanonFact;
    expect(toBackMatterFact(f, () => "Kellis")).toMatchObject({ layer: "other", subjectName: "Kellis" });
  });
});
