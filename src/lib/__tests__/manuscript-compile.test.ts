import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { blocksToMarkdown, blocksToXhtml, htmlToBlocks } from "@/lib/manuscript/blocks";
import {
  DEFAULT_COMPILE,
  applyCompileOrder,
  applyPreset,
  approxWordsLine,
  buildManuscript,
  chapterLabel,
  moveInOrder,
  numberToWords,
  roundWordCount,
  sanitizeCompileSettings,
  sectionHeading,
  separatorText,
  surnameOf,
  toRoman,
  withExcluded,
  writeCompileSettings,
  type CompileNode,
  type CompileSettings,
} from "@/lib/manuscript/compile";
import { manuscriptToMarkdown, manuscriptToText } from "@/lib/manuscript/text-formats";
import { buildEpub, buildEpubFiles } from "@/lib/manuscript/epub";
import { buildManuscriptDocx } from "@/lib/manuscript/docx";

const doc = (id: string, title: string, html = `<p>${title} text.</p>`): CompileNode => ({ id, title, isFolder: false, html, children: [] });
const folder = (id: string, title: string, children: CompileNode[]): CompileNode => ({ id, title, isFolder: true, html: "", children });

const BOOK: CompileNode[] = [
  doc("pro", "Prologue"),
  folder("ms", "Manuscript", [
    folder("c1", "The Fall", [doc("a", "Scene A"), doc("b", "Scene B")]),
    folder("c2", "Chapter 2", [doc("c", "Scene C")]),
  ]),
  doc("epi", "Epilogue"),
];

const settings = (patch: Partial<CompileSettings> = {}): CompileSettings => ({ ...DEFAULT_COMPILE, ...patch });

describe("blocks", () => {
  it("prints fact refs as stored values and mentions as their display text", () => {
    const blocks = htmlToBlocks(
      '<p>Gravity <fact-ref data-fact-key="g" data-value="1.4 g">1.6 g</fact-ref> on <entity-mention data-id="x" data-label="Kellis">Kellis</entity-mention> and <wiki-link data-element-id="y" data-title="Spires">Spires</wiki-link>, <strong>bold</strong>.</p>',
    );
    expect(blocks).toEqual([
      {
        type: "p",
        runs: [{ text: "Gravity 1.4 g on Kellis and Spires, " }, { text: "bold", bold: true }, { text: "." }],
      },
    ]);
  });

  it("keeps lists, quotes, breaks and headings", () => {
    const b = htmlToBlocks("<h2>Sub</h2><blockquote><p>q</p></blockquote><ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul><p>x<br>y</p><hr>");
    expect(b.map((x) => x.type)).toEqual(["h", "quote", "li", "li", "p", "hr"]);
    expect(blocksToMarkdown(b)).toBe("#### Sub\n\n> q\n\n- a\n  - b\n\nx  \ny\n\n* * *");
    expect(blocksToXhtml(b)).toBe('<h4>Sub</h4><blockquote><p>q</p></blockquote><ul><li>a<ul><li>b</li></ul></li></ul><p>x<br/>y</p><p class="sep">* * *</p>');
  });
});

describe("numbering and front matter helpers", () => {
  it("numbers", () => {
    expect(numberToWords(1)).toBe("One");
    expect(numberToWords(21)).toBe("Twenty-One");
    expect(numberToWords(105)).toBe("One Hundred Five");
    expect(toRoman(14)).toBe("XIV");
    expect(toRoman(1994)).toBe("MCMXCIV");
    expect(chapterLabel(3, "chapter")).toBe("Chapter 3");
    expect(chapterLabel(3, "words")).toBe("Three");
    expect(chapterLabel(3, "roman")).toBe("III");
    expect(chapterLabel(3, "none")).toBeNull();
  });

  it("separators", () => {
    expect(separatorText("none", "")).toBeNull();
    expect(separatorText("blank", "")).toBe("");
    expect(separatorText("hash", "")).toBe("#");
    expect(separatorText("stars", "")).toBe("* * *");
    expect(separatorText("custom", " ~ ")).toBe("~");
    expect(separatorText("custom", "")).toBe("* * *");
  });

  it("rounds word counts the way manuscripts do", () => {
    expect(roundWordCount(98_214)).toBe(98_000);
    expect(roundWordCount(98_600)).toBe(99_000);
    expect(roundWordCount(740)).toBe(700);
    expect(roundWordCount(20)).toBe(100);
    expect(approxWordsLine(98_214)).toBe("about 98,000 words");
    expect(surnameOf("Jason D. Batt, Ph.D.")).toBe("Batt");
  });
});

