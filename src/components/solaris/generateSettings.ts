/**
 * generateSettings, the shape of the generation panel's state.
 *
 * Separate from the panel component so both it and the page can import the type
 * and the default without tripping the fast-refresh rule, which requires a
 * component file to export only components.
 */

import type { GenerateConditions } from "./generator";

export type Arch = "auto" | "single" | "binary" | "trinary" | "quaternary";
export type StarClassChoice = "auto" | "blue" | "white" | "yellow" | "orange" | "red";

export interface GenerateSettings {
  seed: string;
  arch: Arch;
  starClass: StarClassChoice;
  /** null = let the generator choose (its own 4 to 8 range). */
  planetCount: number | null;
  /** null = let the generator choose. */
  includeBelt: boolean | null;
  conditions: GenerateConditions;
}

export const DEFAULT_GENERATE_SETTINGS: GenerateSettings = {
  seed: "sol",
  arch: "auto",
  starClass: "auto",
  planetCount: null,
  includeBelt: null,
  conditions: {},
};

/** Panel state to the generator's option shape. */
export function toGenerateOptions(g: GenerateSettings) {
  return {
    seed: g.seed.trim() || "sol",
    architecture: g.arch === "auto" ? undefined : g.arch,
    starBucket: g.starClass === "auto" ? undefined : g.starClass,
    planetCount: g.planetCount ?? undefined,
    includeBelt: g.includeBelt ?? undefined,
    conditions: g.conditions,
  };
}
