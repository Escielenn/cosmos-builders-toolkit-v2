// Xenomythology Implications System
// Generates suggestions for how biology + environment create "perceived constants"
// that channel archetypal energy into species-specific mythological structures

export interface Implication {
  id: string;
  perceivedConstant: string;
  archetypeChannel: string;
  explanation: string;
  biologyFactors: string[];
  environmentFactors: string[];
  suggestedArchetypeForm?: string;
}

interface ImplicationRule {
  id: string;
  // Conditions - at least one from each category must match (if category has conditions)
  biologyConditions?: {
    field: string;
    values: string[];
  }[];
  environmentConditions?: {
    field: string;
    values: string[];
  }[];
  // Output
  perceivedConstant: string;
  archetypeChannel: string;
  explanation: string;
  suggestedArchetypeForm?: string;
}

// Biology + Environment → Perceived Constants → Archetypal Channels
const IMPLICATION_RULES: ImplicationRule[] = [
  // Vision + Day/Night cycle = Duality
  {
    id: "duality-orbs",
    biologyConditions: [
      { field: "sensoryArchitecture.primaryModalities", values: ["visual-visible", "visual-infrared", "visual-ultraviolet"] },
    ],
    environmentConditions: [
      { field: "planetaryConditions.dayNightCycle", values: ["regular", "long", "extreme"] },
    ],
    perceivedConstant: "Regular alternation of light and darkness",
    archetypeChannel: "Duality/Opposition Archetypes",
    explanation: "Visual perception of day/night cycles creates a fundamental binary experience. This often manifests as light/dark, good/evil, known/unknown dichotomies in mythology. The sun and moon (if present) may become divine siblings or eternal rivals.",
    suggestedArchetypeForm: "The Eternal Twins - opposing forces that define each other",
  },

  // Echolocation + Caves/Underground = Sound as Creation
  {
    id: "sound-creation",
    biologyConditions: [
      { field: "sensoryArchitecture.primaryModalities", values: ["echolocation", "auditory-substrate"] },
    ],
    environmentConditions: [
      { field: "planetaryConditions.planetType", values: ["ice-world", "volcanic"] },
    ],
    perceivedConstant: "Sound defines and creates perceivable space",
    archetypeChannel: "Voice/Word as Primordial Creation",
    explanation: "For echolocating species, sound literally reveals reality - silence is void, the unperceived, the uncreated. Creation myths may center on a primordial sound, word, or song that brought forth existence from silence.",
    suggestedArchetypeForm: "The First Voice - the sound that created perceivable reality from silence",
  },

  // Short lifespan + Stable environment = Ancestral reverence
  {
    id: "ancestor-weight",
    biologyConditions: [
      { field: "physicalForm.lifespanCategory", values: ["very-short", "short"] },
    ],
    environmentConditions: [
      { field: "planetaryConditions.environmentalVolatility", values: ["extremely-stable", "stable"] },
    ],
    perceivedConstant: "Many generations of accumulated knowledge in unchanging world",
    archetypeChannel: "Ancestral Reverence/Living Memory",
    explanation: "When many generations pass but the environment stays constant, ancestors become the source of all wisdom. The past weighs heavily, traditions carry proven survival value, and elders/ancestors may be venerated or even worshipped.",
    suggestedArchetypeForm: "The Endless Chain - unbroken lineage connecting present to primordial ancestors",
  },

  // Hive consciousness + Isolated geography = Unity/Separation
  {
    id: "unity-exile",
    biologyConditions: [
      { field: "cognitiveArchitecture.consciousnessType", values: ["hive", "networked", "fluid"] },
    ],
    environmentConditions: [
      { field: "planetaryConditions.geographicDiversity", values: ["fragmented"] },
    ],
    perceivedConstant: "Fundamental tension between unity and isolation",
    archetypeChannel: "Unity/Exile/Reunion Archetypes",
    explanation: "Species with collective consciousness on fragmented worlds experience profound tension - being part of a greater whole while isolated from it. Myths may center on original unity, tragic separation, and promised reunion.",
    suggestedArchetypeForm: "The Scattered One - primordial unity broken, seeking wholeness",
  },

  // Metamorphosis + Any = Transformation as Sacred
  {
    id: "rebirth-metamorphosis",
    biologyConditions: [
      { field: "physicalForm.developmentalStages", values: ["metamorphosis", "multiple-metamorphosis"] },
    ],
    perceivedConstant: "Literal death-and-rebirth as normal life experience",
    archetypeChannel: "Transformation/Death-Rebirth Deities",
    explanation: "Species that undergo metamorphosis experience 'death' and 'rebirth' as biological reality. The caterpillar truly dies for the butterfly to emerge. This creates powerful resurrection/transformation archetypes grounded in lived experience.",
    suggestedArchetypeForm: "The Cocoon Gate - death as transformation, not ending",
  },

  // Thermoreception + Volcanic/Hot world = Heat as Life
  {
    id: "heat-life",
    biologyConditions: [
      { field: "sensoryArchitecture.primaryModalities", values: ["thermal"] },
    ],
    environmentConditions: [
      { field: "planetaryConditions.planetType", values: ["volcanic"] },
    ],
    perceivedConstant: "Heat equals presence and life, cold equals absence and death",
    archetypeChannel: "Fire/Warmth as Sacred Life-Force",
    explanation: "For thermal-sensing species on volcanic worlds, heat IS life - the warm earth, volcanic vents, thermal patterns in others. Cold represents death, void, absence. Fire deities may be supreme, warmth a sacred blessing.",
    suggestedArchetypeForm: "The Inner Fire - divine warmth that animates all life",
  },

  // Magnetoreception + Strong magnetic field = Invisible Guide
  {
    id: "magnetic-fate",
    biologyConditions: [
      { field: "sensoryArchitecture.primaryModalities", values: ["magnetic", "electromagnetic"] },
    ],
    perceivedConstant: "Invisible lines of force guiding all movement",
    archetypeChannel: "Fate/Destiny/Cosmic Order Archetypes",
    explanation: "Species that perceive magnetic fields experience invisible but undeniable guiding forces. This can manifest as belief in cosmic order, predetermined paths, or fate written in the fabric of reality itself.",
    suggestedArchetypeForm: "The Unseen Path - invisible force that guides all beings to their purpose",
  },

  // Any + Binary star system = Complex truth
  {
    id: "binary-truth",
    environmentConditions: [
      { field: "planetaryConditions.stellarEnvironment", values: ["binary", "multiple"] },
    ],
    perceivedConstant: "Multiple light sources, complex shadows, no simple illumination",
    archetypeChannel: "Dual/Multiplied Nature of Truth",
    explanation: "Under binary stars, there's never simple light or simple shadow - everything has multiple illuminations, overlapping shadows. Truth becomes inherently multiple, perspective-dependent. Divine figures may have dual natures.",
    suggestedArchetypeForm: "The Two-Faced Sun - truth that depends on which light you see by",
  },

  // Any + Tidally locked = Liminal sacredness
  {
    id: "twilight-sacred",
    environmentConditions: [
      { field: "planetaryConditions.dayNightCycle", values: ["tidally-locked"] },
    ],
    perceivedConstant: "Eternal day, eternal night, and a twilight border between",
    archetypeChannel: "Liminal Zone Sacredness/Threshold Mythology",
    explanation: "Tidally locked worlds have permanent day side, night side, and a habitable twilight band between. This boundary zone - neither day nor night - becomes inherently sacred, a place where opposites meet and transformation occurs.",
    suggestedArchetypeForm: "The Twilight Walk - sacred boundary where all opposites touch",
  },

  // Any + Desert world = Water as ultimate value
  {
    id: "water-sacred",
    environmentConditions: [
      { field: "planetaryConditions.planetType", values: ["desert"] },
    ],
    perceivedConstant: "Water as rarest, most precious substance",
    archetypeChannel: "Water-Life Equivalence Mythology",
    explanation: "On desert worlds, water IS life in the most literal sense. This creates mythology where water is sacred, sharing water creates unbreakable bonds, and paradise is imagined as abundant water. Deities may weep rivers or gift rain.",
    suggestedArchetypeForm: "The Hidden Spring - divine source of life-giving water",
  },

  // Any + Ocean world = Flux/Impermanence
  {
    id: "ocean-flux",
    environmentConditions: [
      { field: "planetaryConditions.planetType", values: ["ocean-world"] },
    ],
    perceivedConstant: "No fixed ground, constant motion, all things flow",
    archetypeChannel: "Flux/Impermanence/Flow Mythology",
    explanation: "Ocean worlds offer no permanent solid ground - everything moves, currents shift, nothing is truly fixed. This creates mythology centered on change, flow, impermanence. 'Solid' becomes unnatural or divine, stillness a miracle.",
    suggestedArchetypeForm: "The Unchanging Current - paradox of constancy within eternal change",
  },

  // Any + Extreme axial tilt = Death/Resurrection cycles
  {
    id: "extreme-seasons",
    environmentConditions: [
      { field: "planetaryConditions.seasonalVariation", values: ["extreme", "chaotic"] },
    ],
    perceivedConstant: "Radical seasonal change - world dies and is reborn yearly",
    archetypeChannel: "Death/Resurrection Cycle Mythology",
    explanation: "Extreme seasons mean the world visibly 'dies' and 'returns to life' on a regular schedule. This creates powerful dying-and-rising deity myths, with elaborate rituals to ensure the world's return from its seasonal death.",
    suggestedArchetypeForm: "The Sleeping God - deity who dies each winter and rises each spring",
  },

  // Long lifespan + Fast rotation = Cyclical time
  {
    id: "cycle-eternal",
    biologyConditions: [
      { field: "physicalForm.lifespanCategory", values: ["long", "extreme", "indefinite"] },
    ],
    environmentConditions: [
      { field: "planetaryConditions.dayNightCycle", values: ["regular"] },
    ],
    perceivedConstant: "Countless cycles witnessed within single lifetime",
    archetypeChannel: "Cyclical Time/Eternal Return Mythology",
    explanation: "Long-lived species witness many cycles - days, seasons, generations of shorter-lived creatures. Time becomes fundamentally cyclical rather than linear. History repeats, patterns recur, the end is also the beginning.",
    suggestedArchetypeForm: "The Wheel of Ages - endless cycle containing all things",
  },

  // Any + Rogue planet = Void deities
  {
    id: "eternal-darkness",
    environmentConditions: [
      { field: "planetaryConditions.stellarEnvironment", values: ["rogue"] },
    ],
    perceivedConstant: "Permanent darkness, no external light source",
    archetypeChannel: "Void/Absence/Internal Light Deities",
    explanation: "Rogue planets receive no starlight - darkness is the fundamental state. Light must come from within (bioluminescence, volcanism, technology). This creates mythology where darkness is the natural state and light is miraculous, internal, or hard-won.",
    suggestedArchetypeForm: "The Inner Star - divine light that comes from within, not above",
  },

  // Radial body plan = Non-linear perspective
  {
    id: "radial-perspective",
    biologyConditions: [
      { field: "physicalForm.bodyPlan", values: ["radial", "spiral"] },
    ],
    perceivedConstant: "No inherent front/back, all directions equally valid",
    archetypeChannel: "Non-Linear/Multi-Directional Mythology",
    explanation: "Radially symmetric beings have no inherent front or back - all directions are equally 'forward.' This creates fundamentally different spatial metaphors. Progress isn't 'forward,' and cosmic order may be circular rather than hierarchical.",
    suggestedArchetypeForm: "The Radiating Center - divine point from which all directions flow equally",
  },

  // Communal offspring + Any = Village deities
  {
    id: "communal-child",
    biologyConditions: [
      { field: "physicalForm.offspringInvestment", values: ["communal", "multi-generational"] },
    ],
    perceivedConstant: "All children belong to the community, not individuals",
    archetypeChannel: "Collective Parenthood/Village Deities",
    explanation: "When children are raised communally, concepts of individual parenthood blur. Deities may be parental figures for entire peoples, 'orphan' becomes meaningless, and community itself may be divinized as the true parent.",
    suggestedArchetypeForm: "The Parent of All - deity who birthed and nurtures the entire people",
  },

  // Multiple senses + Rich environment = Syncretic reality
  {
    id: "synesthetic-reality",
    biologyConditions: [
      { field: "sensoryArchitecture.integrationStyle", values: ["synesthetic", "parallel"] },
    ],
    perceivedConstant: "Reality perceived through blended, inseparable senses",
    archetypeChannel: "Syncretic/Unified Reality Mythology",
    explanation: "For species with synesthetic or parallel sensory processing, different senses blend into unified experience. This creates mythology where categories blur - sound has color, touch has taste, the sacred is perceived through all senses at once.",
    suggestedArchetypeForm: "The All-Sense - divine experience that encompasses all perception",
  },

  // Genetic memory + Any = Ancestral knowledge
  {
    id: "genetic-ancestors",
    biologyConditions: [
      { field: "cognitiveArchitecture.memoryArchitecture", values: ["genetic", "ancestral", "collective"] },
    ],
    perceivedConstant: "Ancestors literally speak through genetic inheritance",
    archetypeChannel: "Living Ancestor/Wisdom Inheritance Archetypes",
    explanation: "When memories pass through genetics or direct transfer, ancestors aren't just remembered - they're still present. This creates mythology where death is just a change in how ancestors participate, and the dead remain active guides.",
    suggestedArchetypeForm: "The Undying Chorus - ancestors who never truly leave but speak through descendants",
  },
];

