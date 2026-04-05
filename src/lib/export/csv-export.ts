/**
 * CSV Export Utilities
 *
 * A) worksheetToCSV  — flattens a single worksheet's formState into field/value rows
 * B) entitiesToCSV   — exports entities table with resolved names
 * C) connectionsToCSV — exports entity connections with resolved source/target names
 * D) downloadCSV     — triggers a browser download of a CSV string
 */

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Escape a value for CSV (RFC 4180). */
function escapeCSV(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build a CSV string from an array of rows (each row is an array of strings). */
function rowsToCSV(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
}

/**
 * Flatten a nested object into dot-notation key/value pairs.
 * Arrays are joined with semicolons. Nested objects recurse with dot paths.
 */
function flattenObject(
  obj: unknown,
  prefix = "",
  result: Array<[string, string]> = []
): Array<[string, string]> {
  if (obj === null || obj === undefined) {
    if (prefix) result.push([prefix, ""]);
    return result;
  }

  if (Array.isArray(obj)) {
    // Join primitive arrays with semicolons; recurse complex arrays
    const allPrimitive = obj.every(
      (item) => typeof item !== "object" || item === null
    );
    if (allPrimitive) {
      result.push([prefix, obj.map((v) => String(v ?? "")).join("; ")]);
    } else {
      obj.forEach((item, index) => {
        flattenObject(item, prefix ? `${prefix}[${index}]` : `[${index}]`, result);
      });
    }
    return result;
  }

  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const path = prefix ? `${prefix}.${key}` : key;
      flattenObject(record[key], path, result);
    }
    return result;
  }

  // Primitive
  result.push([prefix, String(obj)]);
  return result;
}

// ──────────────────────────────────────────────
// A) Worksheet-level CSV
// ──────────────────────────────────────────────

/**
 * Exports a single worksheet's formState as a two-column CSV (field, value).
 * Nested objects are flattened with dot-notation keys.
 */
export function worksheetToCSV(
  toolName: string,
  formState: Record<string, unknown>
): string {
  const pairs = flattenObject(formState);
  const rows: string[][] = [
    ["field", "value"],
    ["_tool", toolName],
    ["_exported_at", new Date().toISOString()],
    ...pairs,
  ];
  return rowsToCSV(rows);
}

/**
 * Generate a human-readable preview of the flattened CSV data.
 * Returns the first N rows as a formatted string.
 */
export function worksheetCSVPreview(
  toolName: string,
  formState: Record<string, unknown>,
  maxRows = 20
): string {
  const pairs = flattenObject(formState);
  const preview = pairs.slice(0, maxRows);
  const lines = preview.map(([field, value]) => {
    const truncated = value.length > 60 ? value.slice(0, 57) + "..." : value;
    return `${field}: ${truncated}`;
  });
  if (pairs.length > maxRows) {
    lines.push(`... and ${pairs.length - maxRows} more fields`);
  }
  return `Tool: ${toolName}\nFields: ${pairs.length}\n\n${lines.join("\n")}`;
}

// ──────────────────────────────────────────────
// B) World-level CSV — Entities
// ──────────────────────────────────────────────

export interface Entity {
  name: string;
  entity_type: string;
  cascade_stage: string;
  summary: string | null;
  parent_entity_id: string | null;
  tags: string[] | null;
  created_at: string | null;
}

/**
 * Exports entities as a CSV table.
 * parent_entity_id is resolved to a name via the entities array.
 */
export function entitiesToCSV(entities: Entity[]): string {
  const nameById = new Map<string, string>();
  // Build a lookup if entities have ids (they come from DB rows)
  for (const e of entities as Array<Entity & { id?: string }>) {
    if (e.id) nameById.set(e.id, e.name);
  }

  const rows: string[][] = [
    ["name", "entity_type", "cascade_stage", "summary", "parent_entity", "tags", "created_at"],
  ];

  for (const e of entities) {
    const parentName = e.parent_entity_id
      ? nameById.get(e.parent_entity_id) || e.parent_entity_id
      : "";
    rows.push([
      e.name,
      e.entity_type,
      e.cascade_stage,
      e.summary || "",
      parentName,
      (e.tags || []).join("; "),
      e.created_at || "",
    ]);
  }

  return rowsToCSV(rows);
}

// ──────────────────────────────────────────────
// C) World-level CSV — Entity Connections
// ──────────────────────────────────────────────

export interface EntityConnection {
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  cascade_stage: string;
  strength: number | null;
  status: string | null;
  bidirectional: boolean | null;
}

/**
 * Exports entity connections as a CSV table.
 * Entity IDs are resolved to names via the provided entities array.
 */
export function connectionsToCSV(
  connections: EntityConnection[],
  entities: Array<{ id: string; name: string }>
): string {
  const nameById = new Map<string, string>();
  for (const e of entities) {
    nameById.set(e.id, e.name);
  }

  const rows: string[][] = [
    ["source_name", "target_name", "relationship_type", "cascade_stage", "strength", "status", "bidirectional"],
  ];

  for (const c of connections) {
    rows.push([
      nameById.get(c.source_entity_id) || c.source_entity_id,
      nameById.get(c.target_entity_id) || c.target_entity_id,
      c.relationship_type,
      c.cascade_stage,
      c.strength != null ? String(c.strength) : "",
      c.status || "",
      c.bidirectional != null ? String(c.bidirectional) : "",
    ]);
  }

  return rowsToCSV(rows);
}

// ──────────────────────────────────────────────
// D) Download helper
// ──────────────────────────────────────────────

/** Trigger a browser download for a CSV string. */
export function downloadCSV(content: string, filename: string): void {
  // BOM prefix for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
