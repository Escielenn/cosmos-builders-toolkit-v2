import { describe, expect, it } from "vitest";
import {
  MAX_ALIASES,
  MAX_CUSTOM_TERMS,
  buildWorldLexicon,
  canonTerms,
  lexiconWords,
  sanitizeLexicon,
  stripPossessive,
  upsertCustomTerm,
  type CustomTerm,
} from "./lexicon";

describe("lexiconWords", () => {
  it("splits a name into dictionary words", () => {
    expect(lexiconWords("Kellis Prime")).toEqual(["Kellis", "Prime"]);
  });
  it("keeps apostrophe and hyphen forms whole and adds their parts", () => {
    expect(lexiconWords("K'thar Vault-born")).toEqual(["K'thar", "thar", "Vault-born", "Vault", "born"]);
  });
  it("reads a curly apostrophe as a plain one", () => {
    expect(lexiconWords("K’thar")).toContain("K'thar");
  });
  it("drops single letters and bare numbers", () => {
    expect(lexiconWords("A 42 Xi")).toEqual(["Xi"]);
  });
});

describe("stripPossessive", () => {
  it("separates 's and a plural possessive", () => {
    expect(stripPossessive("Kellis's")).toEqual({ stem: "Kellis", suffix: "'s" });
    expect(stripPossessive("Vaultborns'")).toEqual({ stem: "Vaultborns", suffix: "'" });
    expect(stripPossessive("Kellis")).toEqual({ stem: "Kellis", suffix: "" });
  });
});

describe("canonTerms", () => {
  it("takes a short value whole", () => {
    expect(canonTerms("Kellis Prime")).toEqual(["Kellis", "Prime"]);
  });
  it("skips the sentence-opening capital in running text", () => {
    expect(canonTerms("The colony was founded by the Vaultborn after Orrin left. Then nothing.")).toEqual([
      "Vaultborn",
      "Orrin",
    ]);
  });
  it("ignores empty and oversized values", () => {
    expect(canonTerms("")).toEqual([]);
    expect(canonTerms("x".repeat(401))).toEqual([]);
  });
});

describe("buildWorldLexicon", () => {
  const lexicon = buildWorldLexicon({
    entities: [
      { id: "e1", name: "Kellis Prime", aliases: ["The Lantern"] },
      { id: "e2", name: "Orrin Vale", typeLabel: "Vaultborn clan" },
    ],
    typeLabels: ["Driftwright"],
    canonStrings: ["Ashmere", "The fleet answers to Thessaly now."],
    eventTitles: ["The Sundering of Marrow Gate"],
    povNames: ["Jessa"],
    custom: [{ term: "grav-sick", note: "", aliases: ["gravsick"] }],
  });

  it("accepts every word of every source", () => {
    for (const w of ["Kellis", "Prime", "Lantern", "Orrin", "Vale", "Vaultborn", "Driftwright", "Ashmere", "Thessaly", "Sundering", "Marrow", "Jessa", "grav-sick", "gravsick"]) {
      expect(lexicon.accepts(w), w).toBe(true);
    }
  });
  it("accepts possessives and sentence-case or all-caps forms", () => {
    expect(lexicon.accepts("Kellis's")).toBe(true);
    expect(lexicon.accepts("Kellis’s")).toBe(true);
    expect(lexicon.accepts("KELLIS")).toBe(true);
    expect(lexicon.accepts("Grav-sick")).toBe(true);
  });
  it("does not accept a lower-case slip of a name, or a near miss", () => {
    expect(lexicon.accepts("kellis")).toBe(false);
    expect(lexicon.accepts("Kelis")).toBe(false);
    expect(lexicon.accepts("Vaultborns")).toBe(false);
  });
  it("records where each name came from, Codex first", () => {
    expect(lexicon.names.find((n) => n.name === "Kellis Prime")).toEqual({ name: "Kellis Prime", source: "codex", entityId: "e1" });
    expect(lexicon.names.find((n) => n.name === "The Lantern")).toMatchObject({ source: "alias", entityId: "e1" });
    expect(lexicon.counts).toMatchObject({ codex: 2, alias: 1, type: 2, pov: 1, chronicle: 1 });
  });
  it("has a signature that follows the word list", () => {
    const same = buildWorldLexicon({ entities: [{ id: "e1", name: "Kellis" }] });
    const again = buildWorldLexicon({ entities: [{ id: "other", name: "Kellis" }] });
    const renamed = buildWorldLexicon({ entities: [{ id: "e1", name: "Kellith" }] });
    expect(same.signature).toBe(again.signature);
    expect(same.signature).not.toBe(renamed.signature);
  });
  it("stays live: a Codex rename changes what is accepted", () => {
    const after = buildWorldLexicon({ entities: [{ id: "e1", name: "Kellith Prime" }] });
    expect(after.accepts("Kellith")).toBe(true);
    expect(after.accepts("Kellis")).toBe(false);
  });
});

describe("custom terms", () => {
  it("sanitises stored junk", () => {
    expect(
      sanitizeLexicon([
        { term: "  Ashmere  ", note: 4, aliases: ["Ash", "ash", "Ashmere", ""] },
        { term: "ashmere" },
        { term: "123" },
        null,
        "x",
      ]),
    ).toEqual([{ term: "Ashmere", note: "", aliases: ["Ash"] }]);
    expect(sanitizeLexicon("nope")).toEqual([]);
  });
  it("caps aliases and terms", () => {
    const many = Array.from({ length: 40 }, (_, i) => `alias${i}`);
    expect(sanitizeLexicon([{ term: "Term", aliases: many }])[0].aliases).toHaveLength(MAX_ALIASES);
    const full = Array.from({ length: MAX_CUSTOM_TERMS + 5 }, (_, i) => ({ term: `term${i}x` }));
    expect(sanitizeLexicon(full)).toHaveLength(MAX_CUSTOM_TERMS);
  });
  it("adds, edits and refuses", () => {
    const list: CustomTerm[] = [{ term: "Ashmere", note: "", aliases: [] }];
    const added = upsertCustomTerm(list, { term: "Orrin's", aliases: "Orr, Rin" });
    expect(added.ok).toBe(true);
    expect(added.list[1]).toEqual({ term: "Orrin", note: "", aliases: ["Orr", "Rin"] });
    expect(upsertCustomTerm(list, { term: "ashmere" })).toMatchObject({ ok: false, reason: "duplicate" });
    expect(upsertCustomTerm(list, { term: "  " })).toMatchObject({ ok: false, reason: "empty" });
    const edited = upsertCustomTerm(list, { term: "Ashmere", note: "A city." }, 0);
    expect(edited.list).toEqual([{ term: "Ashmere", note: "A city.", aliases: [] }]);
    const full = Array.from({ length: MAX_CUSTOM_TERMS }, (_, i) => ({ term: `term${i}x`, note: "", aliases: [] }));
    expect(upsertCustomTerm(full, { term: "Onemore" })).toMatchObject({ ok: false, reason: "full" });
    expect(upsertCustomTerm(full, { term: "Renamed" }, 3).ok).toBe(true);
  });
});
