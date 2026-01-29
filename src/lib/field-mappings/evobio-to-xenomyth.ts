// Field mappings from Evolutionary Biology to Xenomythology Framework

export interface FieldMapping {
  source: string; // Dot-notation path in EvoBio
  target: string; // Dot-notation path in Xenomyth
  label: string; // Human-readable label for UI
  transform?: (value: unknown) => unknown;
}

// Transform an array of sensory types from EvoBio format to Xenomyth format
function mapSensoryTypes(senses: string[]): string[] {
  if (!Array.isArray(senses)) return [];

  const mapping: Record<string, string> = {
    "vision-visible": "visual-standard",
    "vision-infrared": "visual-infrared",
    "vision-uv": "visual-ultraviolet",
    "hearing-air": "auditory-standard",
    "hearing-water": "auditory-aquatic",
    "echolocation": "echolocation",
    "electroreception": "electroreception",
    "magnetoreception": "magnetoreception",
    "chemoreception": "chemical",
    "proprioception": "proprioceptive",
    "thermoception": "thermal",
    "touch": "tactile",
    "pressure": "pressure",
    "vibration": "vibration",
  };

  return senses.map(s => mapping[s] || s);
}

// Map EvoBio body plan symmetry to Xenomyth body plan
function mapBodyPlan(symmetry: string): string {
  const mapping: Record<string, string> = {
    "bilateral": "bilateral-bipedal",
    "radial": "radial",
    "biradial": "radial",
    "asymmetric": "asymmetric",
    "spherical": "spherical",
  };
  return mapping[symmetry] || symmetry;
}

// Map limbs array to limb arrangement description
function formatLimbs(limbs: Array<{ type: string; count: string; function: string }>): string {
  if (!Array.isArray(limbs) || limbs.length === 0) return "";

  const limbDescriptions = limbs.map(l => {
    if (l.count && l.type) {
      return `${l.count} ${l.type}${l.function ? ` (${l.function})` : ''}`;
    }
    return null;
  }).filter(Boolean);

  return limbDescriptions.join(", ");
}

// Map reproduction mode to Xenomyth reproduction strategy
function mapReproductionStrategy(mode: string): string {
  const mapping: Record<string, string> = {
    "sexual-binary": "sexual-paired",
    "sexual-multiple": "sexual-multiple-parents",
    "hermaphroditic": "hermaphroditic",
    "sequential-hermaphrodite": "sequential-sex-change",
    "parthenogenesis": "parthenogenic",
    "budding": "budding",
    "spore": "spore-based",
  };
  return mapping[mode] || mode;
}

// Map parental care to offspring investment
function mapParentalCare(care: string): string {
  const mapping: Record<string, string> = {
    "none": "minimal",
    "minimal": "minimal",
    "moderate": "moderate",
    "extensive": "intensive",
    "communal": "communal",
    "parasitic": "minimal",
  };
  return mapping[care] || care;
}

// Map lifespan to category
function mapLifespan(lifespan: string): string {
  const mapping: Record<string, string> = {
    "very-short": "ephemeral",
    "short": "short-lived",
    "moderate": "moderate",
    "long": "long-lived",
    "very-long": "extended",
    "indefinite": "potentially-immortal",
  };
  return mapping[lifespan] || lifespan;
}

// Map life stages array to developmental stages description
function formatLifeStages(stages: Array<{ stage: string; duration: string; characteristics: string }>): string {
  if (!Array.isArray(stages) || stages.length === 0) return "";

  const stageNames = stages.map(s => s.stage).filter(Boolean);
  if (stageNames.length <= 2) return "simple";
  if (stageNames.length <= 4) return "moderate";
  return "complex-multi-stage";
}

// Map cognition type to consciousness type
function mapCognitionType(type: string): string {
  const mapping: Record<string, string> = {
    "reactive": "minimal-consciousness",
    "associative": "associative",
    "problem-solving": "problem-solving",
    "abstract": "abstract-reasoning",
    "distributed": "distributed-hive",
    "emergent": "emergent",
  };
  return mapping[type] || type;
}

// Map memory type to array of memory architectures
function mapMemoryType(type: string): string[] {
  const mapping: Record<string, string[]> = {
    "short-term": ["short-term-dominant"],
    "episodic": ["episodic"],
    "procedural": ["procedural-dominant"],
    "semantic": ["semantic-networked"],
    "collective": ["collective-shared"],
    "genetic": ["genetic-inherited"],
  };
  return mapping[type] || [type];
}

// Map emotion analogs array to emotional range description
function formatEmotionalRange(emotions: string[]): string {
  if (!Array.isArray(emotions) || emotions.length === 0) return "";

  // Return as comma-separated string for the Xenomyth field
  return emotions
    .map(e => e.replace(/-/g, ' '))
    .map(e => e.charAt(0).toUpperCase() + e.slice(1))
    .join(", ");
}

