// Xenomythology Framework Builder - Data Constants

// Section 1: Species Biology & Psychology

export const SENSORY_MODALITIES = [
  { id: "visual-visible", name: "Visual (Visible Spectrum)", description: "Electromagnetic perception in human-visible range" },
  { id: "visual-infrared", name: "Visual (Infrared)", description: "Heat/thermal radiation perception" },
  { id: "visual-ultraviolet", name: "Visual (Ultraviolet)", description: "High-frequency light perception" },
  { id: "auditory-air", name: "Auditory (Air Vibrations)", description: "Sound perception through atmosphere" },
  { id: "auditory-substrate", name: "Auditory (Water/Substrate)", description: "Vibration sensing through liquid or solid media" },
  { id: "chemical-olfactory", name: "Chemical/Olfactory (Airborne)", description: "Scent detection at a distance" },
  { id: "chemical-gustatory", name: "Chemical/Gustatory (Contact)", description: "Taste/chemical sensing through direct contact" },
  { id: "electromagnetic", name: "Electromagnetic (Field Sensing)", description: "Direct sensing of electric/magnetic fields like electroreception" },
  { id: "magnetic", name: "Magnetic (Geomagnetic)", description: "Sensing planetary magnetic field for navigation" },
  { id: "tactile", name: "Tactile/Pressure", description: "Touch and pressure sensation" },
  { id: "echolocation", name: "Echolocation/Active Sonar", description: "Emitting and receiving sound for spatial mapping" },
  { id: "thermal", name: "Thermal/Temperature Gradients", description: "Direct temperature sensing beyond infrared vision" },
  { id: "gravitational", name: "Gravitational/Acceleration", description: "Sensing gravity and motion changes" },
  { id: "temporal", name: "Temporal (Direct Time Perception)", description: "Unusual direct perception of time passage" },
  { id: "quantum", name: "Quantum (Entanglement Sensing)", description: "Speculative: sensing quantum states" },
];

export const SENSORY_INTEGRATION_STYLES = [
  { id: "sequential", name: "Sequential Processing", description: "One sense at a time dominates attention" },
  { id: "parallel", name: "Parallel Processing", description: "Multiple senses simultaneously, equally weighted" },
  { id: "hierarchical", name: "Hierarchical", description: "One sense dominates, others provide context" },
  { id: "synesthetic", name: "Synesthetic", description: "Senses fundamentally blended - cannot be separated" },
  { id: "contextual", name: "Contextual Switching", description: "Different senses dominate in different situations" },
];

export const SENSORY_RANGES = [
  { id: "hyperaware", name: "Hyperaware", description: "Perceive far more than needed for survival" },
  { id: "well-matched", name: "Well-Matched", description: "Senses align with environmental complexity" },
  { id: "limited", name: "Limited", description: "Important environmental features undetectable" },
];

export const BODY_PLANS = [
  { id: "bilateral", name: "Bilateral Symmetry", description: "Mirror symmetry with left/right sides" },
  { id: "radial", name: "Radial Symmetry", description: "Like starfish - symmetry around a central axis" },
  { id: "spiral", name: "Spiral/Helical", description: "Coiled or twisted body structure" },
  { id: "asymmetric-consistent", name: "Asymmetric but Consistent", description: "No symmetry but predictable form" },
  { id: "asymmetric-variable", name: "Asymmetric and Variable", description: "Form varies between individuals" },
  { id: "modular", name: "Modular/Colonial", description: "Multiple connected units forming whole" },
  { id: "fractal", name: "Fractal/Self-Similar", description: "Same patterns at different scales" },
];

export const MOVEMENT_MODES = [
  { id: "bipedal", name: "Terrestrial Walking (Bipedal)", description: "Two-legged locomotion" },
  { id: "quadrupedal", name: "Terrestrial Walking (Quadrupedal)", description: "Four-legged locomotion" },
  { id: "hexapedal", name: "Terrestrial Walking (Hexapedal+)", description: "Six or more legs" },
  { id: "swimming", name: "Swimming/Aquatic", description: "Propulsion through liquid medium" },
  { id: "flight", name: "Powered Flight", description: "Self-powered aerial locomotion" },
  { id: "gliding", name: "Gliding", description: "Unpowered aerial movement" },
  { id: "burrowing", name: "Burrowing/Tunneling", description: "Movement through substrate" },
  { id: "climbing", name: "Climbing/Arboreal", description: "Vertical surface locomotion" },
  { id: "sessile", name: "Sessile (Non-Moving)", description: "Stationary in adult form" },
  { id: "jet", name: "Jet Propulsion", description: "Fluid expulsion for movement" },
];

