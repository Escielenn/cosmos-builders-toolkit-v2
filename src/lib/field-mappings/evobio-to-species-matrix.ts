// Field mappings between Evolutionary Biology and Species Interaction Matrix

import type { MappedField } from "./evobio-to-xenomyth";

// Interface for Species in Species Interaction Matrix
export interface SpeciesMatrixSpecies {
  id: string;
  name: string;
  shortDescription: string;
  homeworld: string;
  physicalTraits: string;
  culturalTraits: string;
}

// Helper to get value from nested path
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let value: unknown = obj;

  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

// Format limbs array to readable string
function formatLimbs(
  limbs: Array<{ type: string; count: string; function: string }>
): string {
  if (!Array.isArray(limbs) || limbs.length === 0) return "";

  return limbs
    .map((l) => {
      if (l.count && l.type) {
        return `${l.count} ${l.type}${l.function ? ` (${l.function})` : ""}`;
      }
      return null;
    })
    .filter(Boolean)
    .join(", ");
}

// Format adaptations to readable string
function formatAdaptations(
  adaptations: Array<{ trait: string; selectivePressure: string }>
): string {
  if (!Array.isArray(adaptations) || adaptations.length === 0) return "";

  return adaptations
    .filter((a) => a.trait)
    .map((a) => a.trait)
    .slice(0, 3)
    .join(", ");
}

// Map EvoBio data to Species Matrix species
export function mapEvoBioToSpeciesMatrix(
  evoBioData: Record<string, unknown>,
  worksheetTitle?: string
): Partial<SpeciesMatrixSpecies> {
  const speciesName =
    (getNestedValue(evoBioData, "speciesName") as string) ||
    worksheetTitle ||
    "";

  // Build short description from key traits
  const cognitionType = getNestedValue(
    evoBioData,
    "cognition.cognitionType"
  ) as string;
  const socialStructure = getNestedValue(
    evoBioData,
    "social.socialStructure"
  ) as string;
  const symmetry = getNestedValue(evoBioData, "bodyPlan.symmetry") as string;

  const descParts: string[] = [];
  if (symmetry) descParts.push(symmetry.replace(/-/g, " "));
  if (cognitionType) descParts.push(cognitionType.replace(/-/g, " "));
  if (socialStructure) descParts.push(socialStructure.replace(/-/g, " "));

  const shortDescription = descParts.length > 0 ? descParts.join(", ") : "";

  // Build homeworld from adaptations environment or survival pressures
  const survivalPressures = getNestedValue(
    evoBioData,
    "foundations.primarySurvivalPressures"
  ) as string[];
  const extremophileInspiration = getNestedValue(
    evoBioData,
    "foundations.extremophileInspiration"
  ) as string;

  let homeworld = "";
  if (extremophileInspiration) {
    homeworld = extremophileInspiration.replace(/-/g, " ") + " world";
  } else if (Array.isArray(survivalPressures) && survivalPressures.length > 0) {
    homeworld = survivalPressures
      .slice(0, 2)
      .map((p) => p.replace(/-/g, " "))
      .join(", ");
  }

  // Build physical traits from body plan
  const physicalParts: string[] = [];

  const sizeRange = getNestedValue(evoBioData, "bodyPlan.sizeRange") as {
    min?: string;
    max?: string;
  };
  if (sizeRange?.min || sizeRange?.max) {
    if (sizeRange.min && sizeRange.max) {
      physicalParts.push(`Size: ${sizeRange.min}-${sizeRange.max}`);
    } else if (sizeRange.min) {
      physicalParts.push(`Size: ${sizeRange.min}+`);
    }
  }

  if (symmetry) {
    physicalParts.push(`${symmetry.replace(/-/g, " ")} symmetry`);
  }

  const limbs = getNestedValue(evoBioData, "bodyPlan.limbs") as Array<{
    type: string;
    count: string;
    function: string;
  }>;
  const limbStr = formatLimbs(limbs);
  if (limbStr) {
    physicalParts.push(limbStr);
  }

  const integument = getNestedValue(
    evoBioData,
    "bodyPlan.integument"
  ) as string;
  if (integument) {
    physicalParts.push(integument.replace(/-/g, " "));
  }

  const primarySenses = getNestedValue(
    evoBioData,
    "sensory.primarySenses"
  ) as string[];
  if (Array.isArray(primarySenses) && primarySenses.length > 0) {
    physicalParts.push(
      `Senses: ${primarySenses
        .slice(0, 3)
        .map((s) => s.replace(/-/g, " "))
        .join(", ")}`
    );
  }

  const physicalTraits = physicalParts.join(". ");

  // Build cultural traits from social and cognition
  const culturalParts: string[] = [];

  if (socialStructure) {
    culturalParts.push(`${socialStructure.replace(/-/g, " ")} society`);
  }

  if (cognitionType) {
    culturalParts.push(`${cognitionType.replace(/-/g, " ")} cognition`);
  }

  const cooperationMechanisms = getNestedValue(
    evoBioData,
    "social.cooperationMechanisms"
  ) as string[];
  if (
    Array.isArray(cooperationMechanisms) &&
    cooperationMechanisms.length > 0
  ) {
    culturalParts.push(
      `cooperation via ${cooperationMechanisms
        .slice(0, 2)
        .map((c) => c.replace(/-/g, " "))
        .join(", ")}`
    );
  }

  const emotionAnalogs = getNestedValue(
    evoBioData,
    "psychology.emotionAnalogs"
  ) as string[];
  if (Array.isArray(emotionAnalogs) && emotionAnalogs.length > 0) {
    culturalParts.push(
      `emotions: ${emotionAnalogs
        .slice(0, 3)
        .map((e) => e.replace(/-/g, " "))
        .join(", ")}`
    );
  }

  const culturalTraits = culturalParts.join(". ");

  return {
    name: speciesName,
    shortDescription,
    homeworld,
    physicalTraits,
    culturalTraits,
  };
}

