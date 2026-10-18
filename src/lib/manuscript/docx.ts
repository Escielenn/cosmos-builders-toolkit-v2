// ---------------------------------------------------------------------------
// docx, a compiled manuscript as Word, in Standard Manuscript Format.
//
//   12pt Times New Roman or Courier New, double spaced (or single for a
//   reading copy), 1in margins, 0.5in first-line indent.
//   Title page: contact block top left, "about N words" top right, title and
//   byline centred a third of the way down. No running header on it.
//   Running header on every other page, right aligned: Surname / TITLE / page.
//   Each section starts on a new page, its heading a third of the way down.
//   Scene separators centred.
//
// The `docx` library (with file-saver) loads only at export.
// ---------------------------------------------------------------------------

import type { Paragraph as DocxParagraph, TextRun as DocxTextRun } from "docx";
import type { Block, Run } from "./blocks";
import { approxWordsLine, sectionHeading, showDocTitle, surnameOf, type Manuscript } from "./compile";

const TWIP_INCH = 1440;

export async function buildManuscriptDocx(m: Manuscript): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Header,
    PageNumber,
    AlignmentType,
    TabStopType,
    ExternalHyperlink,
  } = await import("docx");

  const font = m.font === "courier" ? "Courier New" : "Times New Roman";
  const size = 24; // half-points: 12pt
  const line = m.doubleSpaced ? 480 : 276;
  const text = (t: string, o: { bold?: boolean; italics?: boolean; underline?: boolean; strike?: boolean; allCaps?: boolean } = {}) =>
    new TextRun({
      text: t,
      font,
      size,
      bold: o.bold,
      italics: o.italics,
      underline: o.underline ? {} : undefined,
      strike: o.strike,
      allCaps: o.allCaps,
    });

  const runsToDocx = (runs: Run[]): (DocxTextRun | InstanceType<typeof ExternalHyperlink>)[] => {
    const out: (DocxTextRun | InstanceType<typeof ExternalHyperlink>)[] = [];
    for (const r of runs) {
      if (r.text === "\n") {
        out.push(new TextRun({ break: 1, font, size }));
        continue;
      }
      // Courier has no italics convention in manuscripts: underline instead.
      const italics = m.font === "courier" ? false : r.italic;
      const underline = r.underline || (m.font === "courier" && r.italic);
      const run = text(r.text, { bold: r.bold, italics, underline, strike: r.strike });
      out.push(r.href ? new ExternalHyperlink({ link: r.href, children: [run] }) : run);
    }
    return out;
  };

  const body = (b: Block, first: boolean): DocxParagraph => {
    if (b.type === "hr") {
      return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line }, children: [text("#")] });
    }
    if (b.type === "h") {
      return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line, before: 240 }, children: runsToDocx(b.runs) });
    }
    if (b.type === "quote") {
      return new Paragraph({ spacing: { line }, indent: { left: TWIP_INCH / 2, right: TWIP_INCH / 2 }, children: runsToDocx(b.runs) });
    }
    if (b.type === "li") {
      return new Paragraph({
        spacing: { line },
        indent: { left: TWIP_INCH / 2 + b.depth * 360, hanging: 360 },
        children: [text(b.ordered ? `${b.index}.\t` : "•\t"), ...runsToDocx(b.runs)],
      });
    }
    return new Paragraph({
      spacing: { line },
      indent: first ? undefined : { firstLine: TWIP_INCH / 2 },
      children: runsToDocx(b.runs),
    });
  };

  const children: DocxParagraph[] = [];

  // Title page.
  if (m.titlePage) {
    const contactLines = [m.author, ...m.contact.split("\n").map((l) => l.trim()).filter(Boolean)].filter(Boolean);
    const wordLine = approxWordsLine(m.words);
    const top = Math.max(contactLines.length, 1);
    for (let i = 0; i < top; i++) {
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
          children: [text(contactLines[i] ?? ""), ...(i === 0 ? [text(`\t${wordLine}`)] : [])],
        }),
      );
    }
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 3600 }, children: [text(m.title, { allCaps: true })] }),
    );
    if (m.subtitle) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 }, children: [text(m.subtitle)] }));
    if (m.author) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480 }, children: [text(`by ${m.author}`)] }));
  }

  let firstSection = true;
  const startPage = (headingText: string | null, part: boolean) => {
    const pageBreakBefore = m.titlePage || !firstSection;
    firstSection = false;
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        pageBreakBefore,
        // A third of the way down the page.
        spacing: { before: part ? 4320 : 2880, after: 480, line },
        children: headingText ? [text(headingText)] : [],
      }),
    );
  };

  for (const s of m.sections) {
    startPage(sectionHeading(s), s.kind === "part");
    s.docs.forEach((d, i) => {
      if (i > 0 && m.separator !== null) {
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line }, children: [text(m.separator)] }));
      }
      if (showDocTitle(m, s, d)) {
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line }, children: [text(d.title, { italics: m.font !== "courier", underline: m.font === "courier" })] }));
      }
      let first = true;
      for (const b of d.blocks) {
        children.push(body(b, first));
        first = b.type === "h" || b.type === "hr";
      }
    });
  }

  const backPage = (title: string, blocks: Block[]) => {
    startPage(title, false);
    let first = true;
    for (const b of blocks) {
      children.push(body(b, first));
      first = false;
    }
  };
  if (m.about) {
    backPage(
      "About the Author",
      m.about.split(/\n\s*\n/).map((p) => ({ type: "p" as const, runs: [{ text: p.trim().replace(/\n/g, " ") }] })),
    );
  }
  if (m.appendix) backPage("Appendix: World Reference", m.appendix);
  for (const b of m.backMatter) backPage(b.title, b.blocks);

  const surname = surnameOf(m.author);
  const headerText = [surname, m.title.toUpperCase()].filter(Boolean).join(" / ");
  const runningHeader = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          text(`${headerText} / `),
          new TextRun({ children: [PageNumber.CURRENT], font, size }),
        ],
      }),
    ],
  });

  const doc = new Document({
    creator: m.author || undefined,
    title: m.title,
    styles: { default: { document: { run: { font, size } } } },
    sections: [
      {
        properties: {
          titlePage: m.titlePage,
          page: { margin: { top: TWIP_INCH, right: TWIP_INCH, bottom: TWIP_INCH, left: TWIP_INCH, header: 720 } },
        },
        headers: m.titlePage
          ? { default: runningHeader, first: new Header({ children: [new Paragraph({ children: [] })] }) }
          : { default: runningHeader },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}
