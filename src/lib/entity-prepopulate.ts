import { ENTITY_MASTER_FIELDS } from "./entity-config";

/**
 * Given entity metadata and a target tool type, produces a partial worksheet
 * data object pre-populated from master fields.
 *
 * Uses the `worksheetPaths` mapping in ENTITY_MASTER_FIELDS to know which
 * master field maps to which worksheet data path.
 */
export function prepopulateWorksheetData(
  entityMetadata: Record<string, unknown>,
  entityType: string,
  toolType: string
): Record<string, unknown> {
  const fields = ENTITY_MASTER_FIELDS[entityType];
  if (!fields) return {};

  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const path = field.worksheetPaths?.[toolType];
    if (!path) continue;

    const value = entityMetadata[field.key];
    if (value === undefined || value === null || value === "") continue;

    setNestedValue(result, path, value);
  }

  return result;
}

/**
 * Sets a value at a dot-notation path in an object, creating intermediate
 * objects as needed.
 *
 * Example: setNestedValue({}, "stellarEnvironment.starType", "G2V")
 * → { stellarEnvironment: { starType: "G2V" } }
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Gets a value at a dot-notation path from an object.
 * Returns undefined if the path doesn't exist.
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
