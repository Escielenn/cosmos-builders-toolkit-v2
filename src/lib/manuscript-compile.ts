// ---------------------------------------------------------------------------
// manuscript-compile.ts — stitches writing-space documents into exportable
// manuscript formats.
//
// Supports: .docx (standard manuscript format), Markdown, plain text.
// PDF is handled separately via @react-pdf/renderer if needed.
// ---------------------------------------------------------------------------

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManuscriptChapter {
  id: string;
  title: string;
  content: string; // HTML from Tiptap
  folderName?: string;
}

export interface ManuscriptMeta {
  title: string;
  author: string;
  subtitle?: string;
}

// ---------------------------------------------------------------------------
// HTML → text helpers
// ---------------------------------------------------------------------------

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li>/gi, "  - ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<u>(.*?)<\/u>/gi, "_$1_")
    .replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split HTML content into paragraphs for docx rendering.
 * Returns an array of { text, bold, italic } segments per paragraph.
 */
function htmlToParagraphs(html: string): { text: string; bold?: boolean; italic?: boolean }[][] {
  const blocks = html.split(/<\/p>|<br\s*\/?>|<\/h[1-6]>/gi).filter(Boolean);
  return blocks.map((block) => {
    const segments: { text: string; bold?: boolean; italic?: boolean }[] = [];
    // Simple tag-aware splitting
    const cleaned = block.replace(/<p[^>]*>|<h[1-6][^>]*>/gi, "");
    // Process bold/italic inline
    let remaining = cleaned;
    const re = /<(strong|b|em|i)>(.*?)<\/\1>/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        const plain = remaining.slice(lastIndex, match.index).replace(/<[^>]+>/g, "");
        if (plain) segments.push({ text: decodeEntities(plain) });
      }
      const tag = match[1].toLowerCase();
      const inner = match[2].replace(/<[^>]+>/g, "");
      segments.push({
        text: decodeEntities(inner),
        bold: tag === "strong" || tag === "b",
        italic: tag === "em" || tag === "i",
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      const tail = remaining.slice(lastIndex).replace(/<[^>]+>/g, "");
      if (tail.trim()) segments.push({ text: decodeEntities(tail) });
    }
    if (segments.length === 0) segments.push({ text: "" });
    return segments;
  });
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ---------------------------------------------------------------------------
// .docx export — standard manuscript format
// (Times New Roman 12pt, double-spaced, 1" margins, page breaks at chapters)
// ---------------------------------------------------------------------------

export async function compileManuscriptDocx(
  meta: ManuscriptMeta,
  chapters: ManuscriptChapter[]
): Promise<void> {
  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({ spacing: { before: 4800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: meta.title.toUpperCase(),
          font: "Times New Roman",
          size: 28,
        }),
      ],
    })
  );
  if (meta.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: meta.subtitle,
            font: "Times New Roman",
            size: 24,
            italics: true,
          }),
        ],
      })
    );
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: `by ${meta.author}`,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Chapters
  for (const chapter of chapters) {
    // Chapter heading with page break
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: chapter.title || "Untitled",
            font: "Times New Roman",
            size: 28,
          }),
        ],
      })
    );

    // Chapter body — convert HTML to paragraphs
    const paragraphs = htmlToParagraphs(chapter.content || "");
    for (const segments of paragraphs) {
      children.push(
        new Paragraph({
          spacing: { line: 480 }, // double-spaced (480 twips = 2x)
          indent: { firstLine: 720 }, // 0.5" first-line indent
          children: segments.map(
            (seg) =>
              new TextRun({
                text: seg.text,
                font: "Times New Roman",
                size: 24, // 12pt
                bold: seg.bold,
                italics: seg.italic,
              })
          ),
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1"
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${meta.author} / ${meta.title} / `,
                    font: "Times New Roman",
                    size: 20,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Times New Roman",
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({ children: [] }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = meta.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  saveAs(blob, `${filename || "manuscript"}.docx`);
}

// ---------------------------------------------------------------------------
// Markdown export
// ---------------------------------------------------------------------------

export function compileManuscriptMarkdown(
  meta: ManuscriptMeta,
  chapters: ManuscriptChapter[]
): string {
  const lines: string[] = [];

  lines.push(`# ${meta.title}`);
  if (meta.subtitle) lines.push(`*${meta.subtitle}*`);
  lines.push(`by ${meta.author}`);
  lines.push("", "---", "");

  for (const chapter of chapters) {
    lines.push(`## ${chapter.title || "Untitled"}`);
    lines.push("");
    lines.push(htmlToMarkdown(chapter.content || ""));
    lines.push("", "---", "");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Plain text export (for Scrivener import, etc.)
// ---------------------------------------------------------------------------

export function compileManuscriptPlainText(
  meta: ManuscriptMeta,
  chapters: ManuscriptChapter[]
): string {
  const lines: string[] = [];

  lines.push(meta.title.toUpperCase());
  if (meta.subtitle) lines.push(meta.subtitle);
  lines.push(`by ${meta.author}`);
  lines.push("", "=".repeat(40), "");

  for (const chapter of chapters) {
    lines.push("");
    lines.push((chapter.title || "Untitled").toUpperCase());
    lines.push("-".repeat(Math.min(40, (chapter.title || "Untitled").length)));
    lines.push("");
    lines.push(htmlToText(chapter.content || ""));
    lines.push("");
  }

  return lines.join("\n");
}
