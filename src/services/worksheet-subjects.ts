// ---------------------------------------------------------------------------
// worksheet-subjects, which world_entries row a worksheet is about.
//
// entity_worksheets already links a worksheet to one or more world_entries
// rows (a planet's Planetary Profile AND its Surface Gravity Calculator can
// both point at the same wiki page). This is the read side of that join:
// one entity id per worksheet, so extractWorksheetFacts can stamp every fact
// it produces with a subject_id.
//
// A worksheet with no link returns undefined for that id — still a valid
// state (see WorksheetFact.subject_id), just one checkContinuity can't scope.
//
// Pure data access. No mutation, no merge — see docs/stellarforge/
// 11-SIMULATOR-CONSTELLATION.md §0: identity here is id-only, never inferred.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";

export interface WorksheetSubject {
  entityId: string;
  /** The subject's world_entries title, for the ambiguity picker. */
  title: string;
  /** world_entries.entry_type, e.g. "planet" — for pluralizing the picker header. */
  entryType: string | null;
}

/**
 * The primary subject (world_entries id, title, type) for each worksheet.
 *
 * A worksheet can link to more than one entity via entity_worksheets;
 * `is_primary` picks the one a continuity check scopes to. When no link is
 * marked primary, the first one found wins — still deterministic, just not
 * writer-chosen. Worksheets with no link at all are simply absent from the
 * returned map.
 */
export async function getWorksheetSubjects(
  worksheetIds: string[],
): Promise<Record<string, WorksheetSubject>> {
  if (worksheetIds.length === 0) return {};

  const { data, error } = await supabase
    .from("entity_worksheets")
    .select("worksheet_id, is_primary, world_entries(id, title, entry_type)")
    .in("worksheet_id", worksheetIds);

  if (error || !data) return {};

  const best = new Map<string, { subject: WorksheetSubject; primary: boolean }>();
  for (const row of data) {
    const entry = row.world_entries as { id: string; title: string | null; entry_type: string | null } | null;
    if (!entry) continue;

    const existing = best.get(row.worksheet_id);
    if (existing && !(row.is_primary && !existing.primary)) continue;

    best.set(row.worksheet_id, {
      subject: { entityId: entry.id, title: entry.title || "Untitled", entryType: entry.entry_type },
      primary: !!row.is_primary,
    });
  }

  const result: Record<string, WorksheetSubject> = {};
  for (const [worksheetId, { subject }] of best) result[worksheetId] = subject;
  return result;
}