describe("settings", () => {
  it("sanitizes untyped JSON and round-trips through worlds.settings", () => {
    const s = sanitizeCompileSettings({ format: "nope", excluded: ["a", "a", 3], order: { root: ["x"], bad: "y" }, title: "T" });
    expect(s.format).toBe("docx");
    expect(s.excluded).toEqual(["a"]);
    expect(s.order).toEqual({ root: ["x"] });
    const merged = writeCompileSettings({ writingLabels: [1] }, s);
    expect(merged.writingLabels).toEqual([1]);
    expect(sanitizeCompileSettings(merged.compile).title).toBe("T");
  });

  it("presets set formatting, never selection or front matter", () => {
    const s = applyPreset(settings({ excluded: ["a"], title: "Kept" }), "ebook");
    expect(s.format).toBe("epub");
    expect(s.excluded).toEqual(["a"]);
    expect(s.title).toBe("Kept");
    expect(withExcluded(s, ["b", "a"]).excluded).toEqual(["a", "b"]);
  });
});

describe("ordering and exclusion", () => {
  it("applies a compile-only order per sibling list", () => {
    const ordered = applyCompileOrder(BOOK, { root: ["epi", "ms"], c1: ["b"] });
    expect(ordered.map((n) => n.id)).toEqual(["epi", "ms", "pro"]);
    expect(ordered[1].children[0].children.map((n) => n.id)).toEqual(["b", "a"]);
  });

  it("moves an item and refuses to leave the list", () => {
    expect(moveInOrder(["a", "b", "c"], "c", -1, {}, "p")).toEqual({ p: ["a", "c", "b"] });
    expect(moveInOrder(["a", "b"], "a", -1, { q: ["z"] }, "p")).toEqual({ q: ["z"] });
  });

  it("an excluded folder drops its subtree", () => {
    const m = buildManuscript(BOOK, settings({ excluded: ["c1", "epi"] }));
    expect(m.sections.map((s) => s.id)).toEqual(["pro", "ms", "c2"]);
  });
});

