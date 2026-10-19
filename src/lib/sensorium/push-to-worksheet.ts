// ---------------------------------------------------------------------------
// Sensorium insights: recorded on Sensorium's own worksheet record.
//
// This used to merge a `sensoriumInsights` key into the data of OTHER tools'
// worksheets (the linked star system, planet and evo-bio worksheets). A tool
// writing into another tool's record is parallel truth: the other tool's next
// save could drop it, and nothing in that tool knew where it came from. The
// insights now live on the Sensorium record and name the worksheets they
// inform. readSensoriumInsights() still understands the old location so
// insights written before this change keep showing.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { SensoriumFormState, SensoriumInsights } from "./types";
import { calculateMetabolicBudget, calculatePerceptionGaps } from "./calculations";
import { MODALITIES } from "./data";

export type { SensoriumInsights } from "./types";

export function buildSensoriumInsights(formState: SensoriumFormState): SensoriumInsights {
  const selection = formState.finalSelection.length > 0
    ? formState.finalSelection
    : formState.selectedModalities;

  const budget = calculateMetabolicBudget(selection);
  const gaps = calculatePerceptionGaps(selection);

  const modalities = selection.map((id) => {
    const m = MODALITIES.find((mod) => mod.id === id);
    return {
      id,
      name: m?.name ?? id,
      category: m?.category ?? "unknown",
    };
  });

  return {
    speciesName: formState.speciesName || "Unnamed Species",
    selectedModalities: modalities,
    metabolicBudget: {
      total: budget.totalCost,
      overBudget: budget.totalCost > 1.0,
    },
    perceptionGaps: {
      // calculatePerceptionGaps already returns modality names. (This used to
      // map `.name` over those strings, which pushed arrays of undefined.)
      speciesPerceives: gaps.speciesPerceives,
      speciesBlind: gaps.speciesBlind,
    },
    dominantSense: formState.perceptionProfile.dominantSense || modalities[0]?.name || "",
    informs: linkedWorksheetIds(formState).map((w) => w.id),
    syncedAt: new Date().toISOString(),
  };
}

function linkedWorksheetIds(formState: SensoriumFormState): Array<{ key: string; id: string }> {
  const linked = formState._linkedWorksheets;
  const out: Array<{ key: string; id: string }> = [];
  if (linked?.starSystem?.worksheetId) out.push({ key: "Star System", id: linked.starSystem.worksheetId });
  if (linked?.planet?.worksheetId) out.push({ key: "Planet", id: linked.planet.worksheetId });
  if (linked?.evoBio?.worksheetId) out.push({ key: "Evolutionary Biology", id: linked.evoBio.worksheetId });
  return out;
}

/**
 * Record Sensorium's insights on Sensorium's own worksheet. Only the
 * `sensoriumInsights` key of that record is written; no other worksheet is
 * touched. Returns the insights (so the page can keep them in form state and
 * a later save does not drop them) and the names of the linked worksheets
 * they inform.
 */
export async function recordSensoriumInsights(
  formState: SensoriumFormState,
  sensoriumWorksheetId: string
): Promise<{ insights: SensoriumInsights; informs: string[] }> {
  const insights = buildSensoriumInsights(formState);

  const { data: ws, error: fetchErr } = await supabase
    .from("worksheets")
    .select("data")
    .eq("id", sensoriumWorksheetId)
    .single();
  if (fetchErr) throw fetchErr;

  const currentData = (ws?.data as Record<string, unknown>) ?? {};
  const { error: updateErr } = await supabase
    .from("worksheets")
    .update({ data: { ...currentData, sensoriumInsights: insights } as unknown as Json })
    .eq("id", sensoriumWorksheetId);
  if (updateErr) throw updateErr;

  return { insights, informs: linkedWorksheetIds(formState).map((w) => w.key) };
}

/**
 * Read Sensorium insights for display. Prefers the Sensorium record (the
 * current location); falls back to the legacy `sensoriumInsights` key that
 * older versions merged into a linked worksheet's data, so existing data
 * still shows.
 */
export function readSensoriumInsights(
  sensoriumData: Record<string, unknown> | null | undefined,
  legacyLinkedWorksheetData?: Record<string, unknown> | null
): SensoriumInsights | null {
  const own = sensoriumData?.sensoriumInsights;
  if (own && typeof own === "object") return own as SensoriumInsights;
  const legacy = legacyLinkedWorksheetData?.sensoriumInsights;
  if (legacy && typeof legacy === "object") return legacy as SensoriumInsights;
  return null;
}