export const LIMB_ARRANGEMENTS = [
  { id: "bilateral-pairs", name: "Bilateral Pair(s)", description: "Matched left/right limbs" },
  { id: "radial-array", name: "Radial Array", description: "Limbs arranged around central axis" },
  { id: "tentacles", name: "Tentacles/Flexible Appendages", description: "Boneless, flexible manipulators" },
  { id: "fractal-branching", name: "Fractal Branching", description: "Limbs that branch into smaller limbs" },
  { id: "no-limbs", name: "No Discrete Limbs", description: "Whole body manipulation" },
];

export const LIFESPAN_CATEGORIES = [
  { id: "very-short", name: "Very Short", description: "Less than 5 Earth years" },
  { id: "short", name: "Short", description: "5-20 years" },
  { id: "moderate", name: "Moderate", description: "20-100 years" },
  { id: "long", name: "Long", description: "100-500 years" },
  { id: "extreme", name: "Extreme", description: "500-2000 years" },
  { id: "indefinite", name: "Indefinite", description: "No natural senescence" },
];

export const DEVELOPMENTAL_STAGES = [
  { id: "direct", name: "Direct Development", description: "Born essentially adult" },
  { id: "simple", name: "Simple Maturation", description: "Gradual growth without transformation" },
  { id: "metamorphosis", name: "Metamorphosis", description: "Radical transformation like caterpillar/butterfly" },
  { id: "multiple-metamorphosis", name: "Multiple Metamorphoses", description: "Several distinct transformations" },
  { id: "modular-addition", name: "Modular Addition", description: "Add body segments over time" },
];

export const REPRODUCTION_STRATEGIES = [
  { id: "sexual-two", name: "Sexual (Two-Parent)", description: "Standard binary sexual reproduction" },
  { id: "sexual-multi", name: "Sexual (Three+ Parent)", description: "Requires genetic material from multiple individuals" },
  { id: "asexual", name: "Asexual/Cloning", description: "Single-parent reproduction" },
  { id: "budding", name: "Budding/Division", description: "New individuals grow from parent body" },
  { id: "parthenogenesis", name: "Parthenogenesis", description: "Sexual anatomy, asexual reproduction" },
  { id: "hermaphroditic", name: "Hermaphroditic", description: "All individuals can fulfill any reproductive role" },
  { id: "sequential-hermaphrodite", name: "Sequential Hermaphroditism", description: "Change sex during lifetime" },
  { id: "spore", name: "Spore-Based", description: "Reproduction via dormant spores" },
];

export const OFFSPRING_INVESTMENT = [
  { id: "high", name: "High Parental Investment", description: "Few offspring, much care" },
  { id: "low", name: "Low Parental Investment", description: "Many offspring, little care" },
  { id: "multi-generational", name: "Extended Multi-Generational", description: "Grandparents help raise young" },
  { id: "communal", name: "Communal Raising", description: "Community raises all offspring" },
  { id: "none", name: "No Parental Care", description: "Offspring independent from birth" },
];

export const CONSCIOUSNESS_TYPES = [
  { id: "individual", name: "Individual Discrete Minds", description: "Separate, bounded consciousnesses" },
  { id: "hive", name: "Hive/Collective Consciousness", description: "True shared mind across individuals" },
  { id: "networked", name: "Networked Individual Minds", description: "Separate but interconnected" },
  { id: "distributed", name: "Distributed Consciousness", description: "Awareness spread across environment" },
  { id: "emergent", name: "Emergent Consciousness", description: "Arises from colony but no individual consciousness" },
  { id: "fluid", name: "Fluid Consciousness", description: "Sometimes individual, sometimes merged" },
];

export const MEMORY_ARCHITECTURES = [
  { id: "individual-only", name: "Individual Memory Only", description: "Each mind stores its own experiences" },
  { id: "individual-cultural", name: "Individual + Cultural Transmission", description: "Personal memory plus learned knowledge" },
  { id: "genetic", name: "Genetic/Instinctual Memory", description: "Information encoded in genetics" },
  { id: "direct-transfer", name: "Direct Memory Transfer", description: "Can share memories between individuals" },
  { id: "external", name: "External/Environmental Storage", description: "Memory stored outside the body" },
  { id: "ancestral", name: "Ancestral Memory", description: "Access to ancestors' experiences" },
  { id: "collective", name: "Collective Memory", description: "All individuals access shared memory" },
];

