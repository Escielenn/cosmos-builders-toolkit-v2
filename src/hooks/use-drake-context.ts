import { useMemo } from "react";
import { useWorksheets } from "./use-worksheets";
import { calculateDrakeN, getDrakeInterpretation } from "@/lib/drake";

export interface DrakeContext {
  hasData: boolean;
  nValue: number | null;
  interpretation: string | null;
  speciesCount: number;
  planetCount: number;
  suggestion: string;
}

/** Missing factors count as 1 here, as they always have for this hook. */
function calculateN(values: Record<string, number>): number {
  return calculateDrakeN(values, { missingAs: 1 });
}

function getInterpretation(n: number): string {
  return getDrakeInterpretation(n).label;
}

/**
 * Hook to get Drake Equation context for a world.
 *
 * Returns the N value (if a Drake worksheet exists), the number of species
 * designed, and suggestions for species diversity based on Drake results.
 */
export function useDrakeContext(worldId: string | undefined): DrakeContext {
  const { worksheets } = useWorksheets(worldId);

  return useMemo(() => {
    if (!worksheets) {
      return {
        hasData: false,
        nValue: null,
        interpretation: null,
        speciesCount: 0,
        planetCount: 0,
        suggestion: "Loading world data.",
      };
    }

    const drakeWorksheet = worksheets.find(
      (w) => w.tool_type === "drake-equation-calculator"
    );
    const speciesWorksheets = worksheets.filter(
      (w) => w.tool_type === "evolutionary-biology"
    );
    const planetWorksheets = worksheets.filter(
      (w) => w.tool_type === "planetary-profile"
    );

    if (!drakeWorksheet) {
      return {
        hasData: false,
        nValue: null,
        interpretation: null,
        speciesCount: speciesWorksheets.length,
        planetCount: planetWorksheets.length,
        suggestion:
          "Create a Drake Equation worksheet to get galactic context.",
      };
    }

    const data = drakeWorksheet.data as Record<string, unknown>;
    const values = data?.values as Record<string, number> | undefined;

    if (!values) {
      return {
        hasData: true,
        nValue: null,
        interpretation: null,
        speciesCount: speciesWorksheets.length,
        planetCount: planetWorksheets.length,
        suggestion: "Fill in the Drake Equation values to see results.",
      };
    }

    const N = calculateN(values);
    const interpretation = getInterpretation(N);

    let suggestion = "";
    if (speciesWorksheets.length === 0) {
      suggestion = "No species on file. Begin survey when ready.";
    } else if (N > 100 && speciesWorksheets.length < 3) {
      suggestion = `Drake indicates a ${interpretation.toLowerCase()} galaxy (N=${Math.round(
        N
      )}). Species diversity low. Consider additional surveys.`;
    } else if (N > 10 && speciesWorksheets.length < 2) {
      suggestion = `Drake indicates ${interpretation.toLowerCase()} civilization density. Capacity exists for additional species.`;
    } else if (speciesWorksheets.length > 0) {
      suggestion = `${speciesWorksheets.length} species designed for a ${interpretation.toLowerCase()} galaxy.`;
    }

    return {
      hasData: true,
      nValue: N,
      interpretation,
      speciesCount: speciesWorksheets.length,
      planetCount: planetWorksheets.length,
      suggestion,
    };
  }, [worksheets]);
}
