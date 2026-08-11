import { TOOL_TYPE_MAP, ENTITY_TYPE_LABELS, ENTITY_TYPE_ICONS } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Creatable entity types (user-facing, excludes output-only/system types)
// ---------------------------------------------------------------------------

export const CREATABLE_ENTITY_TYPES = [
  "planet",
  "star_system",
  "species",
  "faction",
  "character",
  "technology",
  "location",
  "artifact",
  "vessel",
  "language",
  "mythology",
  "custom",
] as const;

export type CreatableEntityType = (typeof CREATABLE_ENTITY_TYPES)[number];

// ---------------------------------------------------------------------------
// Reverse lookup: entity type → tool slugs
// ---------------------------------------------------------------------------

function buildEntityTypeToTools(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [toolSlug, entityType] of Object.entries(TOOL_TYPE_MAP)) {
    if (!map[entityType]) map[entityType] = [];
    map[entityType].push(toolSlug);
  }
  return map;
}

/** Maps entity types to the tool slugs that produce that type */
export const ENTITY_TYPE_TO_TOOLS = buildEntityTypeToTools();

// Additional tools relevant to an entity type even if they don't directly
// produce that type (e.g. a planet also benefits from habitable-zone-calculator)
const EXTRA_TOOLS: Partial<Record<string, string[]>> = {
  planet: ["habitable-zone-calculator", "surface-gravity-calculator"],
  species: ["sensorium", "species-interaction-matrix"],
  vessel: ["propulsion-consequences-map", "gravitas"],
  faction: ["space-expansion-modeler"],
  star_system: ["habitable-zone-calculator"],
};

/** All relevant tools for an entity type (primary + extra) */
export function getToolsForEntityType(entityType: string): string[] {
  const primary = ENTITY_TYPE_TO_TOOLS[entityType] ?? [];
  const extra = EXTRA_TOOLS[entityType] ?? [];
  // Deduplicate
  return [...new Set([...primary, ...extra])];
}

// ---------------------------------------------------------------------------
// Master field definitions per entity type
// ---------------------------------------------------------------------------

export interface MasterFieldDef {
  /** Display label */
  label: string;
  /** Field key in entity metadata */
  key: string;
  /** Field type */
  type: "text" | "number" | "select";
  /** Options for select type */
  options?: string[];
  /**
   * Paths into worksheet data for bidirectional sync.
   * Maps tool slug → dot-notation path into worksheet data JSON.
   */
  worksheetPaths?: Record<string, string>;
}

/** Generic fields shared by all creatable entity types */
const GENERIC_FIELDS: MasterFieldDef[] = [
  { label: "Name", key: "name", type: "text" },
  { label: "Description", key: "description", type: "text" },
];

/**
 * Per-type master fields that appear in the entity infobox and
 * can sync bidirectionally with worksheets.
 */
