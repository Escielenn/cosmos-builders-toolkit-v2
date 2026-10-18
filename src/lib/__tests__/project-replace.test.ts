import { describe, it, expect } from "vitest";
import { buildMatcher } from "@/lib/binder-search";
import {
  applyReplace,
  expandReplacement,
  matchKey,
  planProject,
  planReplace,
  replaceSnapshotName,
  samePlan,
  snapshotPlan,
} from "@/lib/writing/project-replace";

const re = (q: string, o: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean } = {}) => {
  const b = buildMatcher(q, { regex: !!o.regex, caseSensitive: !!o.caseSensitive, wholeWord: o.wholeWord });
  if (!b.re) throw new Error(b.error);
  return b.re;
};
const all = () => true;

const FACT = `<fact-ref data-fact-key="g" data-value="Kellis" data-label="Name">Kellis</fact-ref>`;
const MENTION = `<entity-mention data-id="e1" data-label="Kellis" data-entity-type="planet">@Kellis</entity-mention>`;
const WIKI = `<wiki-link data-element-id="w1" data-title="Kellis">Kellis</wiki-link>`;

describe("replace engine: text nodes only", () => {
  it("replaces plain text", () => {
    const out = applyReplace("<p>Kellis rose over Kellis.</p>", re("Kellis"), "Kael", false, all);
    expect(out).toEqual({ html: "<p>Kael rose over Kael.</p>", replaced: 2 });
  });

  it("never touches fact refs, mentions or wiki links", () => {
    const html = `<p>Kellis and ${FACT} and ${MENTION} and ${WIKI}.</p>`;
    const plan = planReplace(html, re("Kellis"), "Kael", false);
    expect(plan).toHaveLength(1);
    const out = applyReplace(html, re("Kellis"), "Kael", false, all);
    expect(out.replaced).toBe(1);
    expect(out.html).toContain("<p>Kael and ");
    expect(out.html).toContain('data-value="Kellis"');
    expect(out.html).toContain(">Kellis</fact-ref>");
    expect(out.html).toContain(">@Kellis</entity-mention>");
    expect(out.html).toContain(">Kellis</wiki-link>");
  });

  it("never touches attributes", () => {
    const html = `<p><a href="https://kellis.example/kellis" title="kellis">to Kellis</a></p>`;
    const out = applyReplace(html, re("kellis"), "X", false, all);
    expect(out.replaced).toBe(1);
    expect(out.html).toContain('href="https://kellis.example/kellis"');
    expect(out.html).toContain('title="kellis"');
    expect(out.html).toContain(">to X</a>");
  });

  it("a ref breaks the run: no match straddles it", () => {
    const html = `<p>Kel${FACT}lis</p>`;
    expect(planReplace(html, re("Kellis"), "X", false)).toHaveLength(0);
  });

  it("a paragraph boundary breaks the run", () => {
    expect(planReplace("<p>Kel</p><p>lis</p>", re("Kellis"), "X", false)).toHaveLength(0);
  });

  it("a match may cross formatting; the replacement lands where it starts", () => {
    const out = applyReplace("<p>the <em>wor</em>ld turns</p>", re("world"), "planet", false, all);
    expect(out.html).toBe("<p>the <em>planet</em> turns</p>");
  });

  it("prunes a wrapper the replacement empties", () => {
    const out = applyReplace("<p>a<strong>b</strong>c</p>", re("abc"), "x", false, all);
    expect(out.html).toBe("<p>x</p>");
  });

  it("keeps a comment anchor around replaced text", () => {
    const html = `<p><span data-comment-id="c1" class="sf-comment">old name</span> here</p>`;
    const out = applyReplace(html, re("old"), "new", false, all);
    expect(out.html).toBe(`<p><span data-comment-id="c1" class="sf-comment">new name</span> here</p>`);
  });

  it("decodes and re-encodes entities, so & and < are matched as text", () => {
    const out = applyReplace("<p>Salt &amp; Iron &lt;3</p>", re("&"), "and", false, all);
    expect(out.html).toBe("<p>Salt and Iron &lt;3</p>");
  });

  it("honours include/exclude by index", () => {
    const out = applyReplace("<p>a a a</p>", re("a"), "b", false, (i) => i !== 1);
    expect(out).toEqual({ html: "<p>b a b</p>", replaced: 2 });
  });

  it("leaves the html untouched when nothing is included", () => {
    const html = "<p>a  a</p>";
    expect(applyReplace(html, re("a"), "b", false, () => false)).toEqual({ html, replaced: 0 });
  });

  it("plan and apply agree on indexes across paragraphs", () => {
    const html = "<p>one cat</p><p>two cat, three cat</p>";
    const plan = planReplace(html, re("cat"), "dog", false);
    expect(plan.map((m) => m.index)).toEqual([0, 1, 2]);
    expect(plan[1].before).toContain("two");
    const out = applyReplace(html, re("cat"), "dog", false, (i) => i === 1);
    expect(out.html).toBe("<p>one cat</p><p>two dog, three cat</p>");
  });
});

