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
  TabStopType,
  TabStopPosition,
} from "docx";
import { saveAs } from "file-saver";

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
      if (value.length > 100) {
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
            text: value,
            spacing: { after: 200 },
          })
        );
      } else {
        // Short text - inline
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${label}: `, bold: true }),
              new TextRun({ text: value }),
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
