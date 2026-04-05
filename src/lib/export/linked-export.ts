/**
 * Cross-Tool Linked Export
 *
 * Generates a unified document from multiple related worksheets,
 * including inline cross-references and a relationships appendix.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface LinkedExportOptions {
  worldId: string;
  worksheetIds: string[]; // specific worksheets to include
  format: "markdown" | "text";
  includeCrossReferences: boolean;
}

interface WorksheetRow {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ConnectionRow {
  id: string;
  source_worksheet_id: string | null;
  target_worksheet_id: string | null;
  connection_type: string;
  description: string | null;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatToolType(toolType: string): string {
  return toolType
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Flatten nested worksheet data into a readable key/value summary.
 * Limits depth to keep output clean.
 */
function summarizeData(
  data: Record<string, unknown>,
  format: "markdown" | "text",
  indent = ""
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .trim();

    if (value === null || value === undefined || value === "") continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      const allPrimitive = value.every(
        (v) => typeof v !== "object" || v === null
      );
      if (allPrimitive) {
        lines.push(`${indent}${label}: ${value.join(", ")}`);
      } else {
        lines.push(`${indent}${label}:`);
        for (const item of value) {
          if (typeof item === "object" && item !== null) {
            lines.push(
              summarizeData(
                item as Record<string, unknown>,
                format,
                indent + "  "
              )
            );
          } else {
            lines.push(`${indent}  - ${String(item)}`);
          }
        }
      }
    } else if (typeof value === "object") {
      lines.push(`${indent}${label}:`);
      lines.push(
        summarizeData(
          value as Record<string, unknown>,
          format,
          indent + "  "
        )
      );
    } else {
      lines.push(`${indent}${label}: ${String(value)}`);
    }
  }

  return lines.join("\n");
}

// ──────────────────────────────────────────────
// Cross-reference resolution
// ──────────────────────────────────────────────

interface CrossReference {
  sourceWorksheetId: string;
  sourceTitle: string;
  targetWorksheetId: string;
  targetTitle: string;
  connectionType: string;
  description: string | null;
}

function resolveCrossReferences(
  connections: ConnectionRow[],
  worksheetMap: Map<string, WorksheetRow>
): CrossReference[] {
  const refs: CrossReference[] = [];

  for (const conn of connections) {
    const source = conn.source_worksheet_id
      ? worksheetMap.get(conn.source_worksheet_id)
      : null;
    const target = conn.target_worksheet_id
      ? worksheetMap.get(conn.target_worksheet_id)
      : null;

    // Only include connections where both endpoints are in the export set
    if (source && target) {
      refs.push({
        sourceWorksheetId: source.id,
        sourceTitle: source.title || formatToolType(source.tool_type),
        targetWorksheetId: target.id,
        targetTitle: target.title || formatToolType(target.tool_type),
        connectionType: conn.connection_type,
        description: conn.description,
      });
    }
  }

  return refs;
}

// ──────────────────────────────────────────────
// Main export function
// ──────────────────────────────────────────────

