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
} from "docx";
import { saveAs } from "file-saver";

// StellarForge brand colors
const COLORS = {
  primary: "00D4FF", // Cyan
  text: "1A1A1A",
  muted: "666666",
};

interface DocxGeneratorOptions {
  toolName: string;
  worldName?: string;
  worksheetTitle?: string;
  data: Record<string, unknown>;
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
      text: toolName.toUpperCase(),
      heading: HeadingLevel.HEADING_1,
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
            text: subtitleParts.join(" • "),
            color: COLORS.muted,
            size: 24, // 12pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Process data
  processDataToDocx(data, children, 0);

  // Footer
  children.push(
    new Paragraph({
      spacing: { before: 600 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toISOString().split("T")[0]}`,
          color: COLORS.muted,
          size: 20,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "© 2026 Jason D. Batt, Ph.D. • stellarforge.tools",
          color: COLORS.muted,
          size: 20,
        }),
      ],
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  const filename = [
    toolName.toLowerCase().replace(/\s+/g, "-"),
    worksheetTitle?.toLowerCase().replace(/\s+/g, "-"),
    new Date().toISOString().split("T")[0],
  ]
    .filter(Boolean)
    .join("-");

  saveAs(blob, `${filename}.docx`);
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
            text: label,
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
          text: label,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      if (typeof value[0] === "string") {
        // Bullet list
        value.forEach((item) => {
          children.push(
            new Paragraph({
              text: `• ${item}`,
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
          text: label,
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
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          shading: { fill: "F0F0F0" },
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
