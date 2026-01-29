/**
 * Generic plain text template for any worksheet
 * Intelligently formats nested objects and arrays
 */

import {
  createHeader,
  createSection,
  createSubSection,
  createKeyValue,
  createList,
  wrapText,
  createFooter,
} from "../formatters";

interface GenericTextOptions {
  toolName: string;
  worldName?: string;
  worksheetTitle?: string;
  data: Record<string, unknown>;
}

export const generateGenericText = ({
  toolName,
  worldName,
  worksheetTitle,
  data,
}: GenericTextOptions): string => {
  const lines: string[] = [];

  // Header
  lines.push(createHeader(toolName));
  if (worksheetTitle) {
    lines.push(`Worksheet: ${worksheetTitle}`);
  }
  if (worldName) {
    lines.push(`World: ${worldName}`);
  }
  lines.push("");

  // Process data recursively
  const processedData = processData(data);
  lines.push(processedData);

  lines.push(createFooter());

  return lines.join("\n");
};

function processData(data: Record<string, unknown>, depth: number = 0): string {
  const lines: string[] = [];
  const indent = depth * 2;

  for (const [key, value] of Object.entries(data)) {
    // Skip internal fields
    if (key.startsWith("_")) continue;

    const label = formatLabel(key);

    if (value === null || value === undefined || value === "") {
      // Skip empty values
      continue;
    } else if (typeof value === "string") {
      if (value.length > 80) {
        // Long text - wrap it
        lines.push(`\n${" ".repeat(indent)}${label}:`);
        lines.push(wrapText(value, 60, indent + 2));
      } else {
        lines.push(createKeyValue(label, value, indent));
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      lines.push(createKeyValue(label, String(value), indent));
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;

      lines.push(`\n${" ".repeat(indent)}${label}:`);

      if (typeof value[0] === "string") {
        // Array of strings
        lines.push(createList(value as string[], indent + 2));
      } else if (typeof value[0] === "object") {
        // Array of objects
        value.forEach((item, i) => {
          lines.push(`${" ".repeat(indent + 2)}[${i + 1}]`);
          lines.push(processData(item as Record<string, unknown>, depth + 2));
        });
      }
    } else if (typeof value === "object") {
      // Nested object - create a section
      if (depth === 0) {
        lines.push(createSection(label));
      } else {
        lines.push(createSubSection(label));
      }
      lines.push(processData(value as Record<string, unknown>, depth + 1));
    }
  }

  return lines.join("\n");
}

function formatLabel(key: string): string {
  return key
    // Split on camelCase
    .replace(/([A-Z])/g, " $1")
    // Split on underscores
    .replace(/_/g, " ")
    // Capitalize first letter
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
