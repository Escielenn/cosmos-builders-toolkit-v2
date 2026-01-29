/**
 * Plain text formatters for exporting worksheets
 * No external dependencies - uses ASCII art for formatting
 */

// Box drawing characters for headers
const LINE_CHAR = "─";
const CORNER_TL = "┌";
const CORNER_TR = "┐";
const CORNER_BL = "└";
const CORNER_BR = "┘";
const SIDE_CHAR = "│";

export const createSeparator = (width: number = 60): string => {
  return LINE_CHAR.repeat(width);
};

export const createHeader = (title: string, width: number = 60): string => {
  const padding = Math.max(0, width - title.length - 4);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;

  return [
    CORNER_TL + LINE_CHAR.repeat(width - 2) + CORNER_TR,
    SIDE_CHAR + " ".repeat(leftPad) + title.toUpperCase() + " ".repeat(rightPad) + SIDE_CHAR,
    CORNER_BL + LINE_CHAR.repeat(width - 2) + CORNER_BR,
  ].join("\n");
};

export const createSection = (title: string): string => {
  return `\n${"=".repeat(title.length + 4)}\n  ${title}\n${"=".repeat(title.length + 4)}\n`;
};

export const createSubSection = (title: string): string => {
  return `\n--- ${title} ---\n`;
};

export const createKeyValue = (key: string, value: string | number | undefined | null, indent: number = 0): string => {
  const indentStr = " ".repeat(indent);
  const displayValue = value ?? "Not specified";
  return `${indentStr}${key}: ${displayValue}`;
};

export const createList = (items: string[], indent: number = 2): string => {
  if (!items || items.length === 0) return " ".repeat(indent) + "None specified";
  return items.map(item => " ".repeat(indent) + "• " + item).join("\n");
};

export const createNumberedList = (items: string[], indent: number = 2): string => {
  if (!items || items.length === 0) return " ".repeat(indent) + "None specified";
  return items.map((item, i) => " ".repeat(indent) + `${i + 1}. ${item}`).join("\n");
};

export const createTable = (headers: string[], rows: string[][]): string => {
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxDataWidth = Math.max(...rows.map(r => (r[i] || "").length));
    return Math.max(h.length, maxDataWidth);
  });

  // Create header row
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ");
  const separatorRow = colWidths.map(w => "-".repeat(w)).join("-+-");

  // Create data rows
  const dataRows = rows.map(row =>
    row.map((cell, i) => (cell || "").padEnd(colWidths[i])).join(" | ")
  );

  return [headerRow, separatorRow, ...dataRows].join("\n");
};

export const wrapText = (text: string, width: number = 60, indent: number = 0): string => {
  if (!text) return "";

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = " ".repeat(indent);

  for (const word of words) {
    if ((currentLine + " " + word).length > width) {
      lines.push(currentLine);
      currentLine = " ".repeat(indent) + word;
    } else {
      currentLine += (currentLine.trim() ? " " : "") + word;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines.join("\n");
};

export const formatDate = (date?: Date): string => {
  const d = date || new Date();
  return d.toISOString().split("T")[0];
};

export const createFooter = (): string => {
  return [
    "",
    createSeparator(),
    `Generated: ${formatDate()}`,
    "© 2026 Jason D. Batt, Ph.D. • stellarforge.tools",
    createSeparator(),
  ].join("\n");
};
