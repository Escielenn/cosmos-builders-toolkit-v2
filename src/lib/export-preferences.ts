/**
 * Export preferences persistence via localStorage.
 * Remembers the user's last-used export format and filename options
 * so the ExportDialog opens with their preferred defaults.
 */

import type { ExportFormat } from "@/components/tools/ExportDialog";

const STORAGE_KEY = "stellarforge-export-preferences";

export interface ExportPreferences {
  lastUsedFormat: ExportFormat;
  includeWorldName: boolean;
  includeDate: boolean;
}

const DEFAULTS: ExportPreferences = {
  lastUsedFormat: "pdf-summary",
  includeWorldName: true,
  includeDate: true,
};

export function getExportPreferences(): ExportPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULTS;
    const parsed = JSON.parse(stored) as Partial<ExportPreferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function saveExportPreferences(
  prefs: Partial<ExportPreferences>
): void {
  try {
    const current = getExportPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail, localStorage may be unavailable
  }
}