export async function generateLinkedExport(
  options: LinkedExportOptions,
  supabase: SupabaseClient
): Promise<string> {
  const { worldId, worksheetIds, format, includeCrossReferences } = options;

  // 1. Fetch all requested worksheets
  const { data: worksheetsRaw, error: wsError } = await supabase
    .from("worksheets")
    .select("id, tool_type, title, data, created_at, updated_at")
    .eq("world_id", worldId)
    .in("id", worksheetIds)
    .order("updated_at", { ascending: false });

  if (wsError) throw new Error(`Failed to fetch worksheets: ${wsError.message}`);

  const worksheets = (worksheetsRaw || []) as WorksheetRow[];
  const worksheetMap = new Map<string, WorksheetRow>();
  for (const ws of worksheets) {
    worksheetMap.set(ws.id, ws);
  }

  // 2. Fetch connections between the included worksheets
  let crossRefs: CrossReference[] = [];
  let connections: ConnectionRow[] = [];

  if (includeCrossReferences && worksheetIds.length > 1) {
    const { data: connsRaw, error: connError } = await supabase
      .from("world_connections")
      .select("id, source_worksheet_id, target_worksheet_id, connection_type, description")
      .eq("world_id", worldId);

    if (connError) {
      console.error("Failed to fetch connections:", connError);
    } else {
      connections = (connsRaw || []) as ConnectionRow[];
      // Filter to only connections where both endpoints are in our worksheet set
      const idSet = new Set(worksheetIds);
      connections = connections.filter(
        (c) =>
          c.source_worksheet_id &&
          c.target_worksheet_id &&
          idSet.has(c.source_worksheet_id) &&
          idSet.has(c.target_worksheet_id)
      );
      crossRefs = resolveCrossReferences(connections, worksheetMap);
    }
  }

  // 3. Build cross-reference lookup: worksheetId -> list of refs pointing away from it
  const refsFromWorksheet = new Map<string, CrossReference[]>();
  if (includeCrossReferences) {
    for (const ref of crossRefs) {
      // Add forward reference from source
      const existing = refsFromWorksheet.get(ref.sourceWorksheetId) || [];
      existing.push(ref);
      refsFromWorksheet.set(ref.sourceWorksheetId, existing);

      // Add reverse reference from target
      const existingReverse = refsFromWorksheet.get(ref.targetWorksheetId) || [];
      existingReverse.push({
        ...ref,
        // Swap for display from the target's perspective
        sourceWorksheetId: ref.targetWorksheetId,
        sourceTitle: ref.targetTitle,
        targetWorksheetId: ref.sourceWorksheetId,
        targetTitle: ref.sourceTitle,
      });
      refsFromWorksheet.set(ref.targetWorksheetId, existingReverse);
    }
  }

  // 4. Generate the document
  const isMarkdown = format === "markdown";
  const sections: string[] = [];

  // Header
  const { data: worldRow } = await supabase
    .from("worlds")
    .select("name")
    .eq("id", worldId)
    .single();

  const worldName = worldRow?.name || "Unknown World";

  if (isMarkdown) {
    sections.push(`# ${worldName} - Linked Export`);
    sections.push("");
    sections.push(
      `*Exported ${new Date().toLocaleDateString()} | ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"}*`
    );
    sections.push("");
    sections.push("---");
    sections.push("");
  } else {
    sections.push(worldName.toUpperCase() + " - LINKED EXPORT");
    sections.push("=".repeat(worldName.length + 17));
    sections.push("");
    sections.push(
      `Exported: ${new Date().toLocaleDateString()} | ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"}`
    );
    sections.push("");
  }

  // Table of Contents
  if (isMarkdown) {
    sections.push("## Table of Contents");
    sections.push("");
    for (let i = 0; i < worksheets.length; i++) {
      const ws = worksheets[i];
      const title = ws.title || formatToolType(ws.tool_type);
      const anchor = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      sections.push(`${i + 1}. [${title}](#${anchor})`);
    }
    if (includeCrossReferences && crossRefs.length > 0) {
      sections.push(
        `${worksheets.length + 1}. [Relationships](#relationships)`
      );
    }
    sections.push("");
    sections.push("---");
    sections.push("");
  } else {
    sections.push("TABLE OF CONTENTS");
    sections.push("-".repeat(17));
    sections.push("");
    for (let i = 0; i < worksheets.length; i++) {
      const ws = worksheets[i];
      const title = ws.title || formatToolType(ws.tool_type);
      sections.push(`  ${i + 1}. ${title}`);
    }
    if (includeCrossReferences && crossRefs.length > 0) {
      sections.push(`  ${worksheets.length + 1}. Relationships`);
    }
    sections.push("");
  }

  // Each worksheet as a section
  for (const ws of worksheets) {
    const title = ws.title || formatToolType(ws.tool_type);
    const toolLabel = formatToolType(ws.tool_type);

    if (isMarkdown) {
      sections.push(`## ${title}`);
      sections.push("");
      sections.push(`*Tool: ${toolLabel} | Updated: ${new Date(ws.updated_at).toLocaleDateString()}*`);
      sections.push("");
    } else {
      sections.push(title.toUpperCase());
      sections.push("-".repeat(title.length));
      sections.push(`Tool: ${toolLabel} | Updated: ${new Date(ws.updated_at).toLocaleDateString()}`);
      sections.push("");
    }

    // Worksheet data summary
    if (ws.data && typeof ws.data === "object") {
      sections.push(summarizeData(ws.data, format));
      sections.push("");
    }

    // Cross-reference annotations
    if (includeCrossReferences) {
      const refs = refsFromWorksheet.get(ws.id);
      if (refs && refs.length > 0) {
        // Deduplicate by target
        const seen = new Set<string>();
        const unique = refs.filter((r) => {
          const key = r.targetWorksheetId;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (isMarkdown) {
          sections.push("> **See also:**");
          for (const ref of unique) {
            const desc = ref.description ? ` - ${ref.description}` : "";
            sections.push(
              `> - [${ref.targetTitle}](#${ref.targetTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}) (${ref.connectionType}${desc})`
            );
          }
          sections.push("");
        } else {
          sections.push(`  See also:`);
          for (const ref of unique) {
            const desc = ref.description ? ` - ${ref.description}` : "";
            sections.push(
              `    -> ${ref.targetTitle} (${ref.connectionType}${desc})`
            );
          }
          sections.push("");
        }
      }
    }

    if (isMarkdown) {
      sections.push("---");
      sections.push("");
    } else {
      sections.push("");
    }
  }

  // Relationships appendix
  if (includeCrossReferences && crossRefs.length > 0) {
    if (isMarkdown) {
      sections.push("## Relationships");
      sections.push("");
      sections.push(
        "All connections between the worksheets included in this export."
      );
      sections.push("");
      sections.push(
        "| Source | Relationship | Target | Description |"
      );
      sections.push("|--------|-------------|--------|-------------|");
      for (const ref of crossRefs) {
        const desc = ref.description || "";
        sections.push(
          `| ${ref.sourceTitle} | ${ref.connectionType} | ${ref.targetTitle} | ${desc} |`
        );
      }
      sections.push("");
    } else {
      sections.push("RELATIONSHIPS");
      sections.push("=".repeat(13));
      sections.push("");
      sections.push(
        "All connections between the worksheets included in this export."
      );
      sections.push("");
      for (const ref of crossRefs) {
        const desc = ref.description ? ` (${ref.description})` : "";
        sections.push(
          `  ${ref.sourceTitle}  -->  ${ref.targetTitle}  [${ref.connectionType}]${desc}`
        );
      }
      sections.push("");
    }
  }

  // Footer
  if (isMarkdown) {
    sections.push("---");
    sections.push("");
    sections.push("*Generated by [StellarForge](https://stellarforge.tools)*");
  } else {
    sections.push("");
    sections.push("Generated by stellarforge.tools");
  }

  return sections.join("\n");
}
