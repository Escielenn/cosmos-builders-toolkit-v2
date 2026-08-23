/**
 * Infobox field definitions for each tool type.
 * Maps tool data (from worksheets.data JSON) to display fields
 * shown in the wiki page DATA PROFILE section.
 */

export interface InfoboxField {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
}

export function getInfoboxFields(
  toolSource: string,
  toolData: Record<string, unknown>
): InfoboxField[] {
  const template = templates[toolSource];
  if (!template) return [];
  return template(toolData).filter(
    (f) => f.value !== null && f.value !== undefined && f.value !== ""
  );
}

/** Safe accessor for nested tool data */
function get(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function str(data: Record<string, unknown>, path: string): string {
  const v = get(data, path);
  if (v == null) return "";
  return String(v);
}

function num(data: Record<string, unknown>, path: string): string {
  const v = get(data, path);
  if (v == null || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? "" : String(n);
}

const templates: Record<
  string,
  (d: Record<string, unknown>) => InfoboxField[]
> = {
  "planetary-profile": (d) => [
    { label: "Star Type", value: str(d, "stellarEnvironment.starType") },
    { label: "Planet Type", value: str(d, "physicalCharacteristics.planetType") },
    { label: "Mass", value: num(d, "physicalCharacteristics.planetaryMass"), unit: "M\u2295" },
    { label: "Radius", value: num(d, "physicalCharacteristics.planetaryRadius"), unit: "R\u2295" },
    { label: "Surface Gravity", value: num(d, "physicalCharacteristics.surfaceGravity"), unit: "g" },
    { label: "Atmosphere", value: str(d, "atmosphericComposition.type") },
    { label: "Mean Temperature", value: num(d, "temperatureProfile.averageSurfaceTemp"), unit: "K" },
    { label: "Orbital Period", value: num(d, "stellarEnvironment.orbitalPeriod"), unit: "days" },
  ],

  "evolutionary-biology": (d) => [
    { label: "Species Name", value: str(d, "speciesName") },
    { label: "Body Plan", value: str(d, "bodyPlan.planType") },
    { label: "Symmetry", value: str(d, "bodyPlan.symmetry") },
    { label: "Limbs", value: str(d, "bodyPlan.limbCount") },
    { label: "Biochemistry", value: str(d, "biochemistry.biochemicalBasis") },
    { label: "Intelligence", value: str(d, "cognition.cognitionType") },
    { label: "Communication", value: str(d, "communication.primaryChannel") },
  ],

  "spacecraft-designer": (d) => [
    { label: "Vessel Name", value: str(d, "identity.name") },
    { label: "Class", value: str(d, "identity.class") },
    { label: "Role", value: str(d, "identity.role") },
    { label: "Propulsion", value: str(d, "propulsion.driveType") },
    { label: "Crew Capacity", value: str(d, "living.crewQuarters") },
    { label: "Length", value: str(d, "identity.length"), unit: "m" },
  ],

  "empire-designer": (d) => [
    { label: "Empire Name", value: str(d, "foundation.name") },
    { label: "Government", value: str(d, "foundation.governmentType") },
    { label: "Population", value: str(d, "territory.population") },
    { label: "Systems", value: str(d, "territory.systems") },
    { label: "Economy", value: str(d, "economy.type") },
    { label: "Military Doctrine", value: str(d, "military.doctrine") },
    { label: "Stability", value: str(d, "stability.level") },
  ],

  "star-system-builder": (d) => [
    { label: "System Name", value: str(d, "systemName") },
    { label: "Star Type", value: str(d, "primaryStar.spectralClass") },
    { label: "Star Mass", value: num(d, "primaryStar.mass"), unit: "M\u2609" },
    { label: "Configuration", value: str(d, "configuration.type") },
    {
      label: "Bodies",
      value: Array.isArray(get(d, "bodies"))
        ? String((get(d, "bodies") as unknown[]).length)
        : "",
    },
  ],

  "drake-equation-calculator": (d) => {
    const vals = (get(d, "values") as Record<string, unknown>) || {};
    const product =
      [vals.rStar, vals.fp, vals.ne, vals.fl, vals.fi, vals.fc, vals.L]
        .filter((v) => v != null && v !== "")
        .reduce<number>((acc, v) => acc * Number(v), 1);
    return [
      {
        label: "N (Civilizations)",
        value: Object.keys(vals).length >= 7 ? String(Math.round(product)) : "",
      },
      { label: "R* (Star Formation)", value: num(vals as Record<string, unknown>, "rStar") },
      { label: "fp (Planets)", value: num(vals as Record<string, unknown>, "fp") },
      { label: "ne (Habitable)", value: num(vals as Record<string, unknown>, "ne") },
      { label: "fl (Life)", value: num(vals as Record<string, unknown>, "fl") },
      { label: "fi (Intelligence)", value: num(vals as Record<string, unknown>, "fi") },
      { label: "fc (Communication)", value: num(vals as Record<string, unknown>, "fc") },
      { label: "L (Lifetime)", value: num(vals as Record<string, unknown>, "L"), unit: "years" },
    ];
  },

  "xenomythology-framework-builder": (d) => [
    { label: "Sensory Architecture", value: str(d, "sensoryArchitecture.primary") },
    { label: "Physical Form", value: str(d, "physicalForm.bodyPlan") },
    { label: "Cognitive Architecture", value: str(d, "cognitiveArchitecture.consciousnessType") },
    { label: "Planetary Conditions", value: str(d, "planetaryConditions.environment") },
  ],

  "environmental-chain-reaction": (d) => [
    { label: "Parameter", value: str(d, "parameter.name") },
    { label: "Change Type", value: str(d, "parameter.changeType") },
    { label: "Severity", value: str(d, "parameter.severity") },
    { label: "Level 1", value: str(d, "level1.effect") },
    { label: "Level 2", value: str(d, "level2.effect") },
    { label: "Level 3", value: str(d, "level3.effect") },
  ],

  "propulsion-consequences-map": (d) => [
    { label: "System", value: str(d, "system.name") },
    { label: "Type", value: str(d, "system.type") },
    { label: "Delta-V", value: str(d, "benchmarks.deltaV"), unit: "km/s" },
    { label: "ISP", value: str(d, "benchmarks.isp"), unit: "s" },
    { label: "Thrust", value: str(d, "benchmarks.thrust"), unit: "N" },
  ],

  "technology-consequences": (d) => [
    { label: "Technology", value: str(d, "technologyName") },
    { label: "Category", value: str(d, "technologyCategory") },
    { label: "Maturity", value: str(d, "maturityLevel") },
    { label: "Access Level", value: str(d, "accessLevel") },
    { label: "Primary Contradiction", value: str(d, "primaryContradiction") },
  ],

  "species-interaction-matrix": (d) => {
    const species = get(d, "species") as Array<Record<string, unknown>> | undefined;
    return [
      { label: "Species Count", value: species ? String(species.length) : "" },
      { label: "Equilibrium", value: str(d, "overallEquilibrium") },
      { label: "Trajectory", value: str(d, "overallTrajectory") },
      { label: "Dominant Species", value: str(d, "dominantSpecies") },
      { label: "Most Volatile Pair", value: str(d, "mostVolatilePair") },
    ];
  },

  "one-big-lie": (d) => [
    { label: "Approach", value: str(d, "approach") },
    { label: "Core Statement", value: str(d, "coreStatement.statement") },
    { label: "Rigor Commitment", value: str(d, "rigorCommitment") },
  ],

  "time-dilation": (d) => [
    { label: "Journey Type", value: str(d, "journey.type") },
    { label: "Distance", value: str(d, "journey.distance"), unit: "ly" },
    { label: "Propulsion", value: str(d, "propulsion.method") },
    { label: "Max Velocity", value: str(d, "velocityProfile.velocityFraction"), unit: "c" },
    { label: "Ship Time", value: str(d, "referenceFrame.shipTime") },
    { label: "Earth Time", value: str(d, "referenceFrame.earthTime") },
  ],

  "space-expansion-modeler": (d) => [
    { label: "Civilization", value: str(d, "foundation.civilizationName") },
    { label: "Starting System", value: str(d, "foundation.startingSystem") },
    { label: "FTL Capable", value: str(d, "foundation.ftlCapable") },
    {
      label: "Phases",
      value: Array.isArray(get(d, "phases"))
        ? String((get(d, "phases") as unknown[]).length)
        : "",
    },
  ],

  "habitable-zone-calculator": (d) => [
    { label: "Star Type", value: str(d, "star.spectralType") },
    { label: "Star Mass", value: num(d, "star.mass"), unit: "M\u2609" },
    { label: "Star Luminosity", value: num(d, "star.luminosity"), unit: "L\u2609" },
    { label: "Planet Distance", value: num(d, "planet.orbitalDistance"), unit: "AU" },
    { label: "Planet Mass", value: num(d, "planet.mass"), unit: "M\u2295" },
  ],

  lexdrift: (d) => [
    { label: "Mission Type", value: str(d, "mission.type") },
    { label: "Duration", value: str(d, "mission.duration"), unit: "years" },
    { label: "Population", value: str(d, "mission.population") },
    { label: "Linguistic Mode", value: str(d, "linguistic.mode") },
  ],

  "surface-gravity-calculator": (d) => [
    { label: "Body Name", value: str(d, "primary.name") },
    { label: "Mass", value: num(d, "primary.mass"), unit: "M\u2295" },
    { label: "Radius", value: num(d, "primary.radius"), unit: "R\u2295" },
    { label: "Surface Gravity", value: num(d, "primary.gravity"), unit: "g" },
  ],

  timeline: (d) => {
    const events = get(d, "events") as unknown[] | undefined;
    const tracks = get(d, "tracks") as unknown[] | undefined;
    return [
      { label: "Events", value: events ? String(events.length) : "0" },
      { label: "Tracks", value: tracks ? String(tracks.length) : "0" },
    ];
  },

  sensorium: (d) => [
    { label: "Species Name", value: str(d, "speciesName") },
    { label: "Mode", value: str(d, "mode") },
    { label: "Environment", value: str(d, "environment.type") },
    {
      label: "Modalities",
      value: Array.isArray(get(d, "selectedModalities"))
        ? String((get(d, "selectedModalities") as unknown[]).length)
        : "",
    },
  ],

  gravitas: (d) => [
    { label: "Active Mode", value: str(d, "activeMode") },
    { label: "Realism", value: str(d, "realismMode") },
  ],
};
