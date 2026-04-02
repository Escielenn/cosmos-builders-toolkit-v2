/**
 * Narrative Bridge questions per simulator.
 *
 * After running a simulation, a pull-out panel offers guided questions
 * that bridge physics output to narrative implications. This is the
 * Environmental Cascade applied to simulators.
 *
 * Spec: StellarForge_Simulator_Addendum — Narrative Bridge
 */

export interface NarrativeQuestion {
  id: string;
  layer: string;       // cascade layer label
  layerColor: string;  // accent color for the layer
  prompt: string;
}

export interface SimulatorNarrativeConfig {
  simulatorType: string;
  contextTemplate: string; // supports {name}, {type} placeholders
  questions: NarrativeQuestion[];
}

const SHARED_LAYERS = {
  environment: { layer: "Environment", color: "#4D9FFF" },
  biology:     { layer: "Biology", color: "#00FF88" },
  culture:     { layer: "Culture", color: "#9B5DE5" },
  mythology:   { layer: "Mythology", color: "#5B8DEF" },
};

export const SIMULATOR_NARRATIVE_CONFIGS: Record<string, SimulatorNarrativeConfig> = {
  rogue: {
    simulatorType: "rogue",
    contextTemplate: "A rogue object passed through your system.",
    questions: [
      { id: "rogue-env", ...SHARED_LAYERS.environment, prompt: "What lasting physical effects did this encounter leave on your system's orbits and climate?" },
      { id: "rogue-bio", ...SHARED_LAYERS.biology, prompt: "How would life on affected worlds adapt to the orbital disruption? What species thrived, and which went extinct?" },
      { id: "rogue-cul", ...SHARED_LAYERS.culture, prompt: "What political or social consequences followed? How did civilizations respond to the sky changing?" },
      { id: "rogue-myth", ...SHARED_LAYERS.mythology, prompt: "How do the inhabitants remember this event? What stories, prophecies, or religious movements did it inspire?" },
    ],
  },

  tidelock: {
    simulatorType: "tidelock",
    contextTemplate: "Your world is tidally locked to its star.",
    questions: [
      { id: "tide-env", ...SHARED_LAYERS.environment, prompt: "What are conditions like in each zone — permanent day, permanent night, and the terminator band between them?" },
      { id: "tide-bio", ...SHARED_LAYERS.biology, prompt: "How does life differ across the zones? What organisms thrive at the terminator?" },
      { id: "tide-cul", ...SHARED_LAYERS.culture, prompt: "What civilizations form on each side? What role does the terminator zone play — border, trade route, sacred ground?" },
      { id: "tide-myth", ...SHARED_LAYERS.mythology, prompt: "What myths explain the frozen sun? How do the inhabitants understand a sky that never changes?" },
    ],
  },

  exosky: {
    simulatorType: "exosky",
    contextTemplate: "View from the surface of your world.",
    questions: [
      { id: "sky-env", ...SHARED_LAYERS.environment, prompt: "How does this sky affect the world below? What light conditions, radiation levels, or visibility patterns result?" },
      { id: "sky-bio", ...SHARED_LAYERS.biology, prompt: "How would local life perceive this sky? What visual systems would evolve under these conditions?" },
      { id: "sky-cul", ...SHARED_LAYERS.culture, prompt: "What constellations do the inhabitants draw? What navigational systems emerge from these star patterns?" },
      { id: "sky-myth", ...SHARED_LAYERS.mythology, prompt: "What cosmological myths arise from this view of the universe? How do these patterns shape religion and philosophy?" },
    ],
  },

  exoforge: {
    simulatorType: "exoforge",
    contextTemplate: "You've generated a new exoplanet.",
    questions: [
      { id: "forge-env", ...SHARED_LAYERS.environment, prompt: "What are the primary survival challenges on this world? What resources does it offer?" },
      { id: "forge-bio", ...SHARED_LAYERS.biology, prompt: "What kind of life could evolve here? How would the planet's conditions shape body plans and metabolisms?" },
      { id: "forge-cul", ...SHARED_LAYERS.culture, prompt: "What makes this world worth settling or avoiding? What societies might emerge from these conditions?" },
      { id: "forge-myth", ...SHARED_LAYERS.mythology, prompt: "What is sacred or feared on this world? What natural phenomena would become the basis for mythology?" },
    ],
  },

  solaris: {
    simulatorType: "solaris",
    contextTemplate: "Your star system is generated.",
    questions: [
      { id: "sol-env", ...SHARED_LAYERS.environment, prompt: "How do multiple suns affect climate, seasons, and day-night cycles on habitable worlds?" },
      { id: "sol-bio", ...SHARED_LAYERS.biology, prompt: "How would life adapt to multiple light sources? What photosynthetic systems or circadian rhythms emerge?" },
      { id: "sol-cul", ...SHARED_LAYERS.culture, prompt: "How do multiple suns affect calendars, agriculture, and timekeeping? What economic patterns result?" },
      { id: "sol-myth", ...SHARED_LAYERS.mythology, prompt: "What myths explain the multiple suns? What religious or philosophical significance do eclipses and conjunctions hold?" },
    ],
  },
};