// Type for form state (simplified for checking conditions)
interface FormStateConditionChecker {
  sensoryArchitecture: {
    primaryModalities: string[];
    integrationStyle: string;
  };
  physicalForm: {
    bodyPlan: string;
    lifespanCategory: string;
    developmentalStages: string;
    offspringInvestment: string;
  };
  cognitiveArchitecture: {
    consciousnessType: string;
    memoryArchitecture: string[];
  };
  planetaryConditions: {
    planetType: string;
    dayNightCycle: string;
    seasonalVariation: string;
    stellarEnvironment: string;
    environmentalVolatility: string;
    geographicDiversity: string;
  };
}

function getNestedValue(obj: FormStateConditionChecker, path: string): string | string[] {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return "";
    }
  }
  return current as string | string[];
}

function checkCondition(
  formState: FormStateConditionChecker,
  condition: { field: string; values: string[] }
): boolean {
  const fieldValue = getNestedValue(formState, condition.field);

  if (Array.isArray(fieldValue)) {
    // Field is an array (like primaryModalities) - check if any value matches
    return fieldValue.some(v => condition.values.includes(v));
  } else {
    // Field is a string - direct check
    return condition.values.includes(fieldValue as string);
  }
}

export function generateImplications(formState: FormStateConditionChecker): Implication[] {
  const implications: Implication[] = [];

  for (const rule of IMPLICATION_RULES) {
    // Check biology conditions (if any exist)
    const biologyMatch = !rule.biologyConditions ||
      rule.biologyConditions.some(cond => checkCondition(formState, cond));

    // Check environment conditions (if any exist)
    const environmentMatch = !rule.environmentConditions ||
      rule.environmentConditions.some(cond => checkCondition(formState, cond));

    // Rule matches if both biology and environment conditions are satisfied
    // (or if a category has no conditions)
    if (biologyMatch && environmentMatch) {
      // Only include if at least one category has actual conditions that matched
      const hasBiologyConditions = rule.biologyConditions && rule.biologyConditions.length > 0;
      const hasEnvironmentConditions = rule.environmentConditions && rule.environmentConditions.length > 0;

      if (hasBiologyConditions || hasEnvironmentConditions) {
        // Gather the matching factors for display
        const biologyFactors: string[] = [];
        const environmentFactors: string[] = [];

        if (rule.biologyConditions) {
          for (const cond of rule.biologyConditions) {
            if (checkCondition(formState, cond)) {
              biologyFactors.push(cond.field.split(".").pop() || cond.field);
            }
          }
        }

        if (rule.environmentConditions) {
          for (const cond of rule.environmentConditions) {
            if (checkCondition(formState, cond)) {
              environmentFactors.push(cond.field.split(".").pop() || cond.field);
            }
          }
        }

        implications.push({
          id: rule.id,
          perceivedConstant: rule.perceivedConstant,
          archetypeChannel: rule.archetypeChannel,
          explanation: rule.explanation,
          biologyFactors,
          environmentFactors,
          suggestedArchetypeForm: rule.suggestedArchetypeForm,
        });
      }
    }
  }

  return implications;
}

export default IMPLICATION_RULES;