export const COGNITIVE_STRENGTHS = [
  { id: "pattern-recognition", name: "Pattern Recognition", description: "Finding regularities in data" },
  { id: "spatial-3d", name: "Spatial Reasoning (3D)", description: "Three-dimensional thinking" },
  { id: "spatial-4d", name: "Spatial Reasoning (4D+/Non-Euclidean)", description: "Higher-dimensional thinking" },
  { id: "temporal", name: "Temporal/Sequential Thinking", description: "Understanding time and sequences" },
  { id: "abstract", name: "Abstract Symbolization", description: "Working with symbols and concepts" },
  { id: "social", name: "Emotional/Social Intelligence", description: "Understanding other minds" },
  { id: "mathematical", name: "Mathematical/Logical Processing", description: "Formal reasoning" },
  { id: "memory", name: "Memory Storage/Recall", description: "Exceptional memory capacity" },
  { id: "multitasking", name: "Multi-tasking/Parallel Processing", description: "Simultaneous task handling" },
  { id: "simulation", name: "Simulation/Modeling", description: "Mental 'what-if' scenarios" },
  { id: "chemical", name: "Chemical/Molecular Processing", description: "Understanding chemical interactions" },
  { id: "quantum", name: "Quantum Computation", description: "Speculative: quantum-based cognition" },
];

export const SELF_AWARENESS_LEVELS = [
  { id: "basic", name: "Basic Self-Recognition", description: "Know self from other" },
  { id: "theory-of-mind", name: "Theory of Mind", description: "Understand others have minds" },
  { id: "metacognition", name: "Metacognition", description: "Thinking about thinking" },
  { id: "existential", name: "Existential Awareness", description: "Contemplate existence and meaning" },
  { id: "multi-level", name: "Multi-Level Awareness", description: "Simultaneously aware of self, group, and cosmos" },
];

// Section 2: Environmental Context

export const PLANET_TYPES = [
  { id: "rocky-terrestrial", name: "Rocky Terrestrial", description: "Earth-like rocky world" },
  { id: "super-earth", name: "Super-Earth", description: "High gravity rocky world" },
  { id: "low-gravity", name: "Low-Gravity Rocky", description: "Small rocky world with weak gravity" },
  { id: "ocean-world", name: "Ocean/Water World", description: "Global or dominant ocean coverage" },
  { id: "gas-giant-moon", name: "Gas Giant Moon", description: "Moon orbiting a gas giant" },
  { id: "ice-world", name: "Ice World", description: "Surface ice with potential subsurface ocean" },
  { id: "desert", name: "Desert/Arid", description: "Minimal surface water" },
  { id: "volcanic", name: "Volcanic/Geologically Active", description: "High tectonic/volcanic activity" },
  { id: "tidally-stressed", name: "Tidally Stressed", description: "Strong tidal forces from nearby body" },
];

export const ATMOSPHERIC_COMPOSITIONS = [
  { id: "oxygen-rich", name: "Oxygen-Rich", description: "Earth-like breathable atmosphere" },
  { id: "nitrogen-rich", name: "Nitrogen-Rich", description: "Dominated by nitrogen" },
  { id: "methane-rich", name: "Methane-Rich", description: "Methane as major component" },
  { id: "co2-rich", name: "Carbon Dioxide-Rich", description: "High CO2 concentration" },
  { id: "hydrogen-rich", name: "Hydrogen-Rich", description: "Light atmosphere, may escape to space" },
  { id: "thin", name: "Thin/Minimal Atmosphere", description: "Very low pressure" },
  { id: "none", name: "No Atmosphere", description: "Vacuum conditions" },
  { id: "toxic", name: "Toxic/Corrosive", description: "Chemically hazardous" },
];

export const DAY_NIGHT_CYCLES = [
  { id: "regular", name: "Regular Day/Night (8-30 hours)", description: "Earth-like rotation" },
  { id: "long", name: "Long Days (30-100 hours)", description: "Slow rotation" },
  { id: "extreme", name: "Extreme Days (100+ hours)", description: "Very slow rotation" },
  { id: "tidally-locked", name: "Tidally Locked", description: "Permanent day/night sides" },
  { id: "no-distinction", name: "No Day/Night Distinction", description: "Always lit, twilight, or dark" },
  { id: "chaotic", name: "Chaotic/Irregular", description: "Unpredictable lighting cycles" },
];

