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
      worksheetPaths: {
        "evolutionary-biology": "speciesName",
        sensorium: "speciesName",
      },
    },
    // Sensorium's narrative fields. These are typed by the writer rather than
    // derived by the algorithm, which is what makes them worth surfacing: a
    // species' dominant sense and its blind spot are the two things prose
    // contradicts most easily, and until now neither reached the writing
    // surface at all. The derived modality list is deliberately left out; it
    // persists as an array of ids ("infrared-vision") that would read as
    // machine output in a panel meant for the writer's own words.
    {
      label: "Dominant Sense",
      key: "dominantSense",
      type: "text",
      worksheetPaths: { sensorium: "perceptionProfile.dominantSense" },
    },
    {
      label: "What It Perceives",
      key: "sensoryRange",
      type: "text",
      worksheetPaths: { sensorium: "perceptionGapNotes.speciesPerceives" },
    },
    {
      label: "What It Cannot Perceive",
      key: "sensoryBlindSpot",
      type: "text",
      worksheetPaths: { sensorium: "perceptionGapNotes.speciesBlind" },
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
    // ── Space Expansion Modeler ──
    // Listed in EXTRA_TOOLS.faction with nothing behind it, so an entire model
    // of how a civilisation spread reached nothing. The synthesis fields are
    // where the writer states what the expansion means, which is the part prose
    // draws on rather than the phase tables.
    {
      label: "Expansion Name",
      key: "expansionName",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "foundation.expansionName" },
    },
    {
      label: "Origin Civilization",
      key: "originCivilization",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "foundation.originCivilization" },
    },
    {
      label: "Expansion Began",
      key: "expansionStartYear",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "foundation.startYear" },
    },
    {
      label: "Dominant Force",
      key: "dominantForce",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "synthesis.dominantForce" },
    },
    {
      label: "Expansion Trajectory",
      key: "expansionTrajectory",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "synthesis.overallTrajectory" },
    },
    {
      label: "Biggest Tension",
      key: "biggestTension",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "synthesis.biggestTensionPoint" },
    },
    {
      label: "Narrative Theme",
      key: "narrativeTheme",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "synthesis.narrativeTheme" },
    },
    {
      label: "Story Hooks",
      key: "storyHooks",
      type: "text",
      worksheetPaths: { "space-expansion-modeler": "synthesis.storyHooks" },
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
        "propulsion-consequences-map": "system.type",
      },
    },
    {
      label: "Crew Size",
      key: "crewSize",
      type: "text",
      worksheetPaths: {
        "spacecraft-designer": "living.crewQuarters",
        "propulsion-consequences-map": "costs.crewCapacity",
      },
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
      // Deliberately not mapped to propulsion-consequences-map's
      // system.maxVelocity: that field is free text in whatever unit the writer
      // chose, and feeding it to a field labelled "fraction of c" would hand the
      // continuity engine a number in the wrong unit. It gets its own field below.
      worksheetPaths: { "time-dilation": "velocityProfile.velocityFraction" },
    },
    // ── Propulsion Consequences Map ──
    // EXTRA_TOOLS already listed this tool against vessels, but no field paths
    // existed, so everything a writer entered here was invisible to the writing
    // surface. Travel times are the most quotable numbers in the whole tool.
    {
      label: "Top Speed",
      key: "topSpeed",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "system.maxVelocity" },
    },
    {
      label: "Acceleration",
      key: "acceleration",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "system.acceleration" },
    },
    {
      label: "Energy Source",
      key: "energySource",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "system.energySource" },
    },
    {
      label: "Earth to Mars",
      key: "travelEarthMars",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "benchmarks.earthMars" },
    },
    {
      label: "Earth to Jupiter",
      key: "travelEarthJupiter",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "benchmarks.earthJupiter" },
    },
    {
      label: "Sol to Alpha Centauri",
      key: "travelSolAlphaCentauri",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "benchmarks.solAlphaCentauri" },
    },
    {
      label: "Cargo Capacity",
      key: "cargoCapacity",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "costs.cargoCapacity" },
    },
    {
      label: "Service Life",
      key: "serviceLife",
      type: "text",
      worksheetPaths: { "propulsion-consequences-map": "costs.serviceLife" },
    },
    // ── Gravitas ──
    // Also already listed in EXTRA_TOOLS.vessel with no paths behind it. How a
    // ship makes its gravity decides what standing up feels like on every deck,
    // which is a thing prose has to stay consistent about.
    {
      label: "Gravity Method",
      key: "gravityMethod",
      type: "text",
      worksheetPaths: { gravitas: "activeMode" },
    },
    {
      label: "Spin Radius (m)",
      key: "spinRadius",
      type: "number",
      worksheetPaths: { gravitas: "spin.radius_m" },
    },
    {
      label: "Rotation (rpm)",
      key: "rotationRpm",
      type: "number",
      worksheetPaths: { gravitas: "spin.rotation_rpm" },
    },
    {
      label: "Thrust Acceleration (g)",
      key: "thrustAcceleration",
      type: "number",
      worksheetPaths: { gravitas: "thrust.acceleration_g" },
    },
    {
      label: "Target Gravity (g)",
      key: "targetGravity",
      type: "number",
      worksheetPaths: { gravitas: "artificial.desired_g" },
    },
    {
      label: "Gravity Failure Mode",
      key: "gravityFailureMode",
      type: "text",
      worksheetPaths: { gravitas: "artificial.failure_mode" },
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
    // ── One Big Lie ──
    // The premise a whole world rests on, and it was invisible to the writing
    // surface. Filed under technology because the conceit is nearly always a
    // physical or technological one: FTL, artificial gravity, a mind that reads
    // another. Nothing else a writer records matters more than this sentence.
    {
      label: "The One Big Lie",
      key: "theOneBigLie",
      type: "text",
      // Two tools record the same premise, which is exactly what a field with
      // several paths is for: whichever one the writer filled in, the premise
      // reaches their prose, and entity-sync keeps the two in step.
      worksheetPaths: {
        "one-big-lie": "coreStatement.statement",
        "space-expansion-modeler": "foundation.oneBigLie",
      },
    },
    {
      label: "Science It Breaks",
      key: "scienceBroken",
      type: "text",
      worksheetPaths: { "one-big-lie": "coreStatement.scienceBroken" },
    },
    {
      label: "What Becomes Possible",
      key: "becomesPossible",
      type: "text",
      worksheetPaths: { "one-big-lie": "justification.whatBecomesPossible" },
    },
    {
      label: "What Becomes Impossible",
      key: "becomesImpossible",
      type: "text",
      worksheetPaths: { "one-big-lie": "justification.whatBecomesImpossible" },
    },
    {
      label: "In-World Test",
      key: "inWorldTest",
      type: "text",
      worksheetPaths: { "one-big-lie": "testability.inWorldTest" },
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
    // ── LexDrift ──
    // The language entity type had no fields at all, so a writer could model
    // two centuries of linguistic drift and none of it reached their prose.
    {
      label: "Lingua Franca",
      key: "linguaFranca",
      type: "text",
      worksheetPaths: { lexdrift: "linguistic.linguaFranca" },
    },
    {
      label: "Isolation",
      key: "isolation",
      type: "text",
      worksheetPaths: { lexdrift: "mission.isolation" },
    },
    {
      label: "Drift Duration (years)",
      key: "driftDuration",
      type: "number",
      worksheetPaths: { lexdrift: "mission.duration" },
    },
    {
      label: "Speaker Population",
      key: "speakerPopulation",
      type: "number",
      worksheetPaths: { lexdrift: "mission.population" },
    },
    {
      label: "Education Policy",
      key: "educationPolicy",
      type: "text",
      worksheetPaths: { lexdrift: "social.educationPolicy" },
    },
    {
      label: "Liturgical Language",
      key: "liturgicalLanguage",
      type: "text",
      worksheetPaths: { lexdrift: "linguistic.liturgicalLanguage" },
    },
    {
      label: "Linguistic Identity",
      key: "linguisticIdentity",
      type: "text",
      worksheetPaths: { lexdrift: "storyNotes.linguisticIdentity" },
    },
    {
      label: "Generational Shift",
      key: "generationalShift",
      type: "text",
      worksheetPaths: { lexdrift: "storyNotes.generationalShift" },
    },
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
