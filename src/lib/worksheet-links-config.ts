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
  ],
  "evolutionary-biology": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Home Planet",
      syncFields: [
        "starType",
        "atmosphereType",
        "gravity",
        "dayLength",
        "orbitalPeriod",
        "temperature",
      ],
      description: "Link to a planetary profile for environmental context",
    },
    {
      key: "ecr",
      targetTool: "environmental-chain-reaction",
      label: "Environment",
      syncFields: [
        "primaryClimatePressures",
        "ecosystemComplexity",
        "initialChange",
        "cascadeEffects",
      ],
      description: "Link to an environmental analysis for ecosystem data",
    },
  ],
  "xenomythology-framework-builder": [
    {
      key: "planet",
      targetTool: "planetary-profile",
      label: "Planet",
      syncFields: ["starType", "atmosphereType", "dayLength", "gravity"],
      description: "Link to a planetary profile for world context",
    },
    {
      key: "ecr",
      targetTool: "environmental-chain-reaction",
      label: "Environment",
      syncFields: ["climate", "biomes", "hazards"],
      description: "Link to an environmental analysis",
    },
    {
      key: "species",
      targetTool: "evolutionary-biology",
      label: "Species Biology",
      syncFields: [
        "biochemistry.biochemicalBasis",
        "bodyPlan.symmetry",
        "sensory.primarySenses",
        "cognition.cognitionType",
        "social.socialStructure",
      ],
      description: "Link to a species design for biological foundation",
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
  "planetary-profile": "Planetary Profile",
  "environmental-chain-reaction": "Environmental Chain Reaction",
  "evolutionary-biology": "Evolutionary Biology",
  "xenomythology-framework-builder": "Xenomythology Framework",
  "spacecraft-designer": "Spacecraft Designer",
  "propulsion-consequences-map": "Propulsion Consequences Map",
  "drake-equation-calculator": "Drake Equation Calculator",
};

// Get display name for a tool type
export function getToolDisplayName(toolType: string): string {
  return TOOL_DISPLAY_NAMES[toolType] || toolType;
}
