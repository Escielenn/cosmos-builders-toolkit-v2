// ---------------------------------------------------------------------------
// world-settings, read and merge one key of worlds.settings (jsonb).
//
// worlds.settings (20261018_writing_p1.sql) holds writing-space preferences
// that belong to the world rather than to one user: the label set, saved
// collections, the project target. Each feature owns one key; a write merges
// that key and preserves every other one.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

export function asSettings(settings: unknown): Record<string, unknown> {
  return settings && typeof settings === "object" && !Array.isArray(settings)
    ? (settings as Record<string, unknown>)
    : {};
}

export function readSettingsKey(settings: unknown, key: string): unknown {
  return asSettings(settings)[key];
}

/** A copy of `settings` with `key` set to `value`; other keys untouched. */
export function writeSettingsKey(
  settings: unknown,
  key: string,
  value: unknown,
): Record<string, unknown> {
  return { ...asSettings(settings), [key]: value };
}
