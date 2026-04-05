// ---------------------------------------------------------------------------
// Push-to-Worksheet: sync sensorium insights to linked worksheets
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import type { SensoriumFormState } from "./types";
import { calculateMetabolicBudget, calculatePerceptionGaps } from "./calculations";
import { MODALITIES } from "./data";

export interface SensoriumInsights {
  speciesName: string;
  selectedModalities: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  metabolicBudget: {
    total: number;
    overBudget: boolean;
  };
  perceptionGaps: {
    speciesPerceives: string[];
    speciesBlind: string[];
  };
  dominantSense: string;
  syncedAt: string;
}

function buildInsights(formState: SensoriumFormState): SensoriumInsights {
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
      speciesPerceives: gaps.speciesPerceives.map((s) => s.name),
      speciesBlind: gaps.speciesBlind.map((s) => s.name),
    },
    dominantSense: formState.perceptionProfile.dominantSense || modalities[0]?.name || "",
    syncedAt: new Date().toISOString(),
  };
}

export async function pushSensoriumToWorksheets(
  formState: SensoriumFormState
): Promise<{ updated: string[]; errors: string[] }> {
  const linked = formState._linkedWorksheets;
  if (!linked) return { updated: [], errors: [] };

  const insights = buildInsights(formState);
  const updated: string[] = [];
  const errors: string[] = [];

  const worksheetIds: Array<{ key: string; id: string }> = [];
  if (linked.starSystem?.worksheetId) worksheetIds.push({ key: "Star System", id: linked.starSystem.worksheetId });
  if (linked.planet?.worksheetId) worksheetIds.push({ key: "Planet", id: linked.planet.worksheetId });
  if (linked.evoBio?.worksheetId) worksheetIds.push({ key: "Evolutionary Biology", id: linked.evoBio.worksheetId });

  for (const { key, id } of worksheetIds) {
    try {
      // Fetch current worksheet data
      const { data: ws, error: fetchErr } = await supabase
        .from("worksheets")
        .select("data")
        .eq("id", id)
        .single();

      if (fetchErr) {
        errors.push(`${key}: ${fetchErr.message}`);
        continue;
      }

      // Merge sensorium insights into the worksheet data
      const currentData = (ws?.data as Record<string, unknown>) ?? {};
      const mergedData = {
        ...currentData,
        sensoriumInsights: insights,
      };

      const { error: updateErr } = await supabase
        .from("worksheets")
        .update({ data: mergedData })
        .eq("id", id);

      if (updateErr) {
        errors.push(`${key}: ${updateErr.message}`);
      } else {
        updated.push(key);
      }
    } catch (err) {
      errors.push(`${key}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return { updated, errors };
}
