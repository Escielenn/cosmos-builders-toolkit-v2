import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import JSZip from "jszip";
import {
  buildImportFromSource,
  chunkRows,
  countImport,
  dedupeTopLevel,
  docNode,
  docxToHtml,
  folderNode,
  importResultLine,
  markdownToHtml,
  planImportRows,
  plainTextToHtml,
  rtfToHtml,
  rtfToText,
  sanitizeImportHtml,
  splitHtmlAtHeadings,
  type ImportNode,
} from "@/lib/manuscript-import";
import { mapScrivStatus, mergeScrivLabels, nearestHue, parseScrivx } from "@/lib/manuscript-import/scrivener";
import { sourceFromZip, type FileSource } from "@/lib/manuscript-import/sources";
import { readDocMeta } from "@/lib/document-meta";

const FIXTURES = join(__dirname, "fixtures", "scrivener");

/** A directory on disk as a FileSource, paths relative to `root`'s parent. */
function dirSource(root: string): FileSource {
  const base = join(root, "..");
  const files = new Map<string, string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else files.set(relative(base, full).split("\\").join("/"), full);
    }
  };
  walk(root);
  return {
    paths: Array.from(files.keys()),
    readText: async (p) => (files.has(p) ? readFileSync(files.get(p)!, "utf8") : null),
    readBinary: async (p) => (files.has(p) ? new Uint8Array(readFileSync(files.get(p)!)).buffer : null),
  };
}

function memSource(files: Record<string, string>): FileSource {
  return {
    paths: Object.keys(files),
    readText: async (p) => files[p] ?? null,
    readBinary: async (p) => (p in files ? new TextEncoder().encode(files[p]).buffer : null),
  };
}

const titles = (nodes: ImportNode[]): unknown =>
  nodes.map((n) => (n.kind === "folder" ? { [n.title]: titles(n.children) } : n.title));

// ---------------------------------------------------------------------------
// RTF
// ---------------------------------------------------------------------------

