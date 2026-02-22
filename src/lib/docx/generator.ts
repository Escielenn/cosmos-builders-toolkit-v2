/**
 * Word document generator for worksheet exports
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  TabStopType,
  TabStopPosition,
} from "docx";
import { saveAs } from "file-saver";
import { htmlToPlainText } from "@/lib/html-utils";
import type { ExportSection, ExportSubsection } from "@/services/worldExportFormatter";

// StellarForge brand colors
const COLORS = {
  primary: "007A7A", // Darker cyan for print (matches PDF)
  accent: "00D4FF", // Bright cyan
  text: "1A1A1A",
  muted: "666666",
  border: "CCCCCC",
  headerBg: "F0F8F8",
};

interface DocxGeneratorOptions {
  toolName: string;
  worldName?: string;
  worksheetTitle?: string;
  data: Record<string, unknown>;
}

function createBrandedHeader(toolName: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "STELLARFORGE",
            color: COLORS.primary,
            bold: true,
            size: 16, // 8pt
            font: "Calibri",
          }),
          new TextRun({
            text: `  |  ${toolName}`,
            color: COLORS.muted,
            size: 16,
            font: "Calibri",
          }),
        ],
        border: {
          bottom: {
            color: COLORS.border,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
    ],
  });
}

function createBrandedFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: {
            color: COLORS.border,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
        children: [
          new TextRun({
            text: "\u00A9 2026 Jason D. Batt, Ph.D. \u2022 stellarforge.tools",
            color: COLORS.muted,
            size: 14, // 7pt
            font: "Calibri",
          }),
          new TextRun({
            text: "\t",
          }),
          new TextRun({
            text: "Page ",
            color: COLORS.muted,
            size: 14,
            font: "Calibri",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: COLORS.muted,
            size: 14,
            font: "Calibri",
          }),
          new TextRun({
            text: " of ",
            color: COLORS.muted,
            size: 14,
            font: "Calibri",
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            color: COLORS.muted,
            size: 14,
            font: "Calibri",
          }),
        ],
        spacing: { before: 100 },
      }),
    ],
  });
}

export const generateDocx = async ({
  toolName,
  worldName,
  worksheetTitle,
  data,
}: DocxGeneratorOptions): Promise<void> => {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: toolName.toUpperCase(),
          bold: true,
          size: 36, // 18pt
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Subtitle with world/worksheet info
  if (worksheetTitle || worldName) {
    const subtitleParts: string[] = [];
    if (worksheetTitle) subtitleParts.push(worksheetTitle);
    if (worldName) subtitleParts.push(`World: ${worldName}`);

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitleParts.join(" \u2022 "),
            color: COLORS.muted,
            size: 24, // 12pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }

  // Date line
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toISOString().split("T")[0]}`,
          color: COLORS.muted,
          size: 20,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Separator line
  children.push(
    new Paragraph({
      border: {
        bottom: {
          color: COLORS.primary,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      spacing: { after: 400 },
    })
  );

  // Process data
  processDataToDocx(data, children, 0);

  // Create document with branded header/footer
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: createBrandedHeader(toolName),
        },
        footers: {
          default: createBrandedFooter(),
        },
        children: children,
      },
    ],
  });

  // Generate and save
  try {
    const packerBlob = await Packer.toBlob(doc);
    // Wrap with explicit MIME type to ensure browser recognizes as Word document
    const docxBlob = new Blob([packerBlob], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const filename = [
      toolName.toLowerCase().replace(/\s+/g, "-"),
      worksheetTitle?.toLowerCase().replace(/\s+/g, "-"),
      new Date().toISOString().split("T")[0],
    ]
      .filter(Boolean)
      .join("-");

    saveAs(docxBlob, `${filename}.docx`);
  } catch (error) {
    console.error("DOCX generation failed:", error);
    throw error;
  }
};

function processDataToDocx(
  data: Record<string, unknown>,
  children: (Paragraph | Table)[],
  depth: number
): void {
  for (const [key, value] of Object.entries(data)) {
    // Skip internal fields
    if (key.startsWith("_")) continue;

    const label = formatLabel(key);

    if (value === null || value === undefined || value === "") {
      continue;
    } else if (typeof value === "string") {
      const text = htmlToPlainText(value);
      if (text.length > 100) {
        // Long text - heading + paragraph
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                color: COLORS.primary,
                bold: true,
              }),
            ],
            heading: depth === 0 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
            spacing: { before: 200, after: 100 },
          })
        );
        children.push(
          new Paragraph({
            text,
            spacing: { after: 200 },
          })
        );
      } else {
        // Short text - inline
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${label}: `, bold: true }),
              new TextRun({ text }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true }),
            new TextRun({ text: String(value) }),
          ],
          spacing: { after: 100 },
        })
      );
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: label,
              color: COLORS.primary,
              bold: true,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      if (typeof value[0] === "string") {
        // Bullet list
        value.forEach((item) => {
          children.push(
            new Paragraph({
              text: `\u2022 ${item}`,
              spacing: { after: 50 },
            })
          );
        });
      } else if (typeof value[0] === "object") {
        // Table for array of objects
        const headers = Object.keys(value[0] as object);
        const rows = value.map((item) => {
          const obj = item as Record<string, unknown>;
          return headers.map((h) => String(obj[h] || ""));
        });

        children.push(createTable(headers.map(formatLabel), rows));
      }
    } else if (typeof value === "object") {
      // Section heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: label,
              color: COLORS.primary,
              bold: true,
            }),
          ],
          heading: depth === 0 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 100 },
        })
      );
      processDataToDocx(value as Record<string, unknown>, children, depth + 1);
    }
  }
}

function createTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: COLORS.primary })],
            }),
          ],
          shading: { fill: COLORS.headerBg },
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [new Paragraph({ text: cell })],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// ──────────────────────────────────────────────
// World Bible DOCX (ExportSection-based)
// ──────────────────────────────────────────────

interface WorldDocxOptions {
  worldName: string;
  worldDescription?: string;
  sections: ExportSection[];
}

function buildSubsectionParagraphs(sub: ExportSubsection): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  // Subsection title
  out.push(
    new Paragraph({
      children: [
        new TextRun({ text: sub.title, bold: true, color: COLORS.text, size: 26 }),
      ],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 120 },
    })
  );

  // Infobox table
  if (sub.infobox.length > 0) {
    out.push(
      createTable(
        ["Field", "Value"],
        sub.infobox.map((row) => [row.label, row.value])
      )
    );
    out.push(new Paragraph({ spacing: { after: 120 } }));
  }

  // Prose paragraphs
  if (sub.prose && sub.prose.trim()) {
    for (const para of sub.prose.split("\n\n")) {
      if (para.startsWith("## ")) {
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: para.replace("## ", ""), bold: true, size: 24 }),
            ],
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 200, after: 80 },
          })
        );
      } else if (para.startsWith("### ")) {
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: para.replace("### ", ""), bold: true, size: 22, color: COLORS.muted }),
            ],
            spacing: { before: 160, after: 60 },
          })
        );
      } else if (para.trim()) {
        out.push(
          new Paragraph({
            text: para.trim(),
            spacing: { after: 120 },
          })
        );
      }
    }
  }

  // Connections
  if (sub.connections.length > 0) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({ text: "CONNECTIONS", bold: true, color: COLORS.primary, size: 18 }),
        ],
        spacing: { before: 160, after: 60 },
      })
    );
    for (const conn of sub.connections) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${conn.relationship} \u2192 ${conn.targetTitle}`, color: COLORS.muted }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  // Timeline events
  if (sub.timelineEvents.length > 0) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({ text: "TIMELINE", bold: true, color: COLORS.primary, size: 18 }),
        ],
        spacing: { before: 160, after: 60 },
      })
    );
    for (const ev of sub.timelineEvents) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${ev.date}: `, bold: true }),
            new TextRun({ text: ev.title }),
          ],
          spacing: { after: 20 },
        })
      );
      if (ev.description) {
        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ev.description.length > 200
                  ? ev.description.slice(0, 200) + "..."
                  : ev.description,
                color: COLORS.muted,
                size: 20,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  return out;
}

export const generateWorldDocx = async ({
  worldName,
  worldDescription,
  sections,
}: WorldDocxOptions): Promise<void> => {
  const children: (Paragraph | Table)[] = [];

  // Cover title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "STELLARFORGE WORLD BIBLE",
          color: COLORS.primary,
          bold: true,
          size: 20,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: worldName,
          bold: true,
          size: 44,
          color: COLORS.text,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })
  );

  if (worldDescription) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: worldDescription, color: COLORS.muted, size: 24 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
          color: COLORS.muted,
          size: 20,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Separator
  children.push(
    new Paragraph({
      border: {
        bottom: {
          color: COLORS.primary,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      spacing: { after: 400 },
    })
  );

  // Sections
  const contentSections = sections.filter(
    (s) => s.layer !== "overview" && s.layer !== "notes"
  );

  for (let i = 0; i < contentSections.length; i++) {
    const section = contentSections[i];

    // Page break before each section (except the first)
    if (i > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ break: 1 })],
          pageBreakBefore: true,
        })
      );
    }

    // Section heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Section ${i + 1}: ${section.title}`,
            bold: true,
            size: 32,
            color: COLORS.primary,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 80 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${section.subsections.length} element${section.subsections.length !== 1 ? "s" : ""}`,
            color: COLORS.muted,
            size: 20,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Subsections
    for (const sub of section.subsections) {
      children.push(...buildSubsectionParagraphs(sub));
    }
  }

  // Build document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: createBrandedHeader(`${worldName} — World Bible`),
        },
        footers: {
          default: createBrandedFooter(),
        },
        children,
      },
    ],
  });

  const packerBlob = await Packer.toBlob(doc);
  const docxBlob = new Blob([packerBlob], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const filename = `${worldName.toLowerCase().replace(/\s+/g, "-")}-world-bible-${new Date().toISOString().split("T")[0]}`;
  saveAs(docxBlob, `${filename}.docx`);
};