export const SEASONAL_VARIATIONS = [
  { id: "strong", name: "Strong Regular Seasons", description: "Pronounced, predictable seasons" },
  { id: "mild", name: "Mild Seasons", description: "Subtle seasonal changes" },
  { id: "none", name: "No Seasons", description: "Minimal axial tilt" },
  { id: "extreme", name: "Extreme Seasons", description: "High axial tilt" },
  { id: "chaotic", name: "Chaotic Seasons", description: "Elliptical orbit, binary stars, etc." },
];

export const STELLAR_ENVIRONMENTS = [
  { id: "g-class", name: "Single Yellow Star (G-class)", description: "Sun-like star" },
  { id: "k-class", name: "Single Orange Star (K-class)", description: "Cooler than Sun" },
  { id: "m-class", name: "Single Red Dwarf (M-class)", description: "Cool, long-lived star" },
  { id: "hot", name: "Single Blue/Hot Star (O/B/A)", description: "Hot, short-lived star" },
  { id: "binary", name: "Binary Star System", description: "Two stars orbiting each other" },
  { id: "multiple", name: "Multiple Star System (3+)", description: "Three or more stars" },
  { id: "rogue", name: "Rogue Planet", description: "No star - wandering through space" },
  { id: "galactic-core", name: "Near Galactic Core", description: "Dense star field" },
];

export const ENVIRONMENTAL_VOLATILITY = [
  { id: "extremely-stable", name: "Extremely Stable", description: "Millennia without major change" },
  { id: "stable", name: "Stable", description: "Predictable patterns" },
  { id: "moderate", name: "Moderately Variable", description: "Some environmental shifts" },
  { id: "high", name: "Highly Variable", description: "Frequent environmental shifts" },
  { id: "catastrophic", name: "Catastrophically Variable", description: "Regular extinction-level events" },
];

export const GEOGRAPHIC_DIVERSITY = [
  { id: "monotonous", name: "Monotonous", description: "Single biome across planet" },
  { id: "low", name: "Low Diversity", description: "2-3 major biomes" },
  { id: "moderate", name: "Moderate Diversity", description: "Similar to Earth" },
  { id: "high", name: "High Diversity", description: "Extreme variation" },
  { id: "fragmented", name: "Fragmented", description: "Isolated pockets of habitability" },
];

export const SURVIVAL_CHALLENGES = [
  { id: "predation-hunted", name: "Predation (Being Hunted)", description: "Risk of being prey" },
  { id: "predation-hunting", name: "Predation (Hunting)", description: "Challenges of food acquisition" },
  { id: "resource-food", name: "Resource Scarcity (Food)", description: "Limited food availability" },
  { id: "resource-water", name: "Resource Scarcity (Water/Liquids)", description: "Limited water availability" },
  { id: "resource-atmosphere", name: "Resource Scarcity (Breathable Atmosphere)", description: "Limited breathable air" },
  { id: "resource-energy", name: "Resource Scarcity (Energy/Warmth)", description: "Limited heat or energy" },
  { id: "extreme-temperature", name: "Environmental Extremes (Temperature)", description: "Dangerously hot or cold" },
  { id: "extreme-radiation", name: "Environmental Extremes (Radiation)", description: "Harmful radiation exposure" },
  { id: "extreme-pressure", name: "Environmental Extremes (Pressure)", description: "Crushing or vacuum conditions" },
  { id: "extreme-chemical", name: "Environmental Extremes (Chemical/Toxicity)", description: "Toxic environment" },
  { id: "competition-interspecies", name: "Competition with Other Species", description: "Other intelligent competitors" },
  { id: "competition-intraspecies", name: "Competition Within Species", description: "Internal competition" },
  { id: "catastrophe-predictable", name: "Seasonal Catastrophes (Predictable)", description: "Regular but expected disasters" },
  { id: "catastrophe-random", name: "Random Catastrophes (Unpredictable)", description: "Unexpected disasters" },
  { id: "disease", name: "Disease/Parasites", description: "Biological threats" },
  { id: "geological", name: "Geological Instability", description: "Earthquakes, volcanism, etc." },
  { id: "cosmic", name: "Cosmic Threats", description: "Asteroid impacts, stellar flares, etc." },
];

