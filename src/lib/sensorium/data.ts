// SENSORIUM — Static data: modality database, presets, section definitions
// No React dependencies. Safe to import from calculations and PDF templates.

import type {
  SensoryModality,
  SpectralPreset,
  AtmospherePreset,
  ModalityCategory,
  EnvironmentConfig,
  SensoriumFormState,
} from "./types";

// ─── Section Definitions ─────────────────────────────────────────

export const SENSORIUM_SECTIONS = [
  { id: "environment", title: "1. Environment" },
  { id: "sensory-palette", title: "2. Sensory Palette" },
  { id: "metabolic-budget", title: "3. Metabolic Budget" },
  { id: "perception-profile", title: "4. Perception Profile" },
  { id: "worldbuilding", title: "5. Worldbuilding Implications" },
  { id: "perception-gaps", title: "6. Perception Gaps" },
  { id: "synthesis", title: "7. Synthesis" },
];

// ─── Section Guidance ────────────────────────────────────────────

export const SECTION_GUIDANCE: Record<
  string,
  { thinkLike: string; guidance: string }
> = {
  environment: {
    thinkLike: "an evolutionary biologist examining selection pressures",
    guidance:
      "The environment determines which senses can evolve. Start here—everything else follows from these constraints.",
  },
  "sensory-palette": {
    thinkLike: "a comparative neurobiologist",
    guidance:
      "Review derived senses and curate your final selection. The metabolic budget constrains what's sustainable.",
  },
  "metabolic-budget": {
    thinkLike: "an energy economist",
    guidance:
      "Sensory systems require significant metabolic investment. Most Earth organisms dedicate 10-25% of brain mass to vision alone.",
  },
  "perception-profile": {
    thinkLike: "a cognitive psychologist",
    guidance:
      "How your species ranks its senses shapes everything from instinctive reactions to philosophical worldview.",
  },
  worldbuilding: {
    thinkLike: "an alien anthropologist",
    guidance:
      "Every sense cascades into culture. A species that sees heat will build very different cities than one that hears ultrasound.",
  },
  "perception-gaps": {
    thinkLike: "a first-contact diplomat",
    guidance:
      "The gap between what your species perceives and what humans perceive is where the best stories live.",
  },
  synthesis: {
    thinkLike: "a science fiction author",
    guidance:
      "Weave your sensory choices into a coherent narrative. How does perception shape identity?",
  },
};

// ─── Modality Categories ─────────────────────────────────────────

export const MODALITY_CATEGORIES: {
  id: ModalityCategory;
  label: string;
  color: string;
  icon: string;
}[] = [
  {
    id: "electromagnetic",
    label: "Electromagnetic",
    color: "#FFD700",
    icon: "Sun",
  },
  { id: "mechanical", label: "Mechanical", color: "#00BFFF", icon: "Waves" },
  { id: "chemical", label: "Chemical", color: "#32CD32", icon: "FlaskConical" },
  {
    id: "magnetic-thermal",
    label: "Magnetic & Thermal",
    color: "#FF6347",
    icon: "Magnet",
  },
  { id: "other", label: "Other", color: "#9370DB", icon: "Sparkles" },
];

// ─── Metabolic Cost Weights ──────────────────────────────────────

export const METABOLIC_WEIGHTS = {
  low: 0.05,
  medium: 0.15,
  high: 0.25,
  extreme: 0.4,
} as const;

// ─── Human Baseline Senses (for perception gap comparison) ───────

export const HUMAN_SENSES = [
  "visible-light",
  "standard-hearing",
  "taste",
  "airborne-smell",
  "thermoreception",
  "proprioception",
  "pressure-sense",
];

// ─── Spectral Presets ────────────────────────────────────────────
// Peak wavelength via Wien's displacement law: λ_peak = 2,898,000 / T (nm)

export const SPECTRAL_PRESETS: SpectralPreset[] = [
  {
    id: "o",
    label: "O-Type (Blue Giant)",
    temperature: 40000,
    peakWavelength: 72,
    uvOutput: "extreme",
    luminosity: 100000,
  },
  {
    id: "b",
    label: "B-Type (Blue-White)",
    temperature: 20000,
    peakWavelength: 145,
    uvOutput: "extreme",
    luminosity: 5000,
  },
  {
    id: "a",
    label: "A-Type (White)",
    temperature: 8500,
    peakWavelength: 341,
    uvOutput: "high",
    luminosity: 15,
  },
  {
    id: "f",
    label: "F-Type (Yellow-White)",
    temperature: 6500,
    peakWavelength: 446,
    uvOutput: "moderate",
    luminosity: 3,
  },
  {
    id: "g",
    label: "G-Type (Yellow/Sun-like)",
    temperature: 5778,
    peakWavelength: 501,
    uvOutput: "moderate",
    luminosity: 1,
  },
  {
    id: "k",
    label: "K-Type (Orange Dwarf)",
    temperature: 4500,
    peakWavelength: 644,
    uvOutput: "low",
    luminosity: 0.3,
  },
  {
    id: "m",
    label: "M-Type (Red Dwarf)",
    temperature: 3200,
    peakWavelength: 906,
    uvOutput: "negligible",
    luminosity: 0.04,
  },
  {
    id: "l",
    label: "L-Type (Brown Dwarf)",
    temperature: 1800,
    peakWavelength: 1610,
    uvOutput: "negligible",
    luminosity: 0.0001,
  },
  {
    id: "t",
    label: "T-Type (Cool Brown Dwarf)",
    temperature: 1000,
    peakWavelength: 2898,
    uvOutput: "negligible",
    luminosity: 0.00001,
  },
  {
    id: "y",
    label: "Y-Type (Coldest Brown Dwarf)",
    temperature: 400,
    peakWavelength: 7245,
    uvOutput: "negligible",
    luminosity: 0.000001,
  },
];

