import { describe, it, expect } from "vitest";
import { buildBinderTree } from "@/lib/binder-tree";
import { factRefId, factRefToHtml, type FactRefAttrs } from "@/lib/writing/fact-ref";
import {
  NO_CANON_CHANGES,
  canonCountLine,
  canonSummaryLine,
  extractMentions,
  mayCiteCanon,
  mentionRename,
  pruneTree,
  rollUpCanonCounts,
  scanCanonChanges,
  type CanonCount,
  type CanonIndex,
} from "@/lib/writing/canon-changes";

const G: FactRefAttrs = {
  factKey: "surfaceGravity",
  value: "1.4 g",
  tool: "planetary-profile",
  worksheetId: "ws-1",
  sourceKind: "worksheet",
  entityId: "planet-1",
  label: "Surface Gravity (g)",
};
const DAY: FactRefAttrs = { ...G, factKey: "dayLength", value: "31 h", label: "Day Length" };
const GONE: FactRefAttrs = { ...G, factKey: "albedo", value: "0.3", label: "Albedo" };

function mention(id: string, label: string, ack?: string): string {
  const a = ack ? ` data-ack-label="${ack}"` : "";
  return `<entity-mention data-id="${id}" data-label="${label}" data-entity-type="character"${a}>${label}</entity-mention>`;
}

function index(over: Partial<CanonIndex> = {}): CanonIndex {
  return {
    facts: new Map([
      [factRefId(G), { insert: "1.6 g" }],
      [factRefId(DAY), { insert: "31 h" }],
    ]),
    entityNames: new Map([
      ["c-1", "Verrid Ash"],
      ["c-2", "Kell"],
    ]),
    ...over,
  };
}

describe("mayCiteCanon", () => {
  it("is false for plain prose and empty input", () => {
    expect(mayCiteCanon("<p>The sky was low.</p>")).toBe(false);
    expect(mayCiteCanon(null)).toBe(false);
    expect(mayCiteCanon("")).toBe(false);
  });
  it("is true for either kind of citation", () => {
    expect(mayCiteCanon(`<p>${factRefToHtml(G)}</p>`)).toBe(true);
    expect(mayCiteCanon(`<p>${mention("c-1", "Verrid")}</p>`)).toBe(true);
  });
});

describe("extractMentions", () => {
  it("reads id, label and the acknowledged name", () => {
    const html = `<p>${mention("c-1", "Verrid", "Verrid Ash")} met ${mention("c-2", "Kell")}</p>`;
    expect(extractMentions(html)).toEqual([
      { id: "c-1", label: "Verrid", ackLabel: "Verrid Ash" },
      { id: "c-2", label: "Kell", ackLabel: null },
    ]);
  });
  it("falls back to the text when data-label is absent and unescapes", () => {
    const html = `<entity-mention data-id="c-9">O&#039;Dell &amp; Co</entity-mention>`;
    expect(extractMentions(html)).toEqual([{ id: "c-9", label: "O'Dell & Co", ackLabel: null }]);
  });
});

describe("mentionRename", () => {
  const names = new Map([["c-1", "Verrid Ash"]]);
  it("flags a mention whose entity now has another name", () => {
    expect(mentionRename({ id: "c-1", label: "Verrid", ackLabel: null }, names)).toEqual({
      entityId: "c-1",
      was: "Verrid",
      now: "Verrid Ash",
    });
  });
  it("ignores whitespace noise but not case", () => {
    expect(mentionRename({ id: "c-1", label: " Verrid  Ash ", ackLabel: null }, names)).toBeNull();
    expect(mentionRename({ id: "c-1", label: "verrid ash", ackLabel: null }, names)).not.toBeNull();
  });
  it("is quiet for unknown or deleted entities and mentions without an id", () => {
    expect(mentionRename({ id: "nope", label: "X", ackLabel: null }, names)).toBeNull();
    expect(mentionRename({ id: null, label: "X", ackLabel: null }, names)).toBeNull();
  });
  it("respects IGNORE until the entity is renamed again", () => {
    expect(mentionRename({ id: "c-1", label: "Verrid", ackLabel: "Verrid Ash" }, names)).toBeNull();
    const again = new Map([["c-1", "Verrid Ashkell"]]);
    expect(mentionRename({ id: "c-1", label: "Verrid", ackLabel: "Verrid Ash" }, again)?.now).toBe("Verrid Ashkell");
  });
});