export const SOCIAL_STRUCTURE_EVOLUTION = [
  { id: "solitary-to-social", name: "Solitary → Social", description: "Originally solitary, developed social structures" },
  { id: "eusocial-to-individual", name: "Eusocial → Individual", description: "Originally hive-like, developed individual identity" },
  { id: "facultative", name: "Facultatively Social", description: "Social behavior depends on situation" },
  { id: "obligate", name: "Obligately Social", description: "Cannot survive alone" },
  { id: "modular", name: "Modular Social", description: "Can merge/separate as needed" },
];

export const MORTALITY_SALIENCE = [
  { id: "constant", name: "Constant", description: "Death always visible/present" },
  { id: "frequent", name: "Frequent", description: "Death encountered regularly" },
  { id: "occasional", name: "Occasional", description: "Death known but not daily reality" },
  { id: "rare", name: "Rare", description: "Species rarely dies, may not witness it" },
  { id: "abstract", name: "Abstract", description: "Death only known conceptually" },
];

export const GENERATIONAL_CONTINUITY = [
  { id: "strong", name: "Strong Continuity", description: "Generations overlap, elders teach young" },
  { id: "weak", name: "Weak Continuity", description: "Little overlap between generations" },
  { id: "none", name: "No Direct Continuity", description: "Generations never meet" },
  { id: "multi", name: "Multi-Generational Overlap", description: "3+ generations interact" },
  { id: "reverse", name: "Reverse Continuity", description: "Young are reincarnated elders" },
];

export const TIME_EXPERIENCES = [
  { id: "linear", name: "Linear Progressive", description: "Past → present → future" },
  { id: "cyclical", name: "Cyclical", description: "Eternal return, time repeats" },
  { id: "branching", name: "Branching", description: "Multiple potential futures" },
  { id: "simultaneous", name: "Simultaneous", description: "Past/present/future experienced together" },
  { id: "reversible", name: "Reversible", description: "Can mentally move backward/forward" },
  { id: "nested", name: "Nested", description: "Multiple timescales operating simultaneously" },
];

export const TEMPORAL_HORIZONS = [
  { id: "immediate", name: "Immediate", description: "Hours to days" },
  { id: "seasonal", name: "Seasonal", description: "Months to year" },
  { id: "generational", name: "Generational", description: "Lifetime to children's lifetime" },
  { id: "multi-generational", name: "Multi-Generational", description: "Several generations" },
  { id: "deep-time", name: "Deep Time", description: "Centuries to millennia" },
];

// Section 4: Mythic Expression

export const DIMENSIONAL_STRUCTURES = [
  { id: "linear", name: "Linear/Hierarchical", description: "Lower to higher realms" },
  { id: "concentric", name: "Concentric", description: "Center outward" },
  { id: "networked", name: "Networked", description: "Interconnected nodes" },
  { id: "layered", name: "Layered", description: "Overlapping dimensions" },
  { id: "cyclical", name: "Cyclical", description: "Time as structure" },
  { id: "fractal", name: "Fractal", description: "Self-similar at all scales" },
];

export const DIVINE_ONTOLOGIES = [
  { id: "personal", name: "Personal Beings", description: "Anthropomorphic/species-morphic entities" },
  { id: "impersonal", name: "Impersonal Forces", description: "Like gravity or electromagnetism" },
  { id: "sentient-processes", name: "Sentient Processes", description: "Aware but not person-like" },
  { id: "nature-aspects", name: "Aspects of Nature", description: "Pantheistic - divine is nature itself" },
  { id: "ancestral", name: "Ancestral Beings", description: "Deified predecessors" },
  { id: "emergent", name: "Emergent Properties", description: "Arise from cosmic complexity" },
  { id: "symbolic", name: "None (Symbolic Only)", description: "Recognized as psychological/social constructs" },
];

export const DIVINE_STATUS_LEVELS = [
  { id: "fully-divine", name: "Fully Divine", description: "Eternal, omnipotent in domain" },
  { id: "semi-divine", name: "Semi-Divine", description: "Powerful but limited" },
  { id: "heroic", name: "Heroic/Liminal", description: "Between mortal and divine" },
  { id: "symbolic", name: "Symbolic Only", description: "Not literally believed as entity" },
];

export const PHYSICAL_RELATIONSHIPS = [
  { id: "controls", name: "Controls Physical Phenomena", description: "Direct causal power over reality" },
  { id: "represents", name: "Represents Physical Phenomena", description: "Symbolic personification" },
  { id: "transcends", name: "Transcends Physical Reality", description: "Beyond material existence" },
  { id: "identical", name: "Is Identical to Physical Reality", description: "Immanent in nature" },
];