export const ENTITY_MASTER_FIELDS: Record<string, MasterFieldDef[]> = {
  planet: [
    ...GENERIC_FIELDS,
    {
      label: "Star Type",
      key: "starType",
      type: "text",
      worksheetPaths: {
        "planetary-profile": "stellarEnvironment.starType",
        "habitable-zone-calculator": "star.spectralType",
      },
    },
    {
      label: "Mass (Earth masses)",
      key: "mass",
      type: "number",
      worksheetPaths: {
        "planetary-profile": "physicalCharacteristics.planetaryMass",
        "surface-gravity-calculator": "primary.mass",
      },
    },
    {
      label: "Radius (Earth radii)",
      key: "radius",
      type: "number",
      worksheetPaths: {
        "planetary-profile": "physicalCharacteristics.planetaryRadius",
        "surface-gravity-calculator": "primary.radius",
      },
    },
    {
      label: "Surface Gravity (g)",
      key: "surfaceGravity",
      type: "number",
      // Note: surface-gravity-calculator computes gravity from mass/radius at
      // render time and never persists it, so there is no path to map here.
      worksheetPaths: { "planetary-profile": "physicalCharacteristics.surfaceGravity" },
    },
    {
      label: "Orbital Distance (AU)",
      key: "orbitalDistance",
      type: "number",
      worksheetPaths: { "habitable-zone-calculator": "planet.orbitalDistance" },
    },
    {
      label: "Stellar Luminosity (Sol)",
      key: "stellarLuminosity",
      type: "number",
      worksheetPaths: { "habitable-zone-calculator": "star.luminosity" },
    },
    {
      label: "Composition",
      key: "composition",
      type: "text",
      worksheetPaths: { "surface-gravity-calculator": "primary.compositionPreset" },
    },
    {
      label: "Surface Temperature (K)",
      key: "surfaceTemperature",
      type: "number",
      worksheetPaths: { "surface-gravity-calculator": "advanced.surfaceTemp" },
    },
    // Day length and axial tilt are plain inputs on the Planetary Profile
    // (physicalCharacteristics.dayLength / .axialTilt) that were never mapped,
    // so nothing could read them. The continuity check for day length depends
    // on this mapping existing.
    {
      label: "Day Length (hours)",
      key: "dayLength",
      type: "number",
      worksheetPaths: { "planetary-profile": "physicalCharacteristics.dayLength" },
    },
    {
      label: "Axial Tilt (degrees)",
      key: "axialTilt",
      type: "number",
      worksheetPaths: { "planetary-profile": "physicalCharacteristics.axialTilt" },
    },
  ],

  star_system: [
    ...GENERIC_FIELDS,
    {
      label: "System Name",
      key: "systemName",
      type: "text",
      worksheetPaths: { "star-system-builder": "systemName" },
    },
    {
      label: "Primary Star Class",
      key: "primaryStarClass",
      type: "text",
      worksheetPaths: { "star-system-builder": "primaryStar.spectralClass" },
    },
    {
      label: "Configuration",
      key: "configuration",
      type: "select",
      options: ["single", "binary", "trinary"],
      worksheetPaths: { "star-system-builder": "configuration.type" },
    },
  ],

  species: [
    ...GENERIC_FIELDS,
    {
      label: "Species Name",
      key: "speciesName",
      type: "text",
      worksheetPaths: { "evolutionary-biology": "speciesName" },
    },
    {
      label: "Body Plan",
      key: "bodyPlan",
      type: "text",
      worksheetPaths: { "evolutionary-biology": "bodyPlan.symmetry" },
    },
    {
      label: "Biochemical Basis",
      key: "biochemicalBasis",
      type: "text",
      worksheetPaths: { "evolutionary-biology": "biochemistry.biochemicalBasis" },
    },
    {
      label: "Cognition Type",
      key: "cognitionType",
      type: "text",
      worksheetPaths: { "evolutionary-biology": "cognition.cognitionType" },
    },
    {
      label: "Interaction Equilibrium",
      key: "interactionEquilibrium",
      type: "select",
      options: [
        "stable-harmony",
        "stable-tension",
        "unstable-improving",
        "unstable-declining",
        "volatile",
        "powder-keg",
      ],
      worksheetPaths: { "species-interaction-matrix": "overallEquilibrium" },
    },
    {
      label: "Interaction Trajectory",
      key: "interactionTrajectory",
      type: "select",
      options: [
        "integration",
        "coexistence",
        "separation",
        "conflict",
        "extinction",
        "transcendence",
      ],
      worksheetPaths: { "species-interaction-matrix": "overallTrajectory" },
    },
    {
      label: "Central Conflict",
      key: "centralConflict",
      type: "text",
      worksheetPaths: { "species-interaction-matrix": "centralConflict" },
    },
  ],

  faction: [
    ...GENERIC_FIELDS,
    {
      label: "Government Type",
      key: "governmentType",
      type: "text",
      worksheetPaths: { "empire-designer": "foundation.governmentType" },
    },
    {
      label: "Territory Scale",
      key: "territory",
      type: "text",
      worksheetPaths: { "empire-designer": "territory.scale" },
    },
    {
      label: "Population",
      key: "population",
      type: "text",
      worksheetPaths: { "empire-designer": "territory.population" },
    },
    {
      label: "Energy Output (Watts)",
      key: "energyOutput",
      type: "number",
      worksheetPaths: { "kardashev-scale": "totalPowerWatts" },
    },
    {
      label: "Energy Growth Rate",
      key: "energyGrowthRate",
      type: "select",
      options: ["conservative", "moderate", "aggressive", "exponential"],
      worksheetPaths: { "kardashev-scale": "growthRate" },
    },
    {
      label: "Civilization Longevity (years)",
      key: "civilizationLongevity",
      type: "number",
      worksheetPaths: { "drake-equation-calculator": "values.L" },
    },
  ],

  vessel: [
    ...GENERIC_FIELDS,
    {
      label: "Vessel Class",
      key: "vesselClass",
      type: "text",
      worksheetPaths: { "spacecraft-designer": "identity.class" },
    },
    {
      label: "Propulsion Type",
      key: "propulsionType",
      type: "text",
      worksheetPaths: {
        "spacecraft-designer": "propulsion.driveType",
        "time-dilation": "propulsion.method",
      },
    },
    {
      label: "Crew Size",
      key: "crewSize",
      type: "text",
      worksheetPaths: { "spacecraft-designer": "living.crewQuarters" },
    },
    {
      label: "Origin",
      key: "origin",
      type: "text",
      worksheetPaths: { "time-dilation": "journey.originName" },
    },
    {
      label: "Destination",
      key: "destination",
      type: "text",
      worksheetPaths: { "time-dilation": "journey.destinationName" },
    },
    {
      label: "Cruise Velocity (fraction of c)",
      key: "cruiseVelocity",
      type: "text",
      worksheetPaths: { "time-dilation": "velocityProfile.velocityFraction" },
    },
  ],

  technology: [
    ...GENERIC_FIELDS,
    {
      label: "Technology Name",
      key: "technologyName",
      type: "text",
      worksheetPaths: { "technology-consequences": "technologyName" },
    },
    {
      label: "Category",
      key: "technologyCategory",
      type: "text",
      worksheetPaths: { "technology-consequences": "technologyCategory" },
    },
    {
      label: "Maturity Level",
      key: "maturityLevel",
      type: "text",
      worksheetPaths: { "technology-consequences": "maturityLevel" },
    },
  ],

  mythology: [
    ...GENERIC_FIELDS,
    {
      label: "Body Plan",
      key: "bodyPlan",
      type: "text",
      worksheetPaths: { "xenomythology-framework-builder": "physicalForm.bodyPlan" },
    },
    {
      label: "Consciousness Type",
      key: "consciousnessType",
      type: "text",
      worksheetPaths: { "xenomythology-framework-builder": "cognitiveArchitecture.consciousnessType" },
    },
  ],

  language: [
    ...GENERIC_FIELDS,
  ],

  character: [...GENERIC_FIELDS],
  location: [...GENERIC_FIELDS],
  artifact: [...GENERIC_FIELDS],
  custom: [...GENERIC_FIELDS],
};

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { ENTITY_TYPE_LABELS, ENTITY_TYPE_ICONS };