// Map social structure to evolution context
function mapSocialStructure(structure: string): string {
  const mapping: Record<string, string> = {
    "solitary": "individual-competition",
    "pair-bonded": "pair-bonding",
    "family-groups": "small-groups",
    "pack-herd": "large-groups",
    "eusocial": "eusocial",
    "fission-fusion": "fluid-groups",
  };
  return mapping[structure] || structure;
}

// The main field mappings configuration
export const EVOBIO_TO_XENOMYTH_MAPPINGS: FieldMapping[] = [
  // Sensory Architecture
  {
    source: "sensory.primarySenses",
    target: "sensoryArchitecture.primaryModalities",
    label: "Primary Senses",
    transform: mapSensoryTypes,
  },
  {
    source: "sensory.environmentalTuning",
    target: "sensoryArchitecture.cognitionImpact",
    label: "Sensory Cognition Impact",
  },

  // Physical Form
  {
    source: "bodyPlan.symmetry",
    target: "physicalForm.bodyPlan",
    label: "Body Plan",
    transform: mapBodyPlan,
  },
  {
    source: "bodyPlan.limbs",
    target: "physicalForm.limbArrangement",
    label: "Limb Arrangement",
    transform: formatLimbs,
  },

  // Reproduction & Life Cycle
  {
    source: "reproduction.reproductionMode",
    target: "physicalForm.reproductionStrategy",
    label: "Reproduction Strategy",
    transform: mapReproductionStrategy,
  },
  {
    source: "reproduction.parentalCare",
    target: "physicalForm.offspringInvestment",
    label: "Offspring Investment",
    transform: mapParentalCare,
  },
  {
    source: "reproduction.lifespan",
    target: "physicalForm.lifespanCategory",
    label: "Lifespan Category",
    transform: mapLifespan,
  },
  {
    source: "reproduction.lifeStages",
    target: "physicalForm.developmentalStages",
    label: "Developmental Stages",
    transform: formatLifeStages,
  },

  // Cognitive Architecture
  {
    source: "cognition.cognitionType",
    target: "cognitiveArchitecture.consciousnessType",
    label: "Consciousness Type",
    transform: mapCognitionType,
  },
  {
    source: "cognition.memoryType",
    target: "cognitiveArchitecture.memoryArchitecture",
    label: "Memory Architecture",
    transform: mapMemoryType,
  },
  {
    source: "psychology.emotionAnalogs",
    target: "cognitiveArchitecture.emotionalRange",
    label: "Emotional Range",
    transform: formatEmotionalRange,
  },
  {
    source: "cognition.abstractThinking",
    target: "cognitiveArchitecture.cognitiveChallenges",
    label: "Cognitive Challenges",
  },

  // Evolutionary/Social Context
  {
    source: "social.socialStructure",
    target: "evolutionaryPressures.socialStructureEvolution",
    label: "Social Structure Evolution",
    transform: mapSocialStructure,
  },
  {
    source: "social.cooperationMechanisms",
    target: "evolutionaryPressures.survivalChallenges",
    label: "Survival Challenges",
    // Maps cooperation mechanisms as survival challenge context
  },
];

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

// Result type for mapped field
export interface MappedField {
  source: string;
  target: string;
  label: string;
  value: unknown;
  originalValue: unknown;
}

// Map EvoBio data to Xenomyth fields
export function mapEvoBioToXenomyth(evoBioData: Record<string, unknown>): MappedField[] {
  const results: MappedField[] = [];

  for (const mapping of EVOBIO_TO_XENOMYTH_MAPPINGS) {
    const originalValue = getNestedValue(evoBioData, mapping.source);

    if (originalValue !== undefined && originalValue !== null && originalValue !== "") {
      const transformedValue = mapping.transform
        ? mapping.transform(originalValue)
        : originalValue;

      results.push({
        source: mapping.source,
        target: mapping.target,
        label: mapping.label,
        value: transformedValue,
        originalValue,
      });
    } else {
      results.push({
        source: mapping.source,
        target: mapping.target,
        label: mapping.label,
        value: undefined,
        originalValue: undefined,
      });
    }
  }

  return results;
}

// Apply mapped fields to Xenomyth form state
export function applyMappedFields(
  xenomythState: Record<string, unknown>,
  mappedFields: MappedField[],
  selectedTargets: Set<string>
): Record<string, unknown> {
  const result = { ...xenomythState };

  for (const field of mappedFields) {
    if (!selectedTargets.has(field.target) || field.value === undefined) {
      continue;
    }

    // Set nested value
    const parts = field.target.split(".");
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = field.value;
  }

  return result;
}