// Section 5: Religious/Ritual Practices

export const RITUAL_FUNCTIONS = [
  { id: "life-transitions", name: "Mark Life Transitions", description: "Birth, maturity, death, metamorphosis, etc." },
  { id: "seasonal", name: "Seasonal/Cyclical Celebrations", description: "Mark time cycles" },
  { id: "crisis", name: "Crisis Response", description: "Environmental disaster, attack, disease" },
  { id: "cohesion", name: "Social Cohesion/Network Maintenance", description: "Strengthen group bonds" },
  { id: "communication", name: "Communication with Divine/Ancestors", description: "Connect with other realms" },
  { id: "transformation", name: "Transformation/Initiation", description: "Change individual status" },
  { id: "propitiation", name: "Propitiation/Appeasement", description: "Satisfy divine forces" },
  { id: "reenactment", name: "Re-enactment of Mythic Events", description: "Recreate sacred stories" },
  { id: "boundary", name: "Boundary Maintenance", description: "Between sacred/profane, us/them, etc." },
  { id: "redistribution", name: "Resource Redistribution", description: "Share resources through ritual" },
  { id: "conflict", name: "Conflict Resolution", description: "Resolve disputes through ritual" },
  { id: "knowledge", name: "Knowledge Transmission", description: "Pass on information through ritual" },
];

export const LEADERSHIP_MODELS = [
  { id: "shamanic", name: "Shamanic/Visionary", description: "Individuals with special access to divine realm" },
  { id: "priestly", name: "Priestly/Institutional", description: "Hereditary or trained hierarchy" },
  { id: "democratic", name: "Democratic", description: "All participate equally, no specialists" },
  { id: "meritocratic", name: "Meritocratic", description: "Achieved through trials/tests" },
  { id: "spontaneous", name: "Spontaneous", description: "Anyone can be temporarily 'chosen'" },
  { id: "collective", name: "Collective", description: "Only groups, never individuals" },
  { id: "none", name: "None", description: "No religious specialists needed" },
  { id: "biological", name: "Biological", description: "Specific caste/morph serves religious function" },
];

export const PILGRIMAGE_TYPES = [
  { id: "physical", name: "Physical Journey", description: "Travel to sacred sites" },
  { id: "mental", name: "Mental/Meditative Journey", description: "Inner spiritual travel" },
  { id: "sensory", name: "Sensory Journey", description: "Experience specific sensory sequences" },
  { id: "temporal", name: "Temporal Journey", description: "Wait for specific time/cycle" },
  { id: "social", name: "Social Journey", description: "Accumulate connections/relationships" },
  { id: "transformative", name: "Transformative Journey", description: "Undergo physical change to access site" },
  { id: "none", name: "No Pilgrimage Tradition", description: "Sacred accessible everywhere" },
];

export const ANCESTOR_RELATIONS = [
  { id: "venerated", name: "Ancestors Venerated", description: "Remembered, honored, possibly communicated with" },
  { id: "reincorporated", name: "Ancestors Reincorporated", description: "Physically consumed, merged, etc." },
  { id: "forgotten", name: "Ancestors Forgotten", description: "Death is total ending" },
  { id: "transformed", name: "Ancestors Transformed", description: "Become different type of being" },
  { id: "elevated", name: "Ancestors Elevated", description: "Become divine/semi-divine" },
  { id: "persist", name: "Ancestors Persist", description: "As ghosts, spirits, etc." },
];

export const COSMIC_ESCHATOLOGIES = [
  { id: "linear-apocalypse", name: "Linear Apocalypse", description: "World ends once" },
  { id: "cyclical-apocalypse", name: "Cyclical Apocalypse", description: "World ends and renews repeatedly" },
  { id: "gradual", name: "Gradual Transformation", description: "Slow change toward end state" },
  { id: "eternal-stasis", name: "Eternal Stasis", description: "No ultimate change" },
  { id: "branching", name: "Branching Futures", description: "Multiple possible destinies" },
  { id: "heat-death", name: "Heat Death", description: "Universe winds down" },
  { id: "ascension", name: "Ascension", description: "Material realm transcended" },
  { id: "none", name: "No Eschatology", description: "No concept of cosmic ending" },
];

// Section 6: Synthesis

