// ---------------------------------------------------------------------------
// run-report: one simulation run, as a document a writer can keep.
//
// The simulators hand their live state to the host page as a SimulatorPayload
// ({ parameters, results }). This module turns that payload into a run
// summary (inputs, key outputs, and the facts the Publish dialog would promote
// to canon) and renders it as Markdown. The PDF template reads the same
// report, so the two formats can never disagree about a number.
//
// Pure by design: no React, no network, no DOM.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";
import { extractSimulationFacts } from "@/lib/simulation-facts";

export interface SimRunPayload {
  name?: string;
  parameters?: Record<string, unknown>;
  results?: Record<string, unknown>;
}

export interface SimRunRow {
  label: string;
  value: string;
}

export interface SimRunReport {
  simulatorType: string;
  simulatorName: string;
  /** The run's own name when the simulator gave it one (a system name, say). */
  runName: string;
  worldName?: string;
  generatedAt: string;
  inputs: SimRunRow[];
  outputs: SimRunRow[];
  /** What Publish would promote to canon: the same extractor, the same values. */
  facts: WorksheetFact[];
  notes: SimRunRow[];
}

export const SIMULATOR_NAMES: Record<string, string> = {
  solaris: "Solaris",
  tidelock: "Tidelock",
  exoforge: "ExoForge",
  exosky: "ExoSky",
  rogue: "Rogue",
};

/** Rows past this are summarised: a run report is a summary, not a dump. */
export const MAX_ROWS = 40;

const SKIP_KEYS = new Set(["sf2System", "thumbnail", "thumbnailUrl", "image", "canvas"]);

/** "orbitalDistance" / "orbital_distance" / "tSSP" -> "Orbital Distance" / "T SSP". */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
  return spaced.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** A value as a writer would read it, or null when it has no readable form. */
export function formatRunValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    if (Number.isInteger(value)) return value.toLocaleString("en-US");
    const abs = Math.abs(value);
    if (abs >= 100) return Math.round(value).toLocaleString("en-US");
    if (abs >= 1) return value.toFixed(2).replace(/\.?0+$/, "");
    if (abs >= 0.001) return value.toPrecision(3).replace(/\.?0+$/, "");
    return value.toExponential(2);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const t = value.trim();
    return t ? t : null;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      const shown = value.slice(0, 8).map((v) => formatRunValue(v)).filter(Boolean);
      return value.length > 8 ? `${shown.join(", ")} (+${value.length - 8} more)` : shown.join(", ");
    }
    return `${value.length} ${value.length === 1 ? "item" : "items"}`;
  }
  return null;
}

/**
 * Flatten one level of nesting ("star.mass" -> "Star Mass"); deeper objects
 * and object arrays are summarised by count rather than dumped.
 */
export function flattenRunRecord(record: Record<string, unknown> | undefined): SimRunRow[] {
  if (!record || typeof record !== "object") return [];
  const rows: SimRunRow[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEYS.has(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [inner, innerValue] of Object.entries(value as Record<string, unknown>)) {
        if (SKIP_KEYS.has(inner)) continue;
        const v = formatRunValue(innerValue);
        if (v !== null) rows.push({ label: `${humanizeKey(key)} ${humanizeKey(inner)}`, value: v });
      }
      continue;
    }
    const v = formatRunValue(value);
    if (v !== null) rows.push({ label: humanizeKey(key), value: v });
  }
  if (rows.length > MAX_ROWS) {
    const extra = rows.length - MAX_ROWS;
    return [...rows.slice(0, MAX_ROWS), { label: "Further values", value: `${extra} more in the JSON export` }];
  }
  return rows;
}

export function buildSimRunReport(input: {
  simulatorType: string;
  payload: SimRunPayload | null | undefined;
  worldName?: string;
  narrativeNotes?: Record<string, string>;
  now?: Date;
}): SimRunReport {
  const { simulatorType, payload, worldName, narrativeNotes } = input;
  const now = input.now ?? new Date();
  const facts = payload ? extractSimulationFacts(simulatorType, payload) : [];
  const notes = Object.entries(narrativeNotes ?? {})
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([k, v]) => ({ label: humanizeKey(k), value: v.trim() }));
  return {
    simulatorType,
    simulatorName: SIMULATOR_NAMES[simulatorType] ?? humanizeKey(simulatorType),
    runName: (payload?.name ?? "").trim(),
    worldName,
    generatedAt: now.toISOString(),
    inputs: flattenRunRecord(payload?.parameters),
    outputs: flattenRunRecord(payload?.results),
    facts,
    notes,
  };
}

function mdCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

function mdTable(rows: SimRunRow[], left: string, right: string): string[] {
  return [`| ${left} | ${right} |`, "| --- | --- |", ...rows.map((r) => `| ${mdCell(r.label)} | ${mdCell(r.value)} |`)];
}

/** The run report as Markdown: title, provenance line, then one table per part. */
export function simRunReportToMarkdown(report: SimRunReport): string {
  const title = report.runName ? `${report.simulatorName} run: ${report.runName}` : `${report.simulatorName} run`;
  const meta = [
    report.worldName ? `World: ${report.worldName}` : null,
    `Generated ${report.generatedAt.slice(0, 10)}`,
    "StellarForge.tools",
  ].filter(Boolean);
  const lines: string[] = [`# ${title}`, "", `_${meta.join(" · ")}_`, ""];

  lines.push("## Inputs", "");
  lines.push(...(report.inputs.length ? mdTable(report.inputs, "Parameter", "Value") : ["_No inputs recorded._"]), "");
  lines.push("## Key outputs", "");
  lines.push(...(report.outputs.length ? mdTable(report.outputs, "Output", "Value") : ["_No outputs recorded._"]), "");
  lines.push("## Facts for canon", "");
  if (report.facts.length) {
    lines.push("Values Publish promotes to the world's canon.", "");
    lines.push(...mdTable(report.facts.map((f) => ({ label: f.label, value: f.value })), "Fact", "Value"), "");
  } else {
    lines.push("_This run yields no publishable facts yet._", "");
  }
  if (report.notes.length) {
    lines.push("## Narrative notes", "");
    for (const n of report.notes) lines.push(`**${n.label}**`, "", n.value, "");
  }
  return lines.join("\n").trimEnd() + "\n";
}
