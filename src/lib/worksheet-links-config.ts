// Worksheet Links Configuration
// Defines which tools can link to which, and what fields to sync

export interface LinkedWorksheetRef {
  worksheetId: string;
  syncedAt: string; // ISO timestamp
  syncedData: Record<string, unknown>;
}

export interface LinkConfig {
  key: string; // Unique identifier for this link type within the tool
  targetTool: string; // Tool type to link to (e.g., "planetary-profile")
  label: string; // Display label (e.g., "Home Planet")
  syncFields: string[]; // Fields to sync from target worksheet
  description?: string; // Optional description for UI
}

// Configuration for each tool's available links
export const WORKSHEET_LINKS: Record<string, LinkConfig[]> = {
  "environmental-chain-reaction": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "stellarEnvironment.starType",
        "stellarEnvironment.tidalLocking",
        "physicalCharacteristics.surfaceGravity",
        "physicalCharacteristics.dayLength",
        "atmosphericComposition.primaryGases",
        "atmosphericComposition.atmosphericPressure",
        "temperatureProfile.averageSurfaceTemp",
        "hydrosphere.waterPresence",
      ],
      description: "Link to a planet to import environmental parameters",
    },
    {
      key: "evobio",
      targetTool: "evolutionary-biology",
      label: "Species Biology",
      syncFields: [
        "speciesName",
        "bodyPlan.symmetry",
        "bodyPlan.limbs",
        "bodyPlan.sizeRange",
        "sensory.primarySenses",
        "sensory.environmentalTuning",
        "locomotion.primaryMode",
        "metabolism.energySource",
        "reproduction.reproductionMode",
        "cognition.cognitionType",
        "psychology.emotionalRange",
        "social.socialStructure",
      ],
      description: "Link to evolutionary biology to import species adaptations",
    },
  ],
  "evolutionary-biology": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Home Planet",
      syncFields: [
        "title",
        "stellarEnvironment.starType",
        "stellarEnvironment.tidalLocking",
        "physicalCharacteristics.surfaceGravity",
        "physicalCharacteristics.dayLength",
        "physicalCharacteristics.axialTilt",
        "atmosphericComposition.primaryGases",
        "atmosphericComposition.secondaryGases",
        "atmosphericComposition.atmosphericPressure",
        "temperatureProfile.averageSurfaceTemp",
        "temperatureProfile.temperatureRange",
        "hydrosphere.waterPresence",
        "hydrosphere.oceanCoverage",
        "habitability.habitabilityTier",
        "habitability.requiredAdaptations",
      ],
      description: "Link to a planetary profile for environmental context",
    },
    {
      key: "ecr",
      targetTool: "environmental-chain-reaction",
      label: "Environment",
      syncFields: [
        "title",
        "parameter.selectedParameter",
        "level1.responses",
        "level2.responses",
        "level3.responses",
        "synthesis.logicalFlow",
      ],
      description: "Link to an environmental analysis for ecosystem data",
    },
    {
      key: "sensorium",
      targetTool: "sensorium",
      label: "Sensory System",
      syncFields: [
        "finalSelection",
        "perceptionProfile.dominantSense",
        "perceptionProfile.sensoryHierarchy",
        "environment.star.preset",
        "environment.medium.type",
      ],
      description: "Import derived sensory systems from SENSORIUM",
    },
  ],
  "xenomythology-framework-builder": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "title",
        "stellarEnvironment.starType",
        "physicalCharacteristics.dayLength",
        "physicalCharacteristics.surfaceGravity",
        "atmosphericComposition.primaryGases",
        "temperatureProfile.averageSurfaceTemp",
      ],
      description: "Link to a planetary profile for world context",
    },
    {
      key: "ecr",
      targetTool: "environmental-chain-reaction",
      label: "Environment",
      syncFields: [
        "title",
        "parameter.selectedParameter",
        "level3.responses",
        "level4.responses",
        "level5.responses",
      ],
      description: "Link to an environmental cascade analysis",
    },
    {
      key: "species",
      targetTool: "evolutionary-biology",
      label: "Species Biology",
      syncFields: [
        "speciesName",
        // Sensory Architecture
        "sensory.primarySenses",
        "sensory.environmentalTuning",
        // Physical Form
        "bodyPlan.symmetry",
        "bodyPlan.limbs",
        "bodyPlan.sizeRange",
        "bodyPlan.integument",
        // Reproduction
        "reproduction.reproductionMode",
        "reproduction.parentalCare",
        "reproduction.lifespan",
        "reproduction.lifeStages",
        // Cognitive Architecture
        "cognition.cognitionType",
        "cognition.memoryType",
        "cognition.learningMechanisms",
        "cognition.abstractThinking",
        // Psychology
        "psychology.emotionAnalogs",
        "psychology.motivationalDrives",
        "psychology.curiosityLevel",
        // Social/Cultural Seeds
        "social.socialStructure",
        "social.cooperationMechanisms",
        "social.hierarchyType",
        // Communication
        "communication.primaryChannel",
        "communication.secondaryChannels",
        "communication.culturalTransmission",
      ],
      description: "Link to a species design to import biological foundations",
    },
  ],
  "one-big-lie": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "stellarEnvironment.starType",
        "physicalCharacteristics.surfaceGravity",
        "atmosphericComposition.primaryGases",
      ],
      description: "Link to a planetary profile for world context",
    },
  ],
  "spacecraft-designer": [
    {
      key: "propulsion",
      targetTool: "propulsion-consequences-map",
      label: "Propulsion System",
      syncFields: ["propulsionType", "fuelType", "maxVelocity", "consequences"],
      description: "Link to a propulsion analysis for drive specifications",
    },
  ],
  "time-dilation": [
    {
      key: "propulsion",
      targetTool: "propulsion-consequences-map",
      label: "Propulsion Analysis",
      syncFields: ["propulsionType", "fuelType", "maxVelocity"],
      description: "Import propulsion type and max velocity",
    },
    {
      key: "spacecraft",
      targetTool: "spacecraft-designer",
      label: "Spacecraft",
      syncFields: ["title", "propulsion.type", "propulsion.maxSpeed"],
      description: "Import drive specifications from a spacecraft",
    },
  ],
  "habitable-zone-calculator": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "stellarEnvironment.starType",
        "stellarEnvironment.tidalLocking",
        "physicalCharacteristics.surfaceGravity",
        "atmosphericComposition.primaryGases",
        "temperatureProfile.averageSurfaceTemp",
      ],
      description: "Link to a planetary profile for world context",
    },
    {
      key: "star-system",
      targetTool: "star-system-builder",
      label: "Star System",
      syncFields: [
        "title",
        "star.spectralClass",
        "star.mass",
        "star.luminosity",
        "star.temperature",
      ],
      description: "Import stellar parameters from a star system",
    },
  ],
  "surface-gravity-calculator": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "physicalCharacteristics.surfaceGravity",
        "physicalCharacteristics.planetaryMass",
        "physicalCharacteristics.planetaryRadius",
        "temperatureProfile.averageSurfaceTemp",
      ],
      description: "Link to a planetary profile for world context",
    },
    {
      key: "star-system",
      targetTool: "star-system-builder",
      label: "Star System",
      syncFields: [
        "title",
        "star.mass",
        "star.luminosity",
      ],
      description: "Import stellar parameters from a star system",
    },
  ],
  "space-expansion-modeler": [
    {
      key: "one-big-lie",
      targetTool: "one-big-lie",
      label: "Axiom",
      syncFields: [
        "coreStatement.statement",
        "approach.type",
      ],
      description: "Import the One Big Lie that enables expansion",
    },
    {
      key: "propulsion",
      targetTool: "propulsion-consequences-map",
      label: "Propulsion Analysis",
      syncFields: [
        "propulsionType",
        "fuelType",
        "maxVelocity",
      ],
      description: "Import propulsion capabilities that set expansion limits",
    },
    {
      key: "tech",
      targetTool: "technology-consequences",
      label: "Technology Analysis",
      syncFields: [
        "technology.name",
        "technology.type",
      ],
      description: "Import technology context that shapes expansion forces",
    },
    {
      key: "empire",
      targetTool: "empire-designer",
      label: "Dominion",
      syncFields: [
        "foundation.name",
        "foundation.governmentType",
      ],
      description: "Import political structure driving expansion",
    },
  ],
  "timeline": [],
  "gravitas": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "stellarEnvironment.starType",
        "physicalCharacteristics.surfaceGravity",
        "physicalCharacteristics.planetaryMass",
        "physicalCharacteristics.planetaryRadius",
      ],
      description: "Import planetary parameters for orbital calculations",
    },
    {
      key: "spacecraft",
      targetTool: "spacecraft-designer",
      label: "Spacecraft",
      syncFields: [
        "title",
        "propulsion.type",
        "propulsion.maxSpeed",
      ],
      description: "Import spacecraft data for gravity subsystem design",
    },
    {
      key: "surfaceGravity",
      targetTool: "surface-gravity-calculator",
      label: "Surface Gravity",
      syncFields: [
        "primary.mass",
        "primary.radius",
        "primary.compositionPreset",
      ],
      description: "Import planetary mass/radius for comparison",
    },
  ],
  "sensorium": [
    {
      key: "starSystem",
      targetTool: "star-system-builder",
      label: "Star System",
      syncFields: [
        "star.spectralClass",
        "star.luminosity",
        "star.temperature",
        "star.variability",
      ],
      description: "Import stellar parameters for spectral class and radiation environment",
    },
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: [
        "stellarEnvironment.starType",
        "stellarEnvironment.tidalLocking",
        "atmosphericComposition.primaryGases",
        "atmosphericComposition.atmosphericPressure",
        "physicalCharacteristics.dayLength",
        "hydrosphere.waterPresence",
      ],
      description: "Import atmosphere, pressure, medium, and day cycle from a planet",
    },
    {
      key: "evoBio",
      targetTool: "evolutionary-biology",
      label: "Species Biology",
      syncFields: [
        "speciesName",
        "sensory.primarySenses",
        "sensory.environmentalTuning",
        "bodyPlan.symmetry",
        "foundations.primarySurvivalPressures",
      ],
      description: "Link to species for syncing sensory results downstream",
    },
  ],
};