describe("buildManuscript", () => {
  it("numbers chapter folders, leaves loose documents and the sole container unnumbered", () => {
    const m = buildManuscript([folder("ms", "Manuscript", [folder("c1", "The Fall", [doc("a", "A"), doc("b", "B")]), folder("c2", "Chapter 2", [doc("c", "C")])])], settings({ folderTitles: true }));
    expect(m.sections.map(sectionHeading)).toEqual(["Chapter 1: The Fall", "Chapter 2"]);
    expect(m.sections[0].docs.map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("prints prologue and epilogue by title, and a container that is not alone as a part", () => {
    const m = buildManuscript(BOOK, settings({ numbering: "words", folderTitles: false }));
    expect(m.sections.map((s) => [s.kind, sectionHeading(s)])).toEqual([
      ["loose", "Prologue"],
      ["part", "Manuscript"],
      ["chapter", "One"],
      ["chapter", "Two"],
      ["loose", "Epilogue"],
    ]);
  });

  it("flat documents become numbered chapters", () => {
    const m = buildManuscript([doc("a", "Arrival"), doc("b", "Night")], settings({ numbering: "roman" }));
    expect(m.sections.map(sectionHeading)).toEqual(["I: Arrival", "II: Night"]);
  });

  it("headings off prints none; numbering off prints folder titles", () => {
    expect(buildManuscript(BOOK, settings({ folderHeadings: false })).sections.every((s) => sectionHeading(s) === null)).toBe(true);
    const m = buildManuscript([folder("c1", "The Fall", [doc("a", "A")])], settings({ numbering: "none" }));
    expect(sectionHeading(m.sections[0])).toBe("The Fall");
  });

  it("counts words and carries front and back matter", () => {
    const m = buildManuscript(
      [doc("a", "A", "<p>one two three</p>")],
      settings({ title: "", author: "J. Batt", includeAbout: true, aboutAuthor: "Writes.", includeAppendix: true }),
      { appendixHtml: "<h3>Planet</h3><ul><li><strong>g:</strong> 1.4</li></ul>", fallbackTitle: "Kellis" },
    );
    expect(m.title).toBe("Kellis");
    expect(m.words).toBe(3);
    expect(m.about).toBe("Writes.");
    expect(m.appendix?.length).toBe(2);
  });
});

describe("text formats", () => {
  const m = buildManuscript(
    [folder("c1", "The Fall", [doc("a", "A", "<p>First <em>scene</em>.</p>"), doc("b", "B", "<p>Second.</p>")])],
    settings({ title: "Kellis", author: "J. Batt", separator: "stars", contact: "j@example.com" }),
  );

  it("markdown puts separators between scenes only", () => {
    const md = manuscriptToMarkdown(m);
    expect(md).toContain("# Kellis");
    expect(md).toContain("about 100 words");
    expect(md).toContain("## Chapter 1");
    expect(md).toContain("First *scene*.\n\n* * *\n\nSecond.");
    expect(md.match(/\* \* \*/g)?.length).toBe(1);
  });

  it("plain text", () => {
    const txt = manuscriptToText(m);
    expect(txt).toContain("KELLIS");
    expect(txt).toContain("CHAPTER 1");
    expect(txt).toContain("First scene.\n\n* * *\n\nSecond.");
  });
});

describe("epub", () => {
  const m = buildManuscript(
    [folder("c1", "The Fall", [doc("a", "A", "<p>Fish &amp; chips <strong>now</strong>.</p>")]), folder("c2", "Rise", [doc("b", "B")])],
    settings({ title: "Kellis & Co", author: "J. Batt", includeAbout: true, aboutAuthor: "Writes." }),
  );

  it("lays out a valid package", () => {
    const files = buildEpubFiles(m, { id: "1234", modified: new Date("2026-10-17T00:00:00Z") });
    expect(files[0]).toEqual({ path: "mimetype", content: "application/epub+zip" });
    const paths = files.map((f) => f.path);
    expect(paths).toEqual([
      "mimetype",
      "META-INF/container.xml",
      "OEBPS/content.opf",
      "OEBPS/nav.xhtml",
      "OEBPS/toc.ncx",
      "OEBPS/style.css",
      "OEBPS/title.xhtml",
      "OEBPS/chapter-001.xhtml",
      "OEBPS/chapter-002.xhtml",
      "OEBPS/about.xhtml",
    ]);
    const opf = files.find((f) => f.path === "OEBPS/content.opf")!.content;
    expect(opf).toContain("<dc:title>Kellis &amp; Co</dc:title>");
    expect(opf).toContain('<meta property="dcterms:modified">2026-10-17T00:00:00Z</meta>');
    for (const id of ["title", "ch001", "ch002", "about"]) {
      expect(opf).toContain(`<itemref idref="${id}"/>`);
      expect(opf).toMatch(new RegExp(`<item id="${id}" href="[^"]+\\.xhtml" media-type="application/xhtml\\+xml"/>`));
    }
    expect(opf).toContain('properties="nav"');
    const container = files.find((f) => f.path === "META-INF/container.xml")!.content;
    expect(container).toContain('full-path="OEBPS/content.opf"');
    const nav = files.find((f) => f.path === "OEBPS/nav.xhtml")!.content;
    expect(nav).toContain('<a href="chapter-001.xhtml">Chapter 1: The Fall</a>');

    // Every XML file parses as XML.
    for (const f of files.filter((x) => /\.(xhtml|opf|ncx|xml)$/.test(x.path))) {
      const parsed = new DOMParser().parseFromString(f.content, "application/xml");
      expect(parsed.getElementsByTagName("parsererror").length, f.path).toBe(0);
    }
    const ch1 = files.find((f) => f.path === "OEBPS/chapter-001.xhtml")!.content;
    expect(ch1).toContain("<p>Fish &amp; chips <strong>now</strong>.</p>");
  });

  it("zips with an uncompressed mimetype first", async () => {
    const bytes = await buildEpub(m, { id: "1234" });
    // Local file header: name at offset 30, compression method at offset 8 (0 = stored).
    expect(new TextDecoder().decode(bytes.slice(30, 38))).toBe("mimetype");
    expect(bytes[8] | (bytes[9] << 8)).toBe(0);
    const zip = await JSZip.loadAsync(bytes);
    expect(await zip.file("mimetype")!.async("string")).toBe("application/epub+zip");
    expect(zip.file("OEBPS/chapter-002.xhtml")).not.toBeNull();
  });
});

describe("docx", () => {
  it("builds a document with the running header and title-page switch", async () => {
    const m = buildManuscript([folder("c1", "The Fall", [doc("a", "A", "<p>Words <em>here</em>.</p>")])], settings({ title: "Kellis", author: "J. Batt" }));
    const blob = await buildManuscriptDocx(m);
    const buf = await new Promise<ArrayBuffer>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as ArrayBuffer);
      fr.readAsArrayBuffer(blob);
    });
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain(">Kellis<");
    expect(xml).toContain("Chapter 1");
    expect(xml).toContain("about 100 words");
    expect(xml).toContain("w:titlePg");
    const headers = Object.keys(zip.files).filter((p) => /word\/header\d+\.xml$/.test(p));
    const headerXml = (await Promise.all(headers.map((p) => zip.file(p)!.async("string")))).join("");
    expect(headerXml).toContain("Batt / KELLIS / ");
  });
});
