/**
 * Fuzzy entity name matching for cross-tool recognition.
 *
 * When a worksheet is saved, this service checks whether an entity with
 * a similar name already exists in the same world. Surfaces candidates
 * via a dialog so the author can link or create separate.
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2 — Issue 2
 */

import { supabase } from "@/integrations/supabase/client";

export interface EntityMatchCandidate {
  id: string;
  title: string;
  entryType: string;
  layer: string | null;
  toolSource: string | null;
  score: number; // 0-1, higher = better match
}

/**
 * Normalize a name for comparison: lowercase, strip articles/prefixes,
 * collapse whitespace, remove common punctuation.
 */
export function normalizeEntityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(the|a|an|planet|star|system|world|empire|species)\s+/i, "")
    .replace(/[''""'"`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple Levenshtein distance.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Score how well two normalized names match. Returns 0-1 (1 = exact).
 */
function matchScore(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;

  const dist = levenshtein(a, b);
  // Allow up to 2 edits for short names, proportional for longer names
  const threshold = Math.max(2, Math.floor(maxLen * 0.25));
  if (dist > threshold) return 0;

  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Find existing world entries whose names fuzzy-match the given title.
 * Excludes the entry with `excludeEntryId` (the one we just created/updated).
 */
export async function findFuzzyNameMatches(
  worldId: string,
  title: string,
  excludeEntryId?: string
): Promise<EntityMatchCandidate[]> {
  const normalized = normalizeEntityName(title);
  if (!normalized || normalized.length < 2) return [];

  const { data: entries } = await supabase
    .from("world_entries")
    .select("id, title, entry_type, layer, tool_source")
    .eq("world_id", worldId);

  if (!entries || entries.length === 0) return [];

  const candidates: EntityMatchCandidate[] = [];

  for (const entry of entries) {
    if (excludeEntryId && entry.id === excludeEntryId) continue;
    if (!entry.title) continue;

    const entryNorm = normalizeEntityName(entry.title);
    const score = matchScore(normalized, entryNorm);

    if (score >= 0.7) {
      candidates.push({
        id: entry.id,
        title: entry.title,
        entryType: entry.entry_type ?? "custom",
        layer: entry.layer,
        toolSource: entry.tool_source,
        score,
      });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Link a worksheet to an existing world entry via the entity_worksheets
 * junction table. This enables dossier stacking — multiple tool data
 * profiles on a single wiki page.
 */
export async function linkWorksheetToEntry(
  worksheetId: string,
  entryId: string
): Promise<void> {
  const { error } = await supabase
    .from("entity_worksheets")
    .upsert(
      { worksheet_id: worksheetId, entity_id: entryId },
      { onConflict: "worksheet_id,entity_id" }
    );

  if (error) throw error;
}