// Helper to get link configuration for a tool
export function getLinkConfigsForTool(toolType: string): LinkConfig[] {
  return WORKSHEET_LINKS[toolType] || [];
}

// Helper to get a specific link configuration
export function getLinkConfig(
  toolType: string,
  linkKey: string
): LinkConfig | undefined {
  const configs = WORKSHEET_LINKS[toolType];
  return configs?.find((c) => c.key === linkKey);
}

// Helper to extract synced data from a worksheet based on sync fields
export function extractSyncedData(
  worksheetData: Record<string, unknown>,
  syncFields: string[]
): Record<string, unknown> {
  const syncedData: Record<string, unknown> = {};

  for (const field of syncFields) {
    // Handle nested fields like "biochemistry.biochemicalBasis"
    const parts = field.split(".");
    let value: unknown = worksheetData;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined) {
      // Store with the full path as key for clarity
      syncedData[field] = value;
    }
  }

  return syncedData;
}

// Tool display names for UI
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  "planetary-profile": "Genesis",
  "environmental-chain-reaction": "Cascade",
  "evolutionary-biology": "Phylo",
  "xenomythology-framework-builder": "Mythos",
  "spacecraft-designer": "Vessel",
  "propulsion-consequences-map": "Impulse",
  "drake-equation-calculator": "Signal",
  "star-system-builder": "Orrery",
  "empire-designer": "Dominion",
  "technology-consequences": "Paradigm",
  "species-interaction-matrix": "Symbiosis",
  "one-big-lie": "Axiom",
  "time-dilation": "Paradox",
  "space-expansion-modeler": "Exodus",
  "habitable-zone-calculator": "Goldilocks",
  "lexdrift": "Lexdrift",
  "surface-gravity-calculator": "Atlas",
  "timeline": "Timeline",
  "gravitas": "Gravitas",
  "sensorium": "Sensorium",
};

// Get display name for a tool type
export function getToolDisplayName(toolType: string): string {
  return TOOL_DISPLAY_NAMES[toolType] || toolType;
}
