/**
 * Plain text template for Drake Equation Calculator
 */

import {
  createHeader,
  createSection,
  createKeyValue,
  createTable,
  wrapText,
  createFooter,
} from "../formatters";

interface DrakeTextOptions {
  toolName: string;
  worldName?: string;
  values: Record<string, number>;
  notes: Record<string, string>;
  narrativeFields?: Record<string, string>;
}

export const generateDrakeText = ({
  toolName,
  worldName,
  values,
  notes,
  narrativeFields,
}: DrakeTextOptions): string => {
  const lines: string[] = [];

  // Header
  lines.push(createHeader(toolName));
  if (worldName) {
    lines.push(`World: ${worldName}`);
  }

  // Calculate N
  const N = Object.values(values).reduce((acc, val) => acc * val, 1);
  const interpretation = getInterpretation(N);

  lines.push(createSection("RESULT"));
  lines.push(`N = ${Math.round(N).toLocaleString()} civilizations`);
  lines.push(`Interpretation: ${interpretation}`);

  // Variables table
  lines.push(createSection("VARIABLES"));

  const variableNames: Record<string, string> = {
    R_star: "R* (Star formation rate)",
    f_p: "fp (Fraction with planets)",
    n_e: "ne (Earth-like planets per system)",
    f_l: "fl (Fraction where life develops)",
    f_i: "fi (Fraction with intelligence)",
    f_c: "fc (Fraction that communicate)",
    L: "L (Civilization lifespan in years)",
  };

  const rows = Object.entries(values).map(([key, value]) => [
    variableNames[key] || key,
    value.toString(),
    notes[key] || "",
  ]);

  lines.push(createTable(["Variable", "Value", "Notes"], rows));

  // Narrative fields if present
  if (narrativeFields && Object.keys(narrativeFields).length > 0) {
    lines.push(createSection("WORLDBUILDING NOTES"));

    for (const [key, value] of Object.entries(narrativeFields)) {
      if (value) {
        const label = formatFieldLabel(key);
        lines.push(`\n${label}:`);
        lines.push(wrapText(value, 60, 2));
      }
    }
  }

  lines.push(createFooter());

  return lines.join("\n");
};

function getInterpretation(N: number): string {
  if (N < 1) return "We may be alone";
  if (N < 10) return "Very sparse";
  if (N < 100) return "Sparse";
  if (N < 1000) return "Moderate";
  if (N < 10000) return "Crowded";
  return "Bustling galaxy";
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