describe("scanCanonChanges", () => {
  it("returns the shared empty result for uncited prose", () => {
    expect(scanCanonChanges("<p>Nothing cited.</p>", index())).toBe(NO_CANON_CHANGES);
  });

  it("reports stale and missing facts, not current ones", () => {
    const html = `<p>${factRefToHtml(G)} and ${factRefToHtml(DAY)} and ${factRefToHtml(GONE)}</p>`;
    const r = scanCanonChanges(html, index());
    expect(r.staleFacts).toEqual([
      { ref: factRefId(G), label: "Surface Gravity (g)", was: "1.4 g", now: "1.6 g", state: "stale" },
      { ref: factRefId(GONE), label: "Albedo", was: "0.3", now: null, state: "missing" },
    ]);
    expect(r.renamedMentions).toEqual([]);
  });

  it("counts every occurrence, so each one the writer must look at is counted", () => {
    const html = `<p>${factRefToHtml(G)}</p><p>${factRefToHtml(G)}</p>`;
    expect(scanCanonChanges(html, index()).staleFacts).toHaveLength(2);
  });

  it("reports renamed mentions alongside facts", () => {
    const html = `<p>${mention("c-1", "Verrid")} weighed ${factRefToHtml(G)}. ${mention("c-2", "Kell")}</p>`;
    const r = scanCanonChanges(html, index());
    expect(r.staleFacts).toHaveLength(1);
    expect(r.renamedMentions).toEqual([{ entityId: "c-1", was: "Verrid", now: "Verrid Ash" }]);
  });

  it("is all-clear when everything matches", () => {
    const html = `<p>${factRefToHtml({ ...G, value: "1.6 g" })} ${mention("c-2", "Kell")}</p>`;
    expect(scanCanonChanges(html, index())).toBe(NO_CANON_CHANGES);
  });
});

describe("lines", () => {
  it("speaks in Ship's Voice with correct number", () => {
    expect(canonCountLine({ facts: 3, names: 1 })).toBe("3 CITED VALUES CHANGED · 1 NAME CHANGED");
    expect(canonCountLine({ facts: 1, names: 0 })).toBe("1 CITED VALUE CHANGED");
    expect(canonCountLine({ facts: 0, names: 2 })).toBe("2 NAMES CHANGED");
    expect(canonSummaryLine(1)).toBe("PARAMETER REVISED. 1 DOCUMENT AFFECTED.");
    expect(canonSummaryLine(4)).toBe("PARAMETER REVISED. 4 DOCUMENTS AFFECTED.");
  });
});

// Binder: Part (folder) > Chapter (folder) > a, b; top-level c; Part > d.
const ENTRIES = [
  { id: "part", parent_id: null, entry_type: "folder", sort_order: 0, title: "Part" },
  { id: "ch", parent_id: "part", entry_type: "folder", sort_order: 0, title: "Chapter" },
  { id: "a", parent_id: "ch", entry_type: "document", sort_order: 0, title: "A" },
  { id: "b", parent_id: "ch", entry_type: "document", sort_order: 1, title: "B" },
  { id: "d", parent_id: "part", entry_type: "document", sort_order: 1, title: "D" },
  { id: "c", parent_id: null, entry_type: "document", sort_order: 1, title: "C" },
  { id: "empty", parent_id: null, entry_type: "folder", sort_order: 2, title: "Empty" },
];

describe("rollUpCanonCounts", () => {
  it("sums every document into each folder above it", () => {
    const byDoc = new Map<string, CanonCount>([
      ["a", { facts: 2, names: 0 }],
      ["b", { facts: 1, names: 1 }],
      ["c", { facts: 0, names: 1 }],
      ["d", { facts: 0, names: 0 }],
    ]);
    const r = rollUpCanonCounts(ENTRIES, byDoc);
    expect(r.get("a")).toEqual({ facts: 2, names: 0 });
    expect(r.get("ch")).toEqual({ facts: 3, names: 1 });
    expect(r.get("part")).toEqual({ facts: 3, names: 1 });
    expect(r.get("c")).toEqual({ facts: 0, names: 1 });
    expect(r.has("d")).toBe(false);
    expect(r.has("empty")).toBe(false);
  });
  it("survives a parent cycle in the data", () => {
    const cyc = [
      { id: "f1", parent_id: "f2", entry_type: "folder", sort_order: 0, title: "1" },
      { id: "f2", parent_id: "f1", entry_type: "folder", sort_order: 0, title: "2" },
      { id: "x", parent_id: "f1", entry_type: "document", sort_order: 0, title: "x" },
    ];
    const r = rollUpCanonCounts(cyc, new Map([["x", { facts: 1, names: 0 }]]));
    expect(r.get("x")).toEqual({ facts: 1, names: 0 });
  });
});

describe("pruneTree", () => {
  it("keeps only the given documents and the folders that lead to them", () => {
    const tree = buildBinderTree(ENTRIES);
    const pruned = pruneTree(tree, new Set(["b", "c"]));
    expect(pruned.map((n) => n.entry.id)).toEqual(["part", "c"]);
    expect(pruned[0].children.map((n) => n.entry.id)).toEqual(["ch"]);
    expect(pruned[0].children[0].children.map((n) => n.entry.id)).toEqual(["b"]);
  });
  it("is empty when nothing is kept", () => {
    expect(pruneTree(buildBinderTree(ENTRIES), new Set())).toEqual([]);
  });
});