// ─── Atmosphere Presets ──────────────────────────────────────────

export const ATMOSPHERE_PRESETS: AtmospherePreset[] = [
  {
    id: "earth-like",
    label: "Earth-like (N₂/O₂)",
    hasAtmosphere: true,
    pressure: 1.0,
    opacity: "transparent",
    composition: "78% N₂, 21% O₂, 1% Ar",
  },
  {
    id: "mars-like",
    label: "Mars-like (CO₂, thin)",
    hasAtmosphere: true,
    pressure: 0.006,
    opacity: "transparent",
    composition: "95% CO₂, 2.7% N₂",
  },
  {
    id: "venus-like",
    label: "Venus-like (CO₂, dense)",
    hasAtmosphere: true,
    pressure: 92,
    opacity: "opaque",
    composition: "96% CO₂, sulfuric acid clouds",
  },
  {
    id: "titan-like",
    label: "Titan-like (N₂/CH₄)",
    hasAtmosphere: true,
    pressure: 1.45,
    opacity: "translucent",
    composition: "95% N₂, 5% CH₄, thick haze",
  },
  {
    id: "none",
    label: "No Atmosphere",
    hasAtmosphere: false,
    pressure: 0,
    opacity: "transparent",
    composition: "Vacuum",
  },
  {
    id: "custom",
    label: "Custom",
    hasAtmosphere: true,
    pressure: 1.0,
    opacity: "transparent",
    composition: "Custom mix",
  },
];

// ─── Medium Options ──────────────────────────────────────────────

export const MEDIUM_OPTIONS = [
  { id: "terrestrial", label: "Terrestrial (land-based)" },
  { id: "aquatic", label: "Aquatic (liquid medium)" },
  { id: "aerial", label: "Aerial (atmospheric)" },
  { id: "subsurface", label: "Subsurface (underground/underice)" },
  { id: "vacuum-interface", label: "Vacuum-Interface (space-adjacent)" },
] as const;

export const LIQUID_TYPE_OPTIONS = [
  { id: "water", label: "Water (H₂O)" },
  { id: "methane", label: "Methane (CH₄)" },
  { id: "ammonia", label: "Ammonia (NH₃)" },
  { id: "hydrocarbon", label: "Hydrocarbon mix" },
  { id: "sulfuric-acid", label: "Sulfuric Acid (H₂SO₄)" },
] as const;