describe("options", () => {
  it("case sensitive", () => {
    expect(planReplace("<p>Ash ash</p>", re("Ash", { caseSensitive: true }), "x", false)).toHaveLength(1);
    expect(planReplace("<p>Ash ash</p>", re("Ash"), "x", false)).toHaveLength(2);
  });

  it("whole word, including accented letters", () => {
    const r = re("Ash", { wholeWord: true });
    expect(planReplace("<p>Ash Ashen cAsh Ash.</p>", r, "x", false)).toHaveLength(2);
    expect(planReplace("<p>Ashé</p>", r, "x", false)).toHaveLength(0);
  });

  it("regex with groups expands $1", () => {
    const out = applyReplace("<p>Kellis-4 and Kellis-9</p>", re("Kellis-(\\d)", { regex: true }), "K$1", true, all);
    expect(out.html).toBe("<p>K4 and K9</p>");
  });

  it("a literal replacement keeps $ signs", () => {
    const out = applyReplace("<p>price</p>", re("price"), "$1.00", false, all);
    expect(out.html).toBe("<p>$1.00</p>");
  });

  it("expandReplacement covers the String.replace tokens", () => {
    const m = /(?<w>b)(c)/.exec("abcd")!;
    expect(expandReplacement("[$&|$1|$2|$<w>|$$|$`|$']", m, "abcd")).toBe("[bc|b|c|b|$|a|d]");
  });
});

describe("snapshot list", () => {
  const docs = [
    { id: "d1", title: "One", content: "<p>Kellis</p>" },
    { id: "d2", title: "Two", content: "<p>nothing</p>" },
    { id: "d3", title: "", content: `<p>Kellis ${FACT} Kellis</p>` },
  ];

  it("files one snapshot per affected document, none for unaffected", () => {
    const plans = planProject(docs, re("Kellis"), "Kael", false);
    expect(plans.map((p) => p.docId)).toEqual(["d1", "d3"]);
    expect(plans[1].title).toBe("Untitled");
    const snaps = snapshotPlan(plans, new Set(), "Kellis", "Kael");
    expect(snaps).toEqual([
      { docId: "d1", title: "One", name: 'BEFORE REPLACE "Kellis" → "Kael"', count: 1 },
      { docId: "d3", title: "Untitled", name: 'BEFORE REPLACE "Kellis" → "Kael"', count: 2 },
    ]);
  });

  it("a document whose every match is excluded gets no snapshot", () => {
    const plans = planProject(docs, re("Kellis"), "Kael", false);
    const snaps = snapshotPlan(plans, new Set([matchKey("d1", 0), matchKey("d3", 1)]), "Kellis", "Kael");
    expect(snaps.map((s) => [s.docId, s.count])).toEqual([["d3", 1]]);
  });

  it("names stay within 80 characters", () => {
    const name = replaceSnapshotName("x".repeat(200), "y".repeat(200));
    expect(name.length).toBeLessThanOrEqual(80);
    expect(name.startsWith('BEFORE REPLACE "')).toBe(true);
  });

  it("samePlan compares the matched words, not the markup", () => {
    const a = planReplace('<p class="a">Kellis</p>', re("Kellis"), "x", false);
    const b = planReplace("<p>Kellis</p>", re("Kellis"), "x", false);
    const c = planReplace("<p>Kellis Kellis</p>", re("Kellis"), "x", false);
    expect(samePlan(a, b)).toBe(true);
    expect(samePlan(a, c)).toBe(false);
  });
});