describe("rtf", () => {
  it("reads paragraphs, toggles and escapes, and skips tables and destinations", () => {
    const rtf = readFileSync(join(FIXTURES, "Sample.scriv/Files/Data/AAAA-0002/content.rtf"), "utf8");
    const html = rtfToHtml(rtf);
    expect(html).toBe(
      "<p>The shuttle came down <strong>hard</strong> on the <em>Kellis</em> plain.</p>" +
        "<p>She said, \u201CCaf\u00E9 first.\u201D It was \u2014 late.</p>" +
        "<p><u>Underlined</u> words.</p>",
    );
    expect(html).not.toContain("annotation");
    expect(html).not.toContain("Times");
  });

  it("handles \\line, \\tab, \\uc and negative \\u", () => {
    expect(rtfToHtml("{\\rtf1 a\\line b\\par}")).toBe("<p>a<br>b</p>");
    expect(rtfToHtml("{\\rtf1 \\uc2\\u-3913 XYc\\par}")).toBe("<p>\uF0B7c</p>");
    expect(rtfToHtml("{\\rtf1 x\\tab y\\par}")).toBe("<p>x y</p>");
  });

  it("escapes HTML and keeps braces", () => {
    expect(rtfToHtml("{\\rtf1 a < b \\{c\\} \\\\ d\\par}")).toBe("<p>a &lt; b {c} \\ d</p>");
  });

  it("\\plain resets formatting and groups restore it", () => {
    expect(rtfToHtml("{\\rtf1 {\\b bold} plain {\\i it\\plain  no}\\par}")).toBe(
      "<p><strong>bold</strong> plain <em>it</em> no</p>",
    );
  });

  it("plain text keeps paragraphs", () => {
    expect(rtfToText("{\\rtf1 One.\\par Two.\\par}")).toBe("One.\n\nTwo.");
  });

  it("never throws on junk", () => {
    expect(() => rtfToHtml("{\\rtf1 {{{ \\'zz \\u")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Markdown, text, HTML
// ---------------------------------------------------------------------------

describe("markdown", () => {
  it("converts the manuscript subset", () => {
    const html = markdownToHtml(
      "# Part\n\nShe **ran** and *fell*, _twice_.\nSame para.\n\n> quoted\n\n- a\n- b\n\n1. one\n\n***\n\n[site](https://x.org) and <b>raw</b>",
    );
    expect(html).toBe(
      "<h1>Part</h1><p>She <strong>ran</strong> and <em>fell</em>, <em>twice</em>. Same para.</p>" +
        "<blockquote><p>quoted</p></blockquote><ul><li><p>a</p></li><li><p>b</p></li></ul>" +
        "<ol><li><p>one</p></li></ol><hr>" +
        '<p><a href="https://x.org">site</a> and &lt;b&gt;raw&lt;/b&gt;</p>',
    );
  });

  it("caps headings at h3, reads setext, skips front matter", () => {
    expect(markdownToHtml("---\ntitle: x\n---\n#### Deep\n\nTitle\n=====")).toBe("<h3>Deep</h3><h1>Title</h1>");
  });

  it("drops javascript links to their text", () => {
    expect(markdownToHtml("[x](javascript:alert(1))")).not.toContain("href");
  });
});

describe("plain text", () => {
  it("uses blank lines when present", () => {
    expect(plainTextToHtml("One\nstill one\n\nTwo")).toBe("<p>One<br>still one</p><p>Two</p>");
  });
  it("one paragraph per line otherwise", () => {
    expect(plainTextToHtml("A\r\nB")).toBe("<p>A</p><p>B</p>");
  });
});

describe("sanitizeImportHtml", () => {
  it("reduces to the editor schema without losing words", () => {
    const html = sanitizeImportHtml(
      '<h1>T</h1><h5>Deep</h5><p class="x">A <b>b</b> <i>i</i> <span style="font-weight:bold">s</span> <a href="javascript:x">j</a> <a href="https://a.b">ok</a></p>' +
        "<table><tr><td>cell one</td><td>cell two</td></tr></table><div>loose <em>text</em></div><img src=x><script>bad()</script>",
    );
    expect(html).toBe(
      '<h1>T</h1><h3>Deep</h3><p>A <strong>b</strong> <em>i</em> <strong>s</strong> j <a href="https://a.b">ok</a></p>' +
        "<p>cell one</p><p>cell two</p><p>loose <em>text</em></p>",
    );
  });
  it("keeps lists and quotes", () => {
    expect(sanitizeImportHtml("<ul><li>a</li><li><p>b</p></li></ul><blockquote>q</blockquote>")).toBe(
      "<ul><li><p>a</p></li><li><p>b</p></li></ul><blockquote><p>q</p></blockquote>",
    );
  });
});

// ---------------------------------------------------------------------------
// Splitting, counts, rows
// ---------------------------------------------------------------------------

describe("splitHtmlAtHeadings", () => {
  it("H1 → folder, H2 → document, lead text kept", () => {
    const nodes = splitHtmlAtHeadings(
      "<p>Epigraph.</p><h1>Part One</h1><p>Part intro.</p><h2>Scene A</h2><p>a</p><h2>Scene B</h2><p>b</p><h1>Part Two</h1><h2>Scene C</h2><p>c</p>",
      "Book",
    );
    expect(titles(nodes)).toEqual(["Book", { "Part One": ["Part One", "Scene A", "Scene B"] }, { "Part Two": ["Scene C"] }]);
    expect(nodes[1].children[1].html).toBe("<p>a</p>");
  });

  it("a single heading level makes documents", () => {
    expect(titles(splitHtmlAtHeadings("<h2>A</h2><p>a</p><h2>B</h2><p>b</p>", "x"))).toEqual(["A", "B"]);
  });

  it("no headings keeps one document", () => {
    expect(titles(splitHtmlAtHeadings("<p>x</p>", "Whole"))).toEqual(["Whole"]);
  });
});

describe("tree", () => {
  const forest = [folderNode("Draft", [docNode("A", "<p>one two</p>"), folderNode("Ch", [docNode("B", "<p>three</p>")])]), docNode("C", "")];

  it("counts folders, documents and words", () => {
    expect(countImport(forest)).toEqual({ folders: 2, documents: 3, words: 3 });
    expect(importResultLine({ folders: 0, documents: 42, words: 98214 })).toBe("MANUSCRIPT IMPORTED. 42 DOCUMENTS. 98,214 WORDS.");
    expect(importResultLine({ folders: 0, documents: 1, words: 1 })).toBe("MANUSCRIPT IMPORTED. 1 DOCUMENT. 1 WORD.");
  });

  it("suffixes colliding top-level names, never merging", () => {
    const out = dedupeTopLevel([folderNode("Draft"), docNode("draft", ""), docNode("New", "")], ["Draft", "Notes"]);
    expect(out.map((n) => n.title)).toEqual(["Draft (2)", "draft (3)", "New"]);
  });

  it("plans parents before children with sort steps of 10", () => {
    let n = 0;
    const rows = planImportRows(forest, { parentId: null, rootSortStart: 30, newId: () => `id${n++}` });
    expect(rows.map((r) => [r.title, r.parent_id, r.sort_order, r.depth])).toEqual([
      ["Draft", null, 30, 0],
      ["C", null, 40, 0],
      ["A", "id0", 0, 1],
      ["Ch", "id0", 10, 1],
      ["B", "id3", 0, 2],
    ]);
    expect(rows[0].entry_type).toBe("folder");
    expect(rows[2].content).toBe("<p>one two</p>");
    const chunks = chunkRows(rows, 1);
    expect(chunks.length).toBe(5);
    expect(chunkRows(rows, 50).map((c) => c.length)).toEqual([2, 2, 1]);
  });

  it("writes card metadata through document-meta", () => {
    const rows = planImportRows([docNode("A", "", { synopsis: "s", status: "draft", keywords: ["k"] })], {
      parentId: "p",
      rootSortStart: 0,
      newId: () => "x",
    });
    expect(readDocMeta(rows[0].metadata)).toMatchObject({ synopsis: "s", status: "draft", keywords: ["k"] });
  });
});

// ---------------------------------------------------------------------------
// Scrivener
// ---------------------------------------------------------------------------

describe("scrivener", () => {
  it("parses the binder, labels, statuses and keywords", () => {
    const p = parseScrivx(readFileSync(join(FIXTURES, "Sample.scriv/Sample.scrivx"), "utf8"));
    expect(p.items.map((i) => i.type)).toEqual(["DraftFolder", "ResearchFolder", "TrashFolder"]);
    const ch1 = p.items[0].children[0];
    expect(ch1.title).toBe("Chapter One");
    expect(ch1.children.map((c) => [c.title, c.includeInCompile])).toEqual([
      ["Arrival", true],
      ["Cut scene", false],
    ]);
    expect(p.labels.map((l) => l.name)).toEqual(["Flashback", "Concept", "Unused"]);
    expect(p.statuses.find((s) => s.id === "5")?.name).toBe("Waiting On Edits");
    expect(p.keywords.get("7")).toBe("Kellis");
  });

  it("maps colours to the nearest named hue and statuses to ours", () => {
    expect(nearestHue([0.9, 0.2, 0.3])).toBe("crimson");
    expect(nearestHue([0.2, 0.4, 0.9])).toMatch(/azure|stellar/);
    expect(nearestHue([1, 0.75, 0])).toBe("amber");
    expect(nearestHue([0.5, 0.5, 0.5])).toBe("stellar");
    expect(mapScrivStatus("To Do")).toBe("outline");
    expect(mapScrivStatus("First Draft")).toBe("draft");
    expect(mapScrivStatus("Revised Draft")).toBe("revised");
    expect(mapScrivStatus("Final Draft")).toBe("final");
    expect(mapScrivStatus("Waiting On Edits")).toBeNull();
  });

  it("merges labels by name, creating only the used and missing ones", () => {
    let n = 0;
    const { labels, map, created } = mergeScrivLabels(
      [
        { id: "1", name: "Flashback", rgb: [0.9, 0.2, 0.3] },
        { id: "2", name: "concept", rgb: null },
        { id: "3", name: "Unused", rgb: null },
      ],
      [{ id: "w1", name: "Concept", hue: "violet" }],
      new Set(["1", "2"]),
      () => `new${n++}`,
    );
    expect(created).toBe(1);
    expect(labels).toEqual([
      { id: "w1", name: "Concept", hue: "violet" },
      { id: "new0", name: "Flashback", hue: "crimson" },
    ]);
    expect(map.get("2")).toBe("w1");
    expect(map.has("3")).toBe(false);
  });

  it("imports a Scrivener 3 project: draft tree, research, metadata, compile flags", async () => {
    const preview = await buildImportFromSource(dirSource(join(FIXTURES, "Sample.scriv")), "Sample.scriv", { splitHeadings: false }, []);
    expect(preview.kind).toBe("scrivener");
    expect(preview.sourceName).toBe("Sample");
    expect(titles(preview.nodes)).toEqual([
      { Manuscript: [{ "Chapter One": ["Arrival", "Cut scene"] }, { "Chapter Two": ["Chapter Two", "Night"] }] },
      { Research: ["Orbit notes"] },
    ]);
    const arrival = preview.nodes[0].children[0].children[0];
    expect(arrival.html).toContain("<strong>hard</strong>");
    expect(arrival.meta).toMatchObject({ synopsis: "She lands.", notes: "Check the gravity.", status: "draft", keywords: ["Kellis"] });
    expect(arrival.meta?.labelId).toBe(preview.labels?.find((l) => l.name === "Flashback")?.id);
    const cut = preview.nodes[0].children[0].children[1];
    expect(cut.includeInCompile).toBe(false);
    expect(cut.meta?.keywords).toEqual(["Waiting On Edits"]);
    expect(preview.nodes[0].children[1].children[1].meta?.status).toBe("final");
    expect(preview.nodes[0].children[1].children[1].html).toBe("<p>Night falls.<br>Twice.</p>");
    expect(preview.labelsCreated).toBe(2);
    expect(preview.skipped).toEqual({ media: 1, unsupported: 0, missingContent: 1 });
    expect(preview.counts.documents).toBe(5);
  });

  it("imports a Scrivener 2 project (Files/Docs/<id>.rtf)", async () => {
    const preview = await buildImportFromSource(dirSource(join(FIXTURES, "Legacy.scriv")), "Legacy.scriv", { splitHeadings: false }, []);
    expect(titles(preview.nodes)).toEqual([{ Draft: ["Opening"] }, { Research: [] }]);
    const doc = preview.nodes[0].children[0];
    expect(doc.html).toBe("<p>First line of the old draft.</p><p>Second line.</p>");
    expect(doc.meta?.synopsis).toBe("Legacy synopsis.");
  });

  it("reads a zipped .scriv", async () => {
    const zip = new JSZip();
    const src = dirSource(join(FIXTURES, "Sample.scriv"));
    for (const p of src.paths) zip.file(p, (await src.readText(p))!);
    zip.file("__MACOSX/Sample.scriv/._Sample.scrivx", "junk");
    const data = await zip.generateAsync({ type: "uint8array" });
    const source = await sourceFromZip(data);
    expect(source.paths.some((p) => p.includes("__MACOSX"))).toBe(false);
    const preview = await buildImportFromSource(source, "Sample.zip", { splitHeadings: false }, [], { fromZip: true });
    expect(preview.kind).toBe("scrivener");
    expect(preview.counts.documents).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Files and DOCX
// ---------------------------------------------------------------------------

describe("files", () => {
  it("builds folders from paths in natural order and splits Markdown on request", async () => {
    const source = memSource({
      "Book/Chapter 10.md": "## Late\n\ntext",
      "Book/Chapter 2.md": "# Two\n\n## Scene\n\nwords here",
      "Book/notes.txt": "plain",
      "Book/cover.png": "x",
    });
    const split = await buildImportFromSource(source, "Book", { splitHeadings: true }, []);
    expect(titles(split.nodes)).toEqual([{ Book: [{ Two: ["Scene"] }, "Late", "notes"] }]);
    expect(split.skipped.unsupported).toBe(1);
    const whole = await buildImportFromSource(source, "Book", { splitHeadings: false }, []);
    expect(titles(whole.nodes)).toEqual([{ Book: ["Chapter 2", "Chapter 10", "notes"] }]);
  });

  it("wraps a zip of loose files in one folder named after it", async () => {
    const preview = await buildImportFromSource(memSource({ "a.txt": "a", "b.txt": "b" }), "Drafts.zip", { splitHeadings: false }, [], { fromZip: true });
    expect(titles(preview.nodes)).toEqual([{ Drafts: ["a", "b"] }]);
  });

  it("converts a real .docx through mammoth and the sanitizer", async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Part One")] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Landing")] }),
            new Paragraph({ children: [new TextRun("The "), new TextRun({ text: "ship", bold: true }), new TextRun({ text: " fell.", italics: true })] }),
          ],
        },
      ],
    });
    const buf = await Packer.toBuffer(doc);
    const html = await docxToHtml(new Uint8Array(buf).buffer);
    expect(html).toBe("<h1>Part One</h1><h2>Landing</h2><p>The <strong>ship</strong><em> fell.</em></p>");
    expect(titles(splitHtmlAtHeadings(html, "x"))).toEqual([{ "Part One": ["Landing"] }]);
  });
});