export const SCIENCE_RESOLUTIONS = [
  { id: "adapts", name: "Mythology Adapts", description: "Incorporates new knowledge into stories" },
  { id: "reinterprets", name: "Mythology Reinterprets", description: "New knowledge given symbolic meaning" },
  { id: "separate-domains", name: "Separate Domains", description: "Science and myth operate independently" },
  { id: "rejects", name: "Mythology Rejects", description: "Contradicting knowledge dismissed" },
  { id: "sacred-science", name: "Sacred Science", description: "Science is considered form of sacred knowledge" },
];

// Section Navigation
export const XENOMYTHOLOGY_SECTIONS = [
  { id: "species-biology", title: "Species Biology & Psychology" },
  { id: "environmental-context", title: "Environmental Context" },
  { id: "archetypal-foundations", title: "Archetypal Foundations" },
  { id: "mythic-expression", title: "Mythic Expression" },
  { id: "religious-practices", title: "Religious/Ritual Practices" },
  { id: "synthesis", title: "Synthesis & Framework" },
];

// Example prompts and guidance text
export const SECTION_GUIDANCE = {
  sensoryArchitecture: {
    cognitionImpact: {
      prompt: "How does this sensory suite affect how this species thinks and categorizes reality?",
      example: "A species with simultaneous electromagnetic field sensing, chemical detection, and infrared vision might experience 'objects' as dynamic bundles of temperature-emission-chemical-signature-field-distortion rather than as discrete visual forms. Their cognitive categories might be organized around 'thermal-chemical profiles' rather than shapes."
    }
  },
  cognitiveArchitecture: {
    emotionalRange: {
      prompt: "Describe the primary emotions/motivational states this species experiences. Don't assume human emotions - derive from their evolutionary needs.",
      example: "A eusocial species might have 'colony-threat-response' (like fear but collective), 'contribution-satisfaction' (fulfillment from role performance), and 'unity-disruption-distress' (anxiety when social cohesion breaks down) rather than human-like individual emotions."
    },
    cognitiveChallenges: {
      prompt: "What is cognitively difficult or counterintuitive for this species?"
    }
  },
  planetaryConditions: {
    skyAppearance: {
      prompt: "What does the sky look like? What celestial objects are visible and notable? How prominent are they?",
      example: "Multiple moons with different colors; rings visible at certain times; binary star that creates double shadows; nebula visible as colored cloud; stars invisible (thick atmosphere or always-day)"
    }
  },
  evolutionaryPressures: {
    adaptiveBreakthrough: {
      prompt: "What major evolutionary innovation enabled this species' intelligence? What problem did intelligence solve?",
      example: "Intelligence emerged to coordinate complex multi-stage seasonal migrations; or to manage symbiotic relationships with multiple other species; or to model predator behavior; or to maintain social cohesion in large groups."
    }
  },
  existentialParameters: {
    deathPhenomenology: {
      prompt: "What does death actually look/feel/seem like to this species?",
      example: "For a hive-mind species, death might be experienced as gradual 'dimming' as nodes disconnect; for a metamorphic species, death might be hard to distinguish from transformation; for a distributed consciousness, death might be 'contraction' of awareness."
    }
  },
  pressureAnalysis: {
    cognitiveChallenge: {
      prompt: "What is psychologically/cognitively difficult about this pressure?",
      example: "For 'seasonal catastrophes' - the cognitive challenge is maintaining hope and effort during abundance while knowing catastrophe is coming, and maintaining social cohesion during scarcity."
    },
    symbolicResolution: {
      prompt: "What needs to be symbolically resolved?",
      example: "The tension between 'enjoy now' and 'prepare for catastrophe'; the paradox that individual survival depends on group cooperation but resources are scarce."
    },
    archetypeStructure: {
      prompt: "What archetypal structure emerges?",
      example: "A 'Cycle-Keeper' archetype - not linear time but a guardian of the eternal return who promises that after destruction comes renewal. Or a 'Sacrifice-Transformer' archetype - one who converts individual resources into collective survival through ritual giving."
    },
    archetypeForm: {
      prompt: "Based on your species' sensory modalities, environment, and biology, what would be the concrete manifestation?",
      example: "For a Seasonal Catastrophe Species with Electromagnetic Sensing: The 'Cycle-Keeper' manifests as a massive electromagnetic pulse that rhythmically emanates from the planet's core, experienced as both destruction (it disrupts all life) and promise (its rhythm proves the cycle continues). Mythologically personified as 'The Pulse-That-Returns.'"
    }
  },
  creationNarrative: {
    primordialState: {
      prompt: "Based on your species' cognition and environment, what represents 'before'?",
      examples: [
        "For electromagnetic species: 'Before' is the Silence - no fields, no signal",
        "For hive-mind: 'Before' is the Unconnected - isolated nodes without network",
        "For aquatic: 'Before' is the Stillness - water without current or motion"
      ]
    },
    creativeAct: {
      prompt: "What action/event causes existence to begin? This should involve your archetypal forms.",
      example: "The Triune Weaver brings together three primordial fields (electromagnetic, thermal, chemical), and their interference pattern creates the first stable matter - the planet. The Gas-Father stabilizes this pattern through gravity."
    },
    firstCreatedThing: {
      prompt: "Based on your species' biology, what would they consider the 'first' or most fundamental form of existence?"
    }
  },
  cosmologicalStructure: {
    primaryDivision: {
      prompt: "Rather than assuming heaven/earth, what is YOUR species' fundamental way of dividing reality?",
      examples: [
        "Signal/Silence (for electromagnetic species)",
        "Connected/Isolated (for hive-mind)",
        "Patterned/Chaotic (for pattern-recognition dominated species)",
        "Illuminated/Dark (for tidally locked)",
        "Dense/Dispersed (for species where pressure/depth matters)"
      ]
    },
    sacredGeography: {
      prompt: "What locations/regions carry mythic significance?",
      example: "The Terminator Zone where Day-Face and Night-Face meet is the 'Margin of Transformation' where all archetypal forces are in balance and change is possible."
    }
  },
  mythicCycles: {
    greatCrisis: {
      prompt: "What is the fundamental crisis/conflict in your mythology? This should emerge from one of your species' core evolutionary pressures or existential challenges.",
      example: "The Great Disconnection - when the electromagnetic field weakened, and all beings lost the ability to sense each other, leading to chaos and isolation."
    },
    crisisExplanation: {
      prompt: "What does this myth explain/justify about current reality?",
      example: "Explains why electromagnetic sensitivity varies among individuals (some were touched by the Field-Singer during the Reconnection); justifies social cooperation (only by maintaining network can we prevent another Disconnection)."
    },
    unresolvedTension: {
      prompt: "What ongoing tension remains unresolved? Most mythologies have an eschatological element - something yet to come or eternally recurring."
    }
  },
  sacredSpaces: {
    whatMakesSacred: {
      prompt: "Based on your species' sensory modalities and archetypal structures, what constitutes a 'sacred' space?",
      examples: [
        "For EM-sensing species: Locations where natural electromagnetic fields create specific interference patterns",
        "For aquatic species: Depth zones where pressure/temperature create specific states",
        "For multi-star system: Locations where shadows from different stars overlap in specific ways"
      ]
    }
  },
  deathPractices: {
    consciousnessAtDeath: {
      prompt: "Based on your species' consciousness type and mortality phenomenology, what happens to individual consciousness at death?",
      examples: [
        "Hive-mind: Consciousness doesn't end but diffuses into collective; individual pattern persists as 'memory shape' in the network",
        "Metamorphic species: Death is indistinguishable from final metamorphosis; unclear if death exists as separate category",
        "Distributed consciousness: Death is gradual contraction of awareness-field until threshold collapse"
      ]
    },
    endTimesNarrative: {
      prompt: "Describe the end-times narrative using your species-specific archetypes.",
      example: "When the Gas-Father's storms finally cease, all electromagnetic fields will stabilize into perfect harmony - the Eternal Signal. But this harmony means no information, no change, no life. The end is perfect order, which is perfect death. Some heresies teach that the Field-Singer will introduce one final chaos-note to prevent this, keeping existence in eternal oscillation."
    }
  },
  synthesis: {
    ethicalVirtues: {
      prompt: "Based on this mythology, what behaviors would be considered virtuous/sacred?",
      example: "Maintaining electromagnetic field coherence (silence is evil); Contributing to network stability; Voluntary signal-sacrifice during crisis"
    },
    ethicalTaboos: {
      prompt: "What behaviors would be taboo/profane?",
      example: "Electromagnetic jamming (murder-equivalent); Isolation/refusing connection; Disrupting the Field during ritual"
    },
    ethicalAmbiguous: {
      prompt: "What behaviors are ambiguous/liminal?",
      example: "Solitude for strengthening individual signal (necessary but dangerous); Strong individual signal (attractive but potentially dominating)"
    }
  }
};