// Mapping fields for preview UI
export interface EvoBioToMatrixMapping {
  label: string;
  targetField: keyof SpeciesMatrixSpecies;
  getValue: (evoBioData: Record<string, unknown>) => string;
}

export const EVOBIO_TO_MATRIX_PREVIEW_FIELDS: EvoBioToMatrixMapping[] = [
  {
    label: "Species Name",
    targetField: "name",
    getValue: (data) => (getNestedValue(data, "speciesName") as string) || "",
  },
  {
    label: "Short Description",
    targetField: "shortDescription",
    getValue: (data) => {
      const result = mapEvoBioToSpeciesMatrix(data);
      return result.shortDescription || "";
    },
  },
  {
    label: "Homeworld",
    targetField: "homeworld",
    getValue: (data) => {
      const result = mapEvoBioToSpeciesMatrix(data);
      return result.homeworld || "";
    },
  },
  {
    label: "Physical Traits",
    targetField: "physicalTraits",
    getValue: (data) => {
      const result = mapEvoBioToSpeciesMatrix(data);
      return result.physicalTraits || "";
    },
  },
  {
    label: "Cultural Traits",
    targetField: "culturalTraits",
    getValue: (data) => {
      const result = mapEvoBioToSpeciesMatrix(data);
      return result.culturalTraits || "";
    },
  },
];

// Map Species Matrix species back to EvoBio (partial, for starting point)
export function mapSpeciesMatrixToEvoBio(
  species: SpeciesMatrixSpecies
): Record<string, unknown> {
  return {
    speciesName: species.name || "",
    bodyPlan: {
      bodyPlanNotes: species.physicalTraits || "",
    },
    social: {
      socialNotes: species.culturalTraits || "",
    },
    foundations: {
      survivalPressuresNotes: species.homeworld
        ? `Homeworld: ${species.homeworld}`
        : "",
    },
  };
}