export const CONDUCTIVITY_OPTIONS = [
  { id: "none", label: "None (dry/insulating)" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High (saline/metallic)" },
] as const;

export const MAGNETIC_STRENGTH_OPTIONS = [
  { id: "weak", label: "Weak (<0.1 Gauss)" },
  { id: "moderate", label: "Moderate (0.25-0.65 Gauss, Earth-like)" },
  { id: "strong", label: "Strong (>1 Gauss)" },
] as const;

export const MAGNETIC_STABILITY_OPTIONS = [
  { id: "stable", label: "Stable" },
  { id: "variable", label: "Variable (periodic reversals)" },
  { id: "chaotic", label: "Chaotic (unpredictable)" },
] as const;

export const SEASONAL_VARIATION_OPTIONS = [
  { id: "none", label: "None" },
  { id: "mild", label: "Mild" },
  { id: "extreme", label: "Extreme" },
] as const;

// ─── Default Environment ─────────────────────────────────────────

export const DEFAULT_ENVIRONMENT: EnvironmentConfig = {
  star: {
    preset: "g",
    temperature: 5778,
    peakWavelength: 501,
    uvOutput: "moderate",
    luminosity: 1,
  },
  atmosphere: {
    preset: "earth-like",
    hasAtmosphere: true,
    pressure: 1.0,
    opacity: "transparent",
  },
  medium: { type: "terrestrial", conductivity: "none" },
  magneticField: { present: true, strength: "moderate", stability: "stable" },
  lighting: {
    dayNightCycle: true,
    tidallyLocked: false,
    seasonalVariation: "mild",
  },
};

// ─── Default FormState ───────────────────────────────────────────

export const DEFAULT_FORM_STATE: SensoriumFormState = {
  speciesName: "",
  mode: "derive",
  environment: DEFAULT_ENVIRONMENT,
  derivedResults: [],
  selectedModalities: [],
  validationResult: null,
  finalSelection: [],
  perceptionProfile: {
    dominantSense: "",
    sensoryHierarchy: "",
    perceptionNotes: "",
  },
  worldbuildingNotes: {
    communicationNotes: "",
    artNotes: "",
    architectureNotes: "",
    technologyNotes: "",
    mythologyNotes: "",
    socialNotes: "",
  },
  perceptionGapNotes: {
    speciesPerceives: "",
    speciesBlind: "",
    conflictPotential: "",
  },
  synthesis: {
    narrativeSummary: "",
    storyHooks: "",
    integrationNotes: "",
  },
  generalNotes: "",
  moodboard: [],
};

// ─── SENSORY MODALITIES DATABASE ─────────────────────────────────
// 22 modalities across 5 categories

export const MODALITIES: SensoryModality[] = [
  // ═══ ELECTROMAGNETIC (6) ═══════════════════════════════════════

  {
    id: "uv-vision",
    name: "UV Vision",
    category: "electromagnetic",
    description:
      "Detection of ultraviolet wavelengths (10–400nm). Reveals UV-reflective markings, mineral fluorescence, and atmospheric conditions invisible to visible-light species.",
    spectrumRange: "10–400nm",
    requirements: {
      medium: ["terrestrial", "aerial", "aquatic"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "medium",
      metabolicWeight: 0.15,
      complexity: "moderate",
      evolutionTime: "~100 million years",
      earthAnalogs: ["Bees", "Birds", "Mantis shrimp", "Reindeer"],
    },
    worldbuilding: {
      communication:
        "UV-reflective body patterns for hidden signaling; messages invisible to non-UV species",
      navigation:
        "Polarized UV patterns in atmosphere indicate solar position and direction",
      hunting:
        "UV-reflective urine trails and body secretions reveal prey movements",
      socialBehavior:
        "Hidden mating displays; status signals in the UV spectrum create a secret social layer",
      art: "Paintings with UV pigments; art with hidden layers only this species can perceive",
      architecture:
        "UV-filtering structures; buildings that reveal different patterns under UV light",
      technology:
        "UV-based optical computing; authentication and currency via UV signatures",
      mythology:
        "The Hidden Light—a secret truth visible only to the worthy or the initiated",
    },
  },

  {
    id: "visible-light",
    name: "Visible Light Vision",
    category: "electromagnetic",
    description:
      "Detection of electromagnetic radiation in the 400–700nm range. The baseline visual system for Earth-type organisms evolved under G-type stars.",
    spectrumRange: "400–700nm",
    requirements: {
      medium: ["terrestrial", "aerial", "aquatic"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "medium",
      metabolicWeight: 0.15,
      complexity: "moderate",
      evolutionTime: "~500 million years (from simple photoreception)",
      earthAnalogs: ["Most vertebrates", "Cephalopods", "Arthropods"],
    },
    worldbuilding: {
      communication:
        "Color-based signaling, facial expressions, written language, visual art",
      navigation: "Landmark recognition, celestial navigation, map-making",
      hunting: "Visual tracking, camouflage detection, depth perception",
      socialBehavior:
        "Body language, visual status displays, fashion and adornment",
      art: "Painting, sculpture, cinema—the foundations of visual culture",
      architecture:
        "Windows, lighting design, visual aesthetics, monumental structures",
      technology:
        "Optics, telescopes, microscopes, photography, screens, lasers",
      mythology:
        "Light vs darkness as fundamental moral and cosmological framework",
    },
  },

  {
    id: "ir-vision",
    name: "Infrared Vision",
    category: "electromagnetic",
    description:
      "Detection of near-infrared to mid-infrared wavelengths (700nm–5μm). Optimal for species evolving under cool K/M-class stars where stellar output peaks in IR.",
    spectrumRange: "700nm–5μm",
    requirements: {
      medium: ["terrestrial", "aerial", "aquatic"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "medium",
      metabolicWeight: 0.15,
      complexity: "moderate",
      evolutionTime: "~150 million years",
      earthAnalogs: [
        "Pit vipers",
        "Some beetles",
        "Vampire bats (limited IR)",
      ],
    },
    worldbuilding: {
      communication:
        "Heat-based emotional displays; 'blushing' patterns visible as thermal signatures",
      navigation:
        "Warm objects visible in darkness; landscape reads as a thermal map",
      hunting:
        "Warm-blooded prey glows against cool backgrounds; no hiding in darkness",
      socialBehavior:
        "Emotional states literally visible as heat patterns; lying becomes harder",
      art: "Thermal gradient compositions; heat-based sculptures that shift over time",
      architecture:
        "Buildings designed for thermal signatures; heating elements as decorative features",
      technology:
        "Thermal optics as default; visible-light technology may never develop",
      mythology:
        "The Warm Truth—heat as metaphor for life, cold as death or deception",
    },
  },

  {
    id: "thermal-imaging",
    name: "Thermal Imaging",
    category: "electromagnetic",
    description:
      "Detection of far-infrared thermal radiation (8–14μm). Creates heat maps of the environment. High metabolic cost due to specialized detector arrays requiring cooling.",
    spectrumRange: "8–14μm (thermal IR)",
    requirements: {
      medium: ["terrestrial", "aerial", "subsurface"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "high",
      metabolicWeight: 0.25,
      complexity: "complex",
      evolutionTime: "~200 million years",
      earthAnalogs: ["Pit vipers (pit organs)", "Some pythons"],
    },
    worldbuilding: {
      communication:
        "Complex thermal pattern displays on body surfaces; 'heat language'",
      navigation:
        "Complete darkness navigation via thermal landscape mapping",
      hunting:
        "Prey detection through walls and vegetation; thermal tracking",
      socialBehavior:
        "Fever and emotional arousal immediately visible; privacy is alien concept",
      art: "Thermal performance art; body-heat choreography; warm/cool media",
      architecture:
        "Thermally transparent walls; heated art installations; building warmth as beauty",
      technology:
        "Thermal computing and display; infrared communication networks",
      mythology:
        "The Great Warmth—creation myths centered on heat as the source of all things",
    },
  },

  {
    id: "passive-electroreception",
    name: "Passive Electroreception",
    category: "electromagnetic",
    description:
      "Detection of external electric fields generated by muscle contractions, neural activity, or bioelectric processes in other organisms. Requires a conductive medium.",
    spectrumRange: "DC to low-frequency fields",
    requirements: {
      medium: ["aquatic"],
      atmosphereRequired: false,
      conductiveMedium: true,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~100 million years",
      earthAnalogs: ["Sharks", "Rays", "Platypus", "Electric catfish"],
    },
    worldbuilding: {
      communication:
        "Bioelectric 'auras' convey emotional state and health; deception requires masking one's field",
      navigation:
        "Detection of Earth's electromagnetic field for orientation in murky water",
      hunting:
        "Prey cannot hide—heartbeats and muscle twitches betray location through any barrier",
      socialBehavior:
        "Hierarchy read through bioelectric field strength; dominance is literally felt",
      art: "Bioelectric compositions performed by living organisms; field harmonics as music",
      architecture:
        "Electrically shielded private spaces; conductive pathways as public corridors",
      technology:
        "Bioelectric interfaces; technology operated by thought-generated fields",
      mythology:
        "The Living Current—all life connected through an invisible electric web",
    },
  },

  {
    id: "active-electroreception",
    name: "Active Electroreception",
    category: "electromagnetic",
    description:
      "Generation and detection of self-produced electric fields. Objects distort the field, creating a 3D 'electric image' of the environment. Requires aquatic or highly conductive medium.",
    spectrumRange: "Self-generated fields (100 Hz–10 kHz)",
    requirements: {
      medium: ["aquatic"],
      atmosphereRequired: false,
      conductiveMedium: true,
    },
    evolution: {
      metabolicCost: "extreme",
      metabolicWeight: 0.4,
      complexity: "extreme",
      evolutionTime: "~250 million years",
      earthAnalogs: [
        "Electric eels",
        "Elephant fish",
        "Black ghost knifefish",
      ],
    },
    worldbuilding: {
      communication:
        "Electric field modulation as speech; 'volume' = field strength, 'tone' = frequency",
      navigation:
        "Complete environmental imaging in zero visibility; sonar-like but electric",
      hunting:
        "Active scanning reveals hidden prey; no camouflage works against electric imaging",
      socialBehavior:
        "Jamming avoidance responses; personal 'frequency' as identity marker",
      art: "Electric field sculptures; interference pattern art created by multiple performers",
      architecture:
        "Buildings shaped to create pleasing field distortion patterns",
      technology:
        "Electric field manipulation tools; 'sculpting' reality through field generation",
      mythology:
        "The Shaping Field—creation as an act of electrical will imposing form on chaos",
    },
  },

  // ═══ MECHANICAL (6) ════════════════════════════════════════════

  {
    id: "infrasonic-hearing",
    name: "Infrasonic Hearing",
    category: "mechanical",
    description:
      "Detection of sound frequencies below 20 Hz. Infrasound travels vast distances and penetrates obstacles. Favored by dense atmospheres and large organisms.",
    spectrumRange: "<20 Hz",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial"],
      atmosphereRequired: true,
      minPressure: 0.5,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~80 million years",
      earthAnalogs: ["Elephants", "Whales", "Pigeons", "Tigers"],
    },
    worldbuilding: {
      communication:
        "Long-distance communication spanning kilometers; 'rumble speech' felt more than heard",
      navigation:
        "Detection of storms, volcanic activity, and ocean waves from hundreds of kilometers",
      hunting:
        "Prey footsteps detected through ground vibrations at great distance",
      socialBehavior:
        "Group coordination across vast territories; communal 'songs' that carry for miles",
      art: "Subsonic musical traditions; architecture that resonates at infrasonic frequencies",
      architecture:
        "Resonance chambers; buildings tuned to amplify or dampen infrasound",
      technology:
        "Infrasonic communication networks; seismographic early-warning systems",
      mythology:
        "The Deep Voice—the world itself speaks in tones only the wise can hear",
    },
  },

  {
    id: "standard-hearing",
    name: "Standard Hearing",
    category: "mechanical",
    description:
      "Detection of acoustic waves in the 20 Hz–20 kHz range. Requires a gaseous or liquid medium for sound propagation. The basis for spoken language in Earth species.",
    spectrumRange: "20 Hz–20 kHz",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial"],
      atmosphereRequired: true,
      minPressure: 0.1,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~300 million years",
      earthAnalogs: ["Most mammals", "Birds", "Frogs", "Fish"],
    },
    worldbuilding: {
      communication:
        "Spoken language, music, vocal emotion; the foundation of oral culture",
      navigation:
        "Sound localization; echo awareness for spatial orientation",
      hunting:
        "Listening for prey movements; ambush predation aided by acute hearing",
      socialBehavior:
        "Vocal social bonding; laughter, singing, warning calls, group chanting",
      art: "Music, poetry, oral storytelling, theater, radio, podcasts",
      architecture:
        "Acoustic design; concert halls, soundproofing, resonant spaces",
      technology:
        "Telecommunications, sonar, audio recording, speech synthesis",
      mythology:
        "The Word—creation through spoken command; naming things gives power over them",
    },
  },

  {
    id: "ultrasonic-hearing",
    name: "Ultrasonic Hearing",
    category: "mechanical",
    description:
      "Detection of acoustic frequencies above 20 kHz. Enables perception of high-frequency environmental sounds and communication above most species' hearing range.",
    spectrumRange: ">20 kHz (up to 200 kHz)",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial"],
      atmosphereRequired: true,
      minPressure: 0.3,
    },
    evolution: {
      metabolicCost: "medium",
      metabolicWeight: 0.15,
      complexity: "moderate",
      evolutionTime: "~100 million years",
      earthAnalogs: ["Dogs", "Cats", "Bats", "Dolphins", "Rodents"],
    },
    worldbuilding: {
      communication:
        "Secret ultrasonic speech inaudible to most species; private conversations in public",
      navigation:
        "High-resolution sound localization; fine-grained spatial awareness",
      hunting:
        "Detection of high-frequency prey movements (rustling, squeaking)",
      socialBehavior:
        "Dual-channel communication: public speech + private ultrasonic commentary",
      art: "Ultrasonic music with harmonics beyond human perception; layered compositions",
      architecture:
        "Ultrasonic-absorbing materials for privacy; reflective surfaces for amplification",
      technology:
        "Ultrasonic cleaning, welding, medical imaging—developed intuitively",
      mythology:
        "The Silent Song—truths spoken in frequencies only the chosen can hear",
    },
  },

  {
    id: "echolocation",
    name: "Active Echolocation",
    category: "mechanical",
    description:
      "Emission and reception of sound pulses to construct a 3D model of the environment. High metabolic cost but provides vision-independent spatial awareness.",
    spectrumRange: "20 kHz–200 kHz (emitted pulses)",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial"],
      atmosphereRequired: true,
      minPressure: 0.3,
    },
    evolution: {
      metabolicCost: "high",
      metabolicWeight: 0.25,
      complexity: "complex",
      evolutionTime: "~60 million years",
      earthAnalogs: [
        "Bats (microchiroptera)",
        "Dolphins",
        "Toothed whales",
        "Oilbirds",
        "Shrews",
      ],
    },
    worldbuilding: {
      communication:
        "Shape-descriptions embedded in echo calls; 'showing' objects by sonifying them",
      navigation:
        "Complete spatial awareness in total darkness; 3D mental maps from sound",
      hunting:
        "Prey tracked by echo signature; speed, size, and density all revealed by returns",
      socialBehavior:
        "No visual privacy—body shape, posture, even internal organs partially 'visible' via echoes",
      art: "Acoustic sculpture; architecture as the primary art form since buildings shape sound",
      architecture:
        "The most important art—spaces designed for how they sound, not how they look",
      technology:
        "Sonar, acoustic imaging, and ultrasonic tools developed as natural extensions of perception",
      mythology:
        "The Singing World—reality is sound; silence is void, oblivion, non-existence",
    },
  },

  {
    id: "vibration-sense",
    name: "Seismic/Vibration Sense",
    category: "mechanical",
    description:
      "Detection of mechanical vibrations transmitted through solid substrates. Requires contact with a solid surface. Independent of atmospheric conditions.",
    spectrumRange: "Ground waves (0.1 Hz–1 kHz)",
    requirements: {
      medium: ["terrestrial", "subsurface", "aquatic"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "simple",
      evolutionTime: "~50 million years",
      earthAnalogs: [
        "Spiders",
        "Scorpions",
        "Elephants (foot vibrations)",
        "Snakes",
        "Moles",
      ],
    },
    worldbuilding: {
      communication:
        "Drum-speech through stomping patterns; tapping codes; vibration-language",
      navigation:
        "Footfall mapping of terrain; detection of water sources and caves underground",
      hunting:
        "Prey detected by ground vibrations; footsteps tracked through solid substrate",
      socialBehavior:
        "Greeting rituals involving ground contact; communal stomping as bonding",
      art: "Percussion music; vibration-art installations; tactile compositions",
      architecture:
        "Vibration-conductive floors; buildings designed to transmit or dampen ground signals",
      technology:
        "Seismographic instruments; vibration-based communication networks",
      mythology:
        "The Drum of the World—the planet's heartbeat is literally perceived",
    },
  },

  {
    id: "pressure-sense",
    name: "Pressure Sensitivity",
    category: "mechanical",
    description:
      "Detection of pressure gradients and fluid flow patterns in gaseous or liquid media. Enables awareness of wind, currents, and the passage of nearby objects.",
    spectrumRange: "Pressure gradients in fluid media",
    requirements: {
      medium: ["aquatic", "aerial", "terrestrial"],
      atmosphereRequired: true,
      minPressure: 0.01,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "simple",
      evolutionTime: "~400 million years",
      earthAnalogs: [
        "Fish (lateral line)",
        "Cephalopods",
        "Many aquatic invertebrates",
      ],
    },
    worldbuilding: {
      communication:
        "Gesture-based language using air displacement; 'pressure speech' in dense atmospheres",
      navigation:
        "Current-mapping; wind pattern awareness; detection of obstacles by pressure shadow",
      hunting:
        "Wake detection—prey movements tracked by the pressure waves they leave behind",
      socialBehavior:
        "Personal space defined by detectable pressure boundary; crowding is literally uncomfortable",
      art: "Wind instruments; flow-art; fountain design; atmospheric choreography",
      architecture:
        "Aerodynamic buildings; ventilation as aesthetic; wind-channels as corridors",
      technology:
        "Fluid dynamics mastered early; weather prediction as intuitive skill",
      mythology:
        "The Breath of the World—atmospheric currents as the living breath of the planet",
    },
  },

  // ═══ CHEMICAL (4) ══════════════════════════════════════════════

  {
    id: "airborne-smell",
    name: "Airborne Olfaction",
    category: "chemical",
    description:
      "Detection of volatile molecules carried through a gaseous atmosphere. Provides information about distant objects, food sources, predators, and mates.",
    spectrumRange: "Volatile molecules (gaseous phase)",
    requirements: {
      medium: ["terrestrial", "aerial"],
      atmosphereRequired: true,
      minPressure: 0.01,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~500 million years",
      earthAnalogs: ["Dogs", "Bears", "Moths", "Snakes (Jacobson's organ)"],
    },
    worldbuilding: {
      communication:
        "Pheromonal language; scent-marks as territory claims; emotional state broadcast via body chemistry",
      navigation:
        "Scent trails for pathfinding; wind-borne odor gradients reveal distant landscapes",
      hunting:
        "Prey tracked by scent trail; age and health of prey deduced from chemical signature",
      socialBehavior:
        "Chemical identity—individuals recognized by unique scent profile; kinship detection",
      art: "Perfumery as high art; scent-compositions; olfactory concerts and galleries",
      architecture:
        "Scent-zoning in buildings; fragrance gardens; chemical privacy screens",
      technology:
        "Chemical analysis as intuitive skill; early pharmaceutical development",
      mythology:
        "The Essence—each being has a unique chemical soul; scent as spiritual identity",
    },
  },

  {
    id: "aquatic-smell",
    name: "Aquatic Chemoreception",
    category: "chemical",
    description:
      "Detection of dissolved molecules in liquid media. Provides chemical mapping of the aquatic environment, detecting food, predators, and mates over long distances.",
    spectrumRange: "Dissolved molecules (liquid phase)",
    requirements: {
      medium: ["aquatic"],
      atmosphereRequired: false,
      liquidRequired: true,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~600 million years",
      earthAnalogs: ["Salmon", "Sharks", "Lobsters", "Catfish"],
    },
    worldbuilding: {
      communication:
        "Chemical trail-messages left in water; conversation as molecular cloud exchange",
      navigation:
        "Home-finding via chemical memory of water composition; current-tracing",
      hunting:
        "Blood and stress chemicals detected at parts-per-billion; wounded prey tracked across oceans",
      socialBehavior:
        "Territory marked by chemical boundary; social rank broadcast through pheromone concentration",
      art: "Chemical composition art; 'flavor paintings' dissolved into water; taste-poetry",
      architecture:
        "Chemical barriers and corridors; buildings that filter or concentrate dissolved compounds",
      technology:
        "Chemistry and pharmacology as foundational sciences; molecular engineering",
      mythology:
        "The Taste of Truth—knowledge gained by literally tasting the world's history dissolved in water",
    },
  },

  {
    id: "taste",
    name: "Contact Gustation",
    category: "chemical",
    description:
      "Detection of molecules through direct physical contact. Provides detailed chemical analysis of surfaces, food, and objects touched.",
    spectrumRange: "Surface molecules (contact)",
    requirements: {
      medium: ["terrestrial", "aquatic", "subsurface"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "simple",
      evolutionTime: "~700 million years (one of the oldest senses)",
      earthAnalogs: [
        "All vertebrates",
        "Flies (foot-tasting)",
        "Catfish (body-surface taste)",
        "Octopuses (arm-tasting)",
      ],
    },
    worldbuilding: {
      communication:
        "Touch-language incorporating chemical messages; handshake conveys identity and health",
      navigation:
        "Surface-licking or foot-tasting to read chemical trails left by others",
      hunting:
        "Prey identified by chemical residue on surfaces; tracking by taste-trail",
      socialBehavior:
        "Greeting rituals involving taste-contact; food-sharing as deep social bond",
      art: "Culinary art as the highest form; surface-texture compositions; flavor architecture",
      architecture:
        "Buildings with deliberately flavored surfaces; taste-maps embedded in walls",
      technology:
        "Materials science driven by tactile-chemical analysis; early toxicology",
      mythology:
        "The First Knowing—the most ancient sense; to taste is to truly understand",
    },
  },

  {
    id: "distance-chemoreception",
    name: "Distance Chemoreception",
    category: "chemical",
    description:
      "Highly sensitive detection of chemical concentration gradients in fluid media. Enables precise distance estimation and directional tracking of chemical sources.",
    spectrumRange: "Concentration gradients in fluid",
    requirements: {
      medium: ["aquatic", "aerial", "terrestrial"],
      atmosphereRequired: true,
      minPressure: 0.1,
    },
    evolution: {
      metabolicCost: "medium",
      metabolicWeight: 0.15,
      complexity: "complex",
      evolutionTime: "~200 million years",
      earthAnalogs: [
        "Mosquitoes (CO₂ gradient tracking)",
        "Sea turtles",
        "Salmon (ppm-level detection)",
      ],
    },
    worldbuilding: {
      communication:
        "Chemical broadcasting with distance encoding; proximity detected by concentration",
      navigation:
        "Chemical gradient maps of the environment; 'smelling' the shape of a landscape",
      hunting:
        "Prey distance and direction derived from concentration gradients; 3D chemical tracking",
      socialBehavior:
        "Social distance regulation by chemical zones; crowding detected chemically",
      art: "Gradient art—chemical compositions that create spatial experiences as you move through them",
      architecture:
        "Buildings with chemical zoning; rooms that smell differently at different positions",
      technology:
        "Chemical gradient computers; concentration-based measurement and sensing instruments",
      mythology:
        "The Scent Map—the universe has a chemical topology; every place has its unique signature",
    },
  },

  // ═══ MAGNETIC & THERMAL (3) ════════════════════════════════════

  {
    id: "magnetoreception",
    name: "Magnetic Field Sense",
    category: "magnetic-thermal",
    description:
      "Detection of planetary magnetic field lines and local magnetic anomalies. Provides compass-like directional information and potentially a map sense based on field intensity.",
    spectrumRange: "Planetary magnetic field (0.01–10 Gauss)",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial", "subsurface"],
      atmosphereRequired: false,
      magneticFieldRequired: true,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~100 million years",
      earthAnalogs: [
        "Migratory birds",
        "Sea turtles",
        "Salmon",
        "Honeybees",
        "Lobsters",
      ],
    },
    worldbuilding: {
      communication:
        "Directional references always absolute ('north-ward') rather than relative ('left')",
      navigation:
        "Innate compass sense; magnetic pole as permanent reference point; never truly lost",
      hunting:
        "Prey tracked by magnetic disturbance they create moving through the field",
      socialBehavior:
        "Meeting places defined by magnetic coordinates; migration as cultural pilgrimage",
      art: "Magnetic field visualization art; lodestone sculptures; compass-based geometric patterns",
      architecture:
        "Buildings aligned to magnetic poles; magnetic-field-shaping structures",
      technology:
        "Magnetic manipulation as intuitive skill; early development of electromagnetic technology",
      mythology:
        "The Great Alignment—the magnetic poles as sacred directions; field lines as spiritual paths",
    },
  },

  {
    id: "thermoreception",
    name: "Temperature Sense",
    category: "magnetic-thermal",
    description:
      "Detection of thermal gradients and absolute temperature through specialized receptors. Universal among complex organisms on worlds with temperature variation.",
    spectrumRange: "Thermal gradients (contact and near-field)",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial", "subsurface"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "simple",
      evolutionTime: "~600 million years",
      earthAnalogs: [
        "All vertebrates",
        "Many invertebrates",
        "Fire beetles (IR detection)",
      ],
    },
    worldbuilding: {
      communication:
        "Temperature-based emotional signaling; warmth as affection, cold as hostility",
      navigation:
        "Thermal gradient following for habitat selection; geothermal source detection",
      hunting: "Warm-blooded prey detection at close range; thermal trail following",
      socialBehavior:
        "Huddling behavior; shared warmth as social bonding; thermal comfort as status",
      art: "Thermal-medium art; heated/cooled sculptures; temperature as aesthetic dimension",
      architecture:
        "Precise thermal zoning in buildings; warmth gradients as design feature",
      technology:
        "Thermodynamics as intuitive science; early temperature-control technology",
      mythology:
        "The Balance—existence as equilibrium between warmth (life) and cold (entropy)",
    },
  },

  {
    id: "hygroreception",
    name: "Humidity Sense",
    category: "magnetic-thermal",
    description:
      "Detection of water vapor concentration in the atmosphere. Enables prediction of weather changes and location of water sources in arid environments.",
    spectrumRange: "Atmospheric water vapor concentration",
    requirements: {
      medium: ["terrestrial", "aerial"],
      atmosphereRequired: true,
      minPressure: 0.01,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "simple",
      evolutionTime: "~200 million years",
      earthAnalogs: [
        "Many insects",
        "Arachnids (ticks, spiders)",
        "Some crustaceans",
      ],
    },
    worldbuilding: {
      communication:
        "Humidity-modulated signals; moist breath as greeting; dry/wet states convey meaning",
      navigation:
        "Water source detection from kilometers away; weather prediction hours in advance",
      hunting:
        "Prey respiration detected by local humidity increase; hiding prey 'steams'",
      socialBehavior:
        "Gathering at optimal humidity zones; seasonal migrations following moisture fronts",
      art: "Mist art; humidity-reactive materials; fog sculptures; dew-pattern design",
      architecture:
        "Humidity-controlled environments; water-feature architecture; condensation gardens",
      technology:
        "Water harvesting technology; atmospheric water generators; desert agriculture",
      mythology:
        "The Breath of Life—water vapor as the medium of the divine; rain as blessing",
    },
  },

  // ═══ OTHER (3) ═════════════════════════════════════════════════

  {
    id: "temporal-sense",
    name: "Temporal Sense",
    category: "other",
    description:
      "Precise internal timekeeping calibrated to environmental cycles (day/night, tidal, seasonal). Goes beyond simple circadian rhythm to provide conscious time awareness.",
    spectrumRange: "Environmental periodicities",
    requirements: {
      medium: [
        "terrestrial",
        "aquatic",
        "aerial",
        "subsurface",
        "vacuum-interface",
      ],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~300 million years",
      earthAnalogs: [
        "Humans (circadian clock)",
        "Migratory birds (seasonal timing)",
        "Fiddler crabs (tidal clock)",
      ],
    },
    worldbuilding: {
      communication:
        "Time-stamped messages; duration as a grammatical feature; tense precision",
      navigation:
        "Dead reckoning using precise internal clock; celestial navigation without instruments",
      hunting:
        "Optimal timing of ambush; prey schedule prediction; patience calibrated precisely",
      socialBehavior:
        "Punctuality as biological imperative; time-sharing protocols; generational memory",
      art: "Temporal art—compositions experienced through duration; time-based media as instinct",
      architecture:
        "Buildings designed around temporal rhythms; light-changing spaces; seasonal buildings",
      technology:
        "Clockwork technology; precise scheduling systems; chronometry as natural extension",
      mythology:
        "The Eternal Rhythm—time is not abstract but directly perceived; cycles as sacred patterns",
    },
  },

  {
    id: "polarized-light",
    name: "Polarized Light Detection",
    category: "other",
    description:
      "Detection of the polarization plane of light waves. Reveals surface properties, atmospheric conditions, and underwater depth information invisible to standard vision.",
    spectrumRange: "Polarization plane of visible/UV light",
    requirements: {
      medium: ["terrestrial", "aquatic", "aerial"],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "medium",
      metabolicWeight: 0.15,
      complexity: "moderate",
      evolutionTime: "~150 million years",
      earthAnalogs: [
        "Mantis shrimp",
        "Cuttlefish",
        "Many insects",
        "Some spiders",
      ],
    },
    worldbuilding: {
      communication:
        "Polarization-pattern displays on body surfaces; hidden messages in reflected light",
      navigation:
        "Sky polarization compass; underwater depth estimation; cloud-cover navigation",
      hunting:
        "Transparent or camouflaged prey revealed by polarization signature mismatch",
      socialBehavior:
        "Polarization-based status displays invisible to non-polarizing species; secret signals",
      art: "Polarization art visible only to this species; dual-layer compositions",
      architecture:
        "Polarizing windows and surfaces; buildings that filter light by polarization",
      technology:
        "Polarimetric imaging; stress analysis of materials; quality control by sight",
      mythology:
        "The Hidden Patterns—truth has a structure that only the perceptive can see",
    },
  },

  {
    id: "gravity-sense",
    name: "Gravitational Sense",
    category: "other",
    description:
      "Precise detection of gravitational field strength and direction. Goes beyond vestibular balance to include awareness of tidal forces and gravitational anomalies.",
    spectrumRange: "Gravitational field vector",
    requirements: {
      medium: [
        "terrestrial",
        "aquatic",
        "aerial",
        "subsurface",
        "vacuum-interface",
      ],
      atmosphereRequired: false,
    },
    evolution: {
      metabolicCost: "low",
      metabolicWeight: 0.05,
      complexity: "moderate",
      evolutionTime: "~500 million years (from basic vestibular systems)",
      earthAnalogs: [
        "All vertebrates (vestibular system)",
        "Jellyfish (statocysts)",
        "Crayfish",
      ],
    },
    worldbuilding: {
      communication:
        "Spatial relationships described gravitationally; 'downward' always meaningful",
      navigation:
        "Precise awareness of gravity direction; mass detection; underground cavity sensing",
      hunting:
        "Prey mass and movement detected through subtle gravitational shifts (at extreme sensitivity)",
      socialBehavior:
        "Height and mass carry social significance; gravitational dominance",
      art: "Kinetic sculpture interacting with gravity; weight-based compositions",
      architecture:
        "Gravity-optimized structures; buildings that play with weight distribution",
      technology:
        "Gravitational engineering; mass-detection instruments; early inertial navigation",
      mythology:
        "The Great Pull—gravity as the fundamental force of connection binding all things together",
    },
  },
];

// ─── Helper: get modality by ID ──────────────────────────────────

export function getModalityById(id: string): SensoryModality | undefined {
  return MODALITIES.find((m) => m.id === id);
}

// ─── Helper: get modalities by category ──────────────────────────

export function getModalitiesByCategory(
  category: ModalityCategory
): SensoryModality[] {
  return MODALITIES.filter((m) => m.category === category);
}
