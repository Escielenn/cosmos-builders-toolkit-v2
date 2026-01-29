import { useMemo } from "react";
import { useWorksheets } from "./use-worksheets";

export interface DrakeContext {
  hasData: boolean;
  nValue: number | null;
  interpretation: string | null;
  speciesCount: number;
  planetCount: number;
  suggestion: string;
}

/**
 * Calculate the Drake Equation N value from form values.
 */
function calculateN(values: Record<string, number>): number {
  const { rStar = 1, fp = 1, ne = 1, fl = 1, fi = 1, fc = 1, L = 1 } = values;
  return rStar * fp * ne * fl * fi * fc * L;
}

/**
 * Get interpretation label for N value.
 */
function getInterpretation(n: number): string {
  if (n < 1) return "Very Lonely";
  if (n < 10) return "Lonely";
  if (n < 100) return "Sparse";
  if (n < 1000) return "Moderate";
  if (n < 10000) return "Crowded";
  return "Teeming";
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
        suggestion: "Loading world data...",
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
      suggestion = "Start creating species to populate your world!";
    } else if (N > 100 && speciesWorksheets.length < 3) {
      suggestion = `Drake suggests a ${interpretation.toLowerCase()} galaxy (N=${Math.round(
        N
      )}). Consider creating more species diversity!`;
    } else if (N > 10 && speciesWorksheets.length < 2) {
      suggestion = `Drake suggests ${interpretation.toLowerCase()} civilization density. You have room for more unique species.`;
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
