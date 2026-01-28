// Evolutionary Biology Design Sheet - Data Constants

// ============================================================================
// Section Definitions for Navigation
// ============================================================================

export const EVOLUTIONARY_BIOLOGY_SECTIONS = [
  { id: "foundations", title: "1. Foundations" },
  { id: "biochemistry", title: "2. Biochemistry & Metabolism" },
  { id: "adaptations", title: "3. Evolutionary Adaptations" },
  { id: "body-plan", title: "4. Body Plan & Morphology" },
  { id: "sensory", title: "5. Sensory Systems" },
  { id: "reproduction", title: "6. Reproduction & Life Cycle" },
  { id: "social", title: "7. Social Evolution" },
  { id: "cognition", title: "8. Intelligence & Cognition" },
  { id: "communication", title: "9. Communication Biology" },
  { id: "psychology", title: "10. Psychology from Biology" },
  { id: "vestigial", title: "11. Vestigial Traits" },
  { id: "viewpoint-test", title: "12. Non-Human Viewpoint" },
  { id: "integration", title: "13. Integration & Consistency" },
];

// ============================================================================
// Section 1: Foundations - Survival Pressures & Environment
// ============================================================================

export const SURVIVAL_PRESSURES = [
  { id: "predation", name: "Predation", description: "Constant threat from predators shapes speed, camouflage, armor" },
  { id: "resource-competition", name: "Resource Competition", description: "Competing for food, mates, or territory" },
  { id: "climate-heat", name: "Extreme Heat", description: "High temperatures requiring cooling adaptations" },
  { id: "climate-cold", name: "Extreme Cold", description: "Low temperatures requiring insulation, antifreeze" },
  { id: "radiation", name: "High Radiation", description: "UV or cosmic radiation exposure" },
  { id: "oxygen-scarcity", name: "Oxygen/Oxidizer Scarcity", description: "Limited breathable atmosphere" },
  { id: "water-scarcity", name: "Water Scarcity", description: "Desert or arid environment" },
  { id: "food-scarcity", name: "Food Scarcity", description: "Sparse or seasonal nutrients" },
  { id: "pressure-high", name: "High Pressure", description: "Deep ocean or dense atmosphere" },
  { id: "pressure-low", name: "Low Pressure", description: "High altitude or thin atmosphere" },
  { id: "toxins", name: "Environmental Toxins", description: "Poisonous atmosphere or terrain" },
  { id: "geological-instability", name: "Geological Instability", description: "Earthquakes, volcanic activity" },
  { id: "weather-extreme", name: "Extreme Weather", description: "Storms, hurricanes, unpredictable climate" },
  { id: "seasonal-variation", name: "Extreme Seasonal Variation", description: "Long winters/summers, dramatic shifts" },
  { id: "parasites", name: "Parasites/Disease", description: "Constant pathogen pressure" },
  { id: "social-competition", name: "Intraspecies Competition", description: "Competition within the species" },
];

export const EXTREMOPHILE_INSPIRATIONS = [
  { id: "thermophile", name: "Thermophiles", description: "Heat-loving organisms (hydrothermal vents)" },
  { id: "psychrophile", name: "Psychrophiles", description: "Cold-loving organisms (Antarctic life)" },
  { id: "halophile", name: "Halophiles", description: "Salt-loving organisms (salt lakes)" },
  { id: "acidophile", name: "Acidophiles", description: "Acid-loving organisms (volcanic hot springs)" },
  { id: "alkaliphile", name: "Alkaliphiles", description: "Base-loving organisms (soda lakes)" },
  { id: "barophile", name: "Barophiles", description: "Pressure-loving organisms (deep ocean)" },
  { id: "radioresistant", name: "Radioresistant", description: "Radiation-tolerant organisms (Deinococcus)" },
  { id: "xerophile", name: "Xerophiles", description: "Dry-loving organisms (desert life)" },
  { id: "endolith", name: "Endoliths", description: "Rock-dwelling organisms" },
  { id: "chemotroph", name: "Chemotrophs", description: "Chemical energy users (cave life)" },
];

// ============================================================================
// Section 2: Biochemistry & Metabolism
// ============================================================================

export const BIOCHEMICAL_BASES = [
  { id: "carbon-water", name: "Carbon + Water", description: "Earth-like biochemistry" },
  { id: "carbon-ammonia", name: "Carbon + Ammonia", description: "Cold-world alternative (-77°C to -33°C)" },
  { id: "carbon-methane", name: "Carbon + Methane", description: "Very cold worlds (Titan-like)" },
  { id: "carbon-hydrogen-fluoride", name: "Carbon + Hydrogen Fluoride", description: "Wide temperature range" },
  { id: "silicon-based", name: "Silicon-based", description: "High-temperature alternative" },
  { id: "boron-based", name: "Boron-based", description: "Exotic alternative chemistry" },
  { id: "arsenic-based", name: "Arsenic-based", description: "Arsenic replacing phosphorus" },
];

export const SOLVENTS = [
  { id: "water", name: "Water (H₂O)", description: "Universal solvent, 0-100°C liquid range" },
  { id: "ammonia", name: "Ammonia (NH₃)", description: "Liquid -77°C to -33°C, good solvent" },
  { id: "methane", name: "Methane (CH₄)", description: "Liquid -182°C to -161°C, for Titan-like worlds" },
  { id: "hydrogen-fluoride", name: "Hydrogen Fluoride (HF)", description: "Liquid -83°C to 20°C" },
  { id: "sulfuric-acid", name: "Sulfuric Acid (H₂SO₄)", description: "High-temperature, like Venus clouds" },
  { id: "liquid-nitrogen", name: "Liquid Nitrogen", description: "Extremely cold worlds" },
];

export const ENERGY_SOURCES = [
  { id: "photosynthesis-visible", name: "Photosynthesis (Visible Light)", description: "Earth-like solar energy capture" },
  { id: "photosynthesis-infrared", name: "Photosynthesis (Infrared)", description: "For red dwarf star worlds" },
  { id: "photosynthesis-uv", name: "Photosynthesis (UV)", description: "High-UV environment" },
  { id: "chemosynthesis", name: "Chemosynthesis", description: "Chemical energy from environment" },
  { id: "heterotrophy", name: "Heterotrophy (Eating)", description: "Consuming other organisms" },
  { id: "radiosynthesis", name: "Radiosynthesis", description: "Using ionizing radiation (like fungi at Chernobyl)" },
  { id: "thermosynthesis", name: "Thermosynthesis", description: "Using temperature gradients" },
  { id: "electrotrophy", name: "Electrotrophy", description: "Using electrical gradients" },
  { id: "magnetotrophy", name: "Magnetotrophy", description: "Speculative: using magnetic fields" },
];

export const METABOLIC_RATES = [
  { id: "hypermetabolic", name: "Hypermetabolic", description: "Very high energy needs, constant feeding" },
  { id: "high", name: "High (Endothermic)", description: "Warm-blooded, active lifestyle" },
  { id: "moderate", name: "Moderate", description: "Average energy needs" },
  { id: "low", name: "Low (Ectothermic)", description: "Cold-blooded, energy efficient" },
  { id: "hypometabolic", name: "Hypometabolic", description: "Minimal energy needs, slow lifestyle" },
  { id: "variable", name: "Variable/Adaptive", description: "Can shift between high and low states" },
  { id: "torpor-capable", name: "Torpor-Capable", description: "Can enter hibernation/estivation" },
];

export const RESPIRATION_TYPES = [
  { id: "aerobic-oxygen", name: "Aerobic (Oxygen)", description: "Earth-like oxygen breathing" },
  { id: "aerobic-fluorine", name: "Aerobic (Fluorine)", description: "Fluorine as oxidizer" },
  { id: "aerobic-chlorine", name: "Aerobic (Chlorine)", description: "Chlorine as oxidizer" },
  { id: "anaerobic-sulfur", name: "Anaerobic (Sulfur)", description: "Using sulfur compounds" },
  { id: "anaerobic-nitrogen", name: "Anaerobic (Nitrogen)", description: "Denitrification-based" },
  { id: "anaerobic-iron", name: "Anaerobic (Iron)", description: "Iron reduction" },
  { id: "fermentation", name: "Fermentation", description: "No external electron acceptor" },
  { id: "mixed", name: "Mixed/Facultative", description: "Can use multiple methods" },
];

// ============================================================================
// Section 3: Evolutionary Adaptations
// ============================================================================

export const ADAPTATION_CATEGORIES = [
  { id: "structural", name: "Structural", description: "Body shape, size, appendages" },
  { id: "physiological", name: "Physiological", description: "Internal processes, metabolism" },
  { id: "behavioral", name: "Behavioral", description: "Actions, instincts, learned responses" },
  { id: "reproductive", name: "Reproductive", description: "Mating, breeding strategies" },
  { id: "defensive", name: "Defensive", description: "Protection from threats" },
  { id: "offensive", name: "Offensive", description: "Hunting, predation strategies" },
  { id: "sensory", name: "Sensory", description: "Perception enhancements" },
  { id: "social", name: "Social", description: "Group dynamics, cooperation" },
];

export const COMMON_TRADEOFFS = [
  { id: "speed-endurance", name: "Speed vs. Endurance", description: "Fast sprinters tire quickly" },
  { id: "size-agility", name: "Size vs. Agility", description: "Large creatures less maneuverable" },
  { id: "armor-mobility", name: "Armor vs. Mobility", description: "Heavy protection slows movement" },
  { id: "brain-energy", name: "Brain Size vs. Energy Cost", description: "Larger brains require more calories" },
  { id: "specialization-flexibility", name: "Specialization vs. Flexibility", description: "Specialists excel but can't adapt" },
  { id: "reproduction-longevity", name: "Reproduction vs. Longevity", description: "High fertility often means shorter life" },
  { id: "growth-reproduction", name: "Growth vs. Reproduction", description: "Energy goes to one or the other" },
  { id: "individual-group", name: "Individual vs. Group Benefit", description: "Personal vs. collective success" },
];

// ============================================================================
// Section 4: Body Plan & Morphology
// ============================================================================

export const SYMMETRY_TYPES = [
  { id: "bilateral", name: "Bilateral", description: "Left-right mirror symmetry (most animals)" },
  { id: "radial", name: "Radial", description: "Circular symmetry (jellyfish, starfish)" },
  { id: "biradial", name: "Biradial", description: "Two planes of symmetry (comb jellies)" },
  { id: "pentaradial", name: "Pentaradial", description: "Five-fold symmetry (echinoderms)" },
  { id: "spherical", name: "Spherical", description: "Symmetry in all directions" },
  { id: "asymmetric", name: "Asymmetric", description: "No consistent symmetry (sponges)" },
  { id: "spiral", name: "Spiral/Helical", description: "Coiled or twisted body structure" },
  { id: "fractal", name: "Fractal", description: "Self-similar at different scales" },
];

export const BODY_SEGMENTS = [
  { id: "unsegmented", name: "Unsegmented", description: "No distinct body divisions" },
  { id: "two-part", name: "Two-Part (Tagmata)", description: "Head-body division" },
  { id: "three-part", name: "Three-Part", description: "Head-thorax-abdomen (insects)" },
  { id: "segmented-similar", name: "Segmented (Similar)", description: "Repeating similar segments (worms)" },
  { id: "segmented-specialized", name: "Segmented (Specialized)", description: "Different segments for different functions" },
  { id: "modular", name: "Modular/Colonial", description: "Semi-independent units (corals)" },
];

export const LIMB_TYPES = [
  { id: "legs-walking", name: "Walking Legs", description: "For terrestrial locomotion" },
  { id: "arms-manipulation", name: "Manipulative Arms", description: "For grasping and tool use" },
  { id: "wings", name: "Wings", description: "For powered flight" },
  { id: "fins", name: "Fins", description: "For swimming" },
  { id: "tentacles", name: "Tentacles", description: "Flexible, boneless appendages" },
  { id: "pseudopods", name: "Pseudopods", description: "Temporary projections" },
  { id: "cilia", name: "Cilia/Flagella", description: "Hair-like projections for movement" },
  { id: "jets", name: "Jet Siphons", description: "For jet propulsion" },
  { id: "parachute", name: "Parachute/Gliding Membranes", description: "For gliding" },
];

export const INTEGUMENT_TYPES = [
  { id: "skin-naked", name: "Naked Skin", description: "Unprotected skin surface" },
  { id: "skin-mucus", name: "Mucus-Covered Skin", description: "Moist protective layer (amphibians)" },
  { id: "scales-keratin", name: "Keratin Scales", description: "Overlapping protein scales (reptiles)" },
  { id: "scales-bony", name: "Bony Scales", description: "Bone-reinforced scales (fish)" },
  { id: "fur", name: "Fur/Hair", description: "Keratin-based insulation" },
  { id: "feathers", name: "Feathers", description: "Lightweight insulation/flight structures" },
  { id: "chitin-exo", name: "Chitin Exoskeleton", description: "External skeleton (arthropods)" },
  { id: "mineral-shell", name: "Mineral Shell", description: "Calcium/silica armor (mollusks)" },
  { id: "biocrystal", name: "Biocrystalline", description: "Crystal-based covering" },
  { id: "plates-armor", name: "Armor Plates", description: "Heavy defensive plates" },
];

export const INTERNAL_STRUCTURES = [
  { id: "endoskeleton", name: "Endoskeleton (Internal)", description: "Internal support structure" },
  { id: "exoskeleton", name: "Exoskeleton (External)", description: "External support structure" },
  { id: "hydrostatic", name: "Hydrostatic Skeleton", description: "Fluid-pressure support" },
  { id: "cartilage", name: "Cartilaginous", description: "Flexible cartilage framework" },
  { id: "no-skeleton", name: "No Skeleton", description: "Soft-bodied" },
  { id: "hybrid", name: "Hybrid System", description: "Combination of types" },
];

export const COLORATION_FUNCTIONS = [
  { id: "camouflage", name: "Camouflage", description: "Blending with environment" },
  { id: "warning", name: "Warning (Aposematic)", description: "Signaling danger/toxicity" },
  { id: "mimicry", name: "Mimicry", description: "Imitating another species" },
  { id: "sexual-selection", name: "Sexual Selection", description: "Attracting mates" },
  { id: "thermoregulation", name: "Thermoregulation", description: "Heat absorption/reflection" },
  { id: "communication", name: "Communication", description: "Signaling to conspecifics" },
  { id: "uv-protection", name: "UV Protection", description: "Shielding from radiation" },
  { id: "dynamic", name: "Dynamic/Color-Changing", description: "Can change color actively" },
];

// ============================================================================
// Section 5: Sensory Systems
// ============================================================================

export const SENSORY_TYPES = [
  { id: "vision-visible", name: "Vision (Visible Light)", description: "Standard light perception" },
  { id: "vision-infrared", name: "Vision (Infrared)", description: "Heat/thermal vision" },
  { id: "vision-uv", name: "Vision (Ultraviolet)", description: "UV light perception" },
  { id: "vision-polarized", name: "Vision (Polarized Light)", description: "Detecting light polarization" },
  { id: "hearing-air", name: "Hearing (Airborne)", description: "Sound perception through air" },
  { id: "hearing-water", name: "Hearing (Underwater)", description: "Sound perception through water" },
  { id: "hearing-substrate", name: "Hearing (Substrate)", description: "Vibration sensing through ground" },
  { id: "echolocation", name: "Echolocation", description: "Active sonar, emitting and receiving" },
  { id: "electroreception", name: "Electroreception", description: "Sensing electrical fields" },
  { id: "magnetoreception", name: "Magnetoreception", description: "Sensing magnetic fields" },
  { id: "chemoreception-smell", name: "Chemoreception (Smell)", description: "Airborne chemical detection" },
  { id: "chemoreception-taste", name: "Chemoreception (Taste)", description: "Contact chemical detection" },
  { id: "thermoception", name: "Thermoception", description: "Temperature sensing" },
  { id: "proprioception", name: "Proprioception", description: "Body position awareness" },
  { id: "nociception", name: "Nociception", description: "Pain/damage detection" },
  { id: "pressure", name: "Pressure/Lateral Line", description: "Pressure/water movement sensing" },
  { id: "gravity", name: "Graviception", description: "Sensing gravity/orientation" },
];

export const SENSORY_ORGAN_LOCATIONS = [
  { id: "head-front", name: "Head (Front-facing)", description: "Forward-directed sense organs" },
  { id: "head-side", name: "Head (Side-facing)", description: "Wide-angle perception" },
  { id: "head-top", name: "Head (Dorsal)", description: "Upward-directed" },
  { id: "body-distributed", name: "Body (Distributed)", description: "Sensors across body surface" },
  { id: "appendages", name: "Appendages", description: "On limbs or tentacles" },
  { id: "stalked", name: "Stalked/Extended", description: "On movable stalks" },
  { id: "internal", name: "Internal", description: "Inside body cavities" },
];

// ============================================================================
// Section 6: Reproduction & Life Cycle
// ============================================================================

export const REPRODUCTION_MODES = [
  { id: "sexual-binary", name: "Sexual (Two Sexes)", description: "Male and female gametes" },
  { id: "sexual-multiple", name: "Sexual (Multiple Sexes)", description: "Three or more mating types" },
  { id: "hermaphroditic-simultaneous", name: "Hermaphroditic (Simultaneous)", description: "Both sexes at once" },
  { id: "hermaphroditic-sequential", name: "Hermaphroditic (Sequential)", description: "Changes sex during life" },
  { id: "parthenogenesis", name: "Parthenogenesis", description: "Unfertilized eggs develop" },
  { id: "asexual-budding", name: "Asexual (Budding)", description: "New individuals grow from parent" },
  { id: "asexual-fission", name: "Asexual (Fission)", description: "Splitting into two" },
  { id: "asexual-fragmentation", name: "Asexual (Fragmentation)", description: "Pieces become new individuals" },
  { id: "spore-based", name: "Spore-based", description: "Reproduction via dormant spores" },
  { id: "hybrid", name: "Hybrid System", description: "Can reproduce multiple ways" },
];

export const MATING_SYSTEMS = [
  { id: "monogamous", name: "Monogamous", description: "Single long-term partner" },
  { id: "polygynous", name: "Polygynous", description: "One male, multiple females" },
  { id: "polyandrous", name: "Polyandrous", description: "One female, multiple males" },
  { id: "promiscuous", name: "Promiscuous", description: "Multiple partners, no bonds" },
  { id: "lekking", name: "Lekking", description: "Males display, females choose" },
  { id: "tournament", name: "Tournament", description: "Males compete, winner mates" },
  { id: "pair-bonding", name: "Pair-Bonding", description: "Strong bonds, shared parenting" },
  { id: "harem", name: "Harem", description: "One dominant with group" },
];

export const FERTILIZATION_TYPES = [
  { id: "external-broadcast", name: "External (Broadcast)", description: "Gametes released into environment" },
  { id: "external-localized", name: "External (Localized)", description: "Gametes deposited together" },
  { id: "internal-copulation", name: "Internal (Copulation)", description: "Direct transfer to body" },
  { id: "internal-spermatophore", name: "Internal (Spermatophore)", description: "Sperm packet transfer" },
  { id: "traumatic", name: "Traumatic Insemination", description: "Bypassing normal reproductive tract" },
];

export const GESTATION_TYPES = [
  { id: "oviparous", name: "Oviparous (Egg-laying)", description: "External egg development" },
  { id: "ovoviviparous", name: "Ovoviviparous", description: "Eggs develop inside, live birth" },
  { id: "viviparous", name: "Viviparous", description: "Direct nourishment, live birth" },
  { id: "pouched", name: "Pouched (Marsupial)", description: "Born undeveloped, pouch nurturing" },
  { id: "external-brood", name: "External Brooding", description: "Eggs carried on body" },
  { id: "parasitic", name: "Parasitic Gestation", description: "Developing inside host" },
];

export const PARENTAL_CARE_LEVELS = [
  { id: "none", name: "None (R-Strategy)", description: "Many offspring, no care" },
  { id: "minimal", name: "Minimal", description: "Brief protection or feeding" },
  { id: "moderate", name: "Moderate", description: "Extended care until independence" },
  { id: "extensive", name: "Extensive (K-Strategy)", description: "Few offspring, intensive care" },
  { id: "communal", name: "Communal", description: "Group raises all young" },
  { id: "alloparenting", name: "Alloparenting", description: "Non-parents help raise young" },
  { id: "male-only", name: "Male-Only Care", description: "Fathers provide all care" },
  { id: "female-only", name: "Female-Only Care", description: "Mothers provide all care" },
  { id: "biparental", name: "Biparental", description: "Both parents contribute" },
];

export const LIFESPAN_CATEGORIES = [
  { id: "ephemeral", name: "Ephemeral", description: "Days to weeks" },
  { id: "short", name: "Short", description: "Months to few years" },
  { id: "moderate", name: "Moderate", description: "Decades (human-like)" },
  { id: "long", name: "Long", description: "Centuries" },
  { id: "extreme", name: "Extreme", description: "Millennia or more" },
  { id: "indefinite", name: "Indefinite (Negligible Senescence)", description: "No natural aging" },
  { id: "cyclical", name: "Cyclical", description: "Repeated life cycles (phoenix-like)" },
];

export const SENESCENCE_TYPES = [
  { id: "gradual", name: "Gradual Decline", description: "Slow deterioration over time" },
  { id: "rapid", name: "Rapid Post-Reproduction", description: "Quick death after breeding (salmon)" },
  { id: "negligible", name: "Negligible", description: "No apparent aging" },
  { id: "negative", name: "Negative (Benjamin Button)", description: "Improves with age" },
  { id: "programmed", name: "Programmed Death", description: "Genetically triggered endpoint" },
];

// ============================================================================
// Section 7: Social Evolution & Structure
// ============================================================================

export const GROUP_SIZES = [
  { id: "solitary", name: "Solitary", description: "Lives alone except for mating" },
  { id: "pair", name: "Pairs", description: "Mated pairs only" },
  { id: "small-family", name: "Small Family Groups", description: "3-10 individuals" },
  { id: "extended-family", name: "Extended Family", description: "10-30 individuals" },
  { id: "band", name: "Band/Troop", description: "30-100 individuals" },
  { id: "herd", name: "Herd/Swarm", description: "100-1000+ individuals" },
  { id: "colony", name: "Colony/Superorganism", description: "Thousands+ as single unit" },
  { id: "variable", name: "Variable/Fission-Fusion", description: "Group size changes dynamically" },
];

export const SOCIAL_STRUCTURES = [
  { id: "egalitarian", name: "Egalitarian", description: "No fixed hierarchy" },
  { id: "dominance-hierarchy", name: "Dominance Hierarchy", description: "Linear pecking order" },
  { id: "despotism", name: "Despotism", description: "Single dominant individual" },
  { id: "matriarchal", name: "Matriarchal", description: "Female-led groups" },
  { id: "patriarchal", name: "Patriarchal", description: "Male-led groups" },
  { id: "council", name: "Council/Collective", description: "Group decision-making" },
  { id: "caste-based", name: "Caste-Based", description: "Fixed roles by birth/development" },
  { id: "age-graded", name: "Age-Graded", description: "Status changes with age" },
  { id: "achievement-based", name: "Achievement-Based", description: "Status from accomplishments" },
];

export const COOPERATION_MECHANISMS = [
  { id: "kin-selection", name: "Kin Selection", description: "Helping relatives" },
  { id: "reciprocal-altruism", name: "Reciprocal Altruism", description: "Mutual help over time" },
  { id: "mutualism", name: "Mutualism", description: "Immediate mutual benefit" },
  { id: "group-selection", name: "Group Selection", description: "Groups outcompete other groups" },
  { id: "punishment", name: "Punishment/Policing", description: "Enforcing cooperation" },
  { id: "reputation", name: "Reputation", description: "Status from helping others" },
  { id: "signaling", name: "Costly Signaling", description: "Demonstrating quality through sacrifice" },
];

export const CONFLICT_RESOLUTIONS = [
  { id: "ritualized", name: "Ritualized Combat", description: "Formalized contests avoiding injury" },
  { id: "lethal", name: "Lethal Combat", description: "Fighting to death/serious injury" },
  { id: "submission", name: "Submission Displays", description: "Loser signals defeat" },
  { id: "avoidance", name: "Avoidance/Dispersal", description: "Leaving rather than fighting" },
  { id: "mediation", name: "Third-Party Mediation", description: "Others intervene in disputes" },
  { id: "territory", name: "Territory Division", description: "Spatial separation prevents conflict" },
  { id: "coalition", name: "Coalition Formation", description: "Alliances shift power" },
];

export const TERRITORIALITY_TYPES = [
  { id: "none", name: "Non-Territorial", description: "No defended space" },
  { id: "home-range", name: "Home Range (Undefended)", description: "Familiar area but not defended" },
  { id: "defended-individual", name: "Individual Territory", description: "Single occupant defends" },
  { id: "defended-group", name: "Group Territory", description: "Group defends collectively" },
  { id: "defended-resource", name: "Resource Territory", description: "Defends specific resources only" },
  { id: "defended-mating", name: "Mating Territory", description: "Defends breeding sites" },
  { id: "floating", name: "Floating/Shifting", description: "Territory moves with resources" },
];

// ============================================================================
// Section 8: Intelligence & Cognition
// ============================================================================

export const BRAIN_ANALOGS = [
  { id: "centralized-brain", name: "Centralized Brain", description: "Single processing center" },
  { id: "distributed-ganglia", name: "Distributed Ganglia", description: "Multiple processing nodes" },
  { id: "nerve-net", name: "Nerve Net", description: "Diffuse neural network (jellyfish)" },
  { id: "radial-nervous", name: "Radial Nervous System", description: "Star-shaped neural arrangement" },
  { id: "colonial-mind", name: "Colonial Mind", description: "Emergent from many individuals" },
  { id: "external-processing", name: "External Processing", description: "Using environment as memory/processor" },
  { id: "quantum-processing", name: "Quantum-Like Processing", description: "Speculative: quantum effects in cognition" },
];

export const COGNITION_TYPES = [
  { id: "reactive", name: "Reactive/Instinctive", description: "Hardwired responses only" },
  { id: "associative", name: "Associative Learning", description: "Can form simple associations" },
  { id: "operant", name: "Operant Learning", description: "Learns from consequences" },
  { id: "social-learning", name: "Social Learning", description: "Learns from observing others" },
  { id: "problem-solving", name: "Problem-Solving", description: "Novel solutions to challenges" },
  { id: "abstract", name: "Abstract Reasoning", description: "Manipulates symbols and concepts" },
  { id: "metacognition", name: "Metacognitive", description: "Thinks about thinking" },
  { id: "collective", name: "Collective Intelligence", description: "Group-level cognition" },
];

export const MEMORY_TYPES = [
  { id: "genetic", name: "Genetic Memory", description: "Inherited instincts only" },
  { id: "short-term", name: "Short-Term Only", description: "No long-term retention" },
  { id: "procedural", name: "Procedural", description: "Remembers how to do things" },
  { id: "episodic", name: "Episodic", description: "Remembers specific events" },
  { id: "semantic", name: "Semantic", description: "Remembers facts and concepts" },
  { id: "prospective", name: "Prospective", description: "Plans for future events" },
  { id: "external", name: "External/Extended", description: "Uses environment as memory storage" },
];

export const LEARNING_MECHANISMS = [
  { id: "imprinting", name: "Imprinting", description: "Critical period learning" },
  { id: "habituation", name: "Habituation", description: "Learning to ignore stimuli" },
  { id: "sensitization", name: "Sensitization", description: "Increased response to stimuli" },
  { id: "classical", name: "Classical Conditioning", description: "Pavlovian associations" },
  { id: "operant", name: "Operant Conditioning", description: "Trial and error learning" },
  { id: "observational", name: "Observational", description: "Learning by watching" },
  { id: "insight", name: "Insight Learning", description: "Sudden understanding" },
  { id: "play", name: "Play-Based", description: "Learning through play" },
  { id: "cultural", name: "Cultural Transmission", description: "Taught by others" },
];

export const TOOL_USE_LEVELS = [
  { id: "none", name: "None", description: "No tool use" },
  { id: "found-objects", name: "Found Objects", description: "Uses unmodified natural objects" },
  { id: "modified", name: "Modified Tools", description: "Alters objects for purpose" },
  { id: "manufactured", name: "Manufactured", description: "Creates tools from raw materials" },
  { id: "meta-tools", name: "Meta-Tools", description: "Makes tools to make tools" },
  { id: "complex-technology", name: "Complex Technology", description: "Sophisticated technological systems" },
];

// ============================================================================
// Section 9: Communication Biology
// ============================================================================

export const COMMUNICATION_CHANNELS = [
  { id: "vocal-acoustic", name: "Vocal/Acoustic", description: "Sound production and reception" },
  { id: "visual-gesture", name: "Visual (Gesture/Posture)", description: "Body language" },
  { id: "visual-color", name: "Visual (Color Change)", description: "Chromatophores, blushing" },
  { id: "visual-pattern", name: "Visual (Pattern Display)", description: "Displaying markings" },
  { id: "chemical-pheromone", name: "Chemical (Pheromones)", description: "Airborne chemical signals" },
  { id: "chemical-contact", name: "Chemical (Contact)", description: "Touched/tasted signals" },
  { id: "tactile", name: "Tactile", description: "Touch-based communication" },
  { id: "electrical", name: "Electrical", description: "Electric field modulation" },
  { id: "bioluminescence", name: "Bioluminescence", description: "Light production" },
  { id: "seismic", name: "Seismic/Vibrational", description: "Ground vibrations" },
  { id: "infrasound", name: "Infrasound", description: "Low-frequency sound" },
  { id: "ultrasound", name: "Ultrasound", description: "High-frequency sound" },
];

export const SIGNAL_RANGES = [
  { id: "contact", name: "Contact Only", description: "Must be touching" },
  { id: "close", name: "Close Range", description: "Within meters" },
  { id: "medium", name: "Medium Range", description: "Tens to hundreds of meters" },
  { id: "long", name: "Long Range", description: "Kilometers" },
  { id: "global", name: "Global", description: "Planet-wide" },
];

export const INFORMATION_CAPACITIES = [
  { id: "simple-signals", name: "Simple Signals", description: "Alarm calls, mating calls" },
  { id: "graded-signals", name: "Graded Signals", description: "Intensity conveys meaning" },
  { id: "combinatorial", name: "Combinatorial", description: "Elements combine for meaning" },
  { id: "referential", name: "Referential", description: "Symbols refer to things" },
  { id: "syntactic", name: "Syntactic", description: "Order matters (grammar)" },
  { id: "recursive", name: "Recursive", description: "Messages within messages" },
  { id: "abstract", name: "Abstract/Symbolic", description: "Arbitrary symbol systems" },
];

// ============================================================================
// Section 10: Psychology from Biology
// ============================================================================

export const EMOTION_ANALOGS = [
  { id: "fear", name: "Fear/Threat Response", description: "Danger avoidance" },
  { id: "aggression", name: "Aggression/Rage", description: "Attack/defense motivation" },
  { id: "pleasure", name: "Pleasure/Reward", description: "Positive reinforcement" },
  { id: "disgust", name: "Disgust/Rejection", description: "Avoidance of harmful things" },
  { id: "curiosity", name: "Curiosity/Exploration", description: "Drive to investigate" },
  { id: "attachment", name: "Attachment/Bonding", description: "Social connection" },
  { id: "grief", name: "Grief/Loss Response", description: "Response to losing bonds" },
  { id: "play", name: "Play/Frivolity", description: "Non-serious engagement" },
  { id: "anticipation", name: "Anticipation", description: "Expecting future events" },
  { id: "contentment", name: "Contentment/Satisfaction", description: "Needs-met state" },
  { id: "frustration", name: "Frustration", description: "Blocked goal response" },
  { id: "surprise", name: "Surprise/Startle", description: "Unexpected event response" },
];

export const MOTIVATIONAL_DRIVES = [
  { id: "hunger", name: "Hunger/Feeding", description: "Drive to consume nutrients" },
  { id: "thirst", name: "Thirst/Hydration", description: "Drive for solvent intake" },
  { id: "thermoregulation", name: "Thermoregulation", description: "Maintaining temperature" },
  { id: "reproduction", name: "Reproduction/Mating", description: "Drive to reproduce" },
  { id: "safety", name: "Safety/Security", description: "Avoiding threats" },
  { id: "social", name: "Social/Affiliation", description: "Drive for social contact" },
  { id: "status", name: "Status/Dominance", description: "Drive for social position" },
  { id: "exploration", name: "Exploration/Novelty", description: "Seeking new experiences" },
  { id: "rest", name: "Rest/Recovery", description: "Sleep and recuperation" },
  { id: "parental", name: "Parental Care", description: "Drive to nurture offspring" },
  { id: "territorial", name: "Territorial", description: "Defending space" },
];

export const STRESS_RESPONSES = [
  { id: "fight", name: "Fight", description: "Aggressive confrontation" },
  { id: "flight", name: "Flight", description: "Escape and avoidance" },
  { id: "freeze", name: "Freeze", description: "Immobility/hiding" },
  { id: "fawn", name: "Fawn/Appease", description: "Submission and placation" },
  { id: "flood", name: "Flood/Dissociation", description: "Overwhelm and shutdown" },
  { id: "problem-solve", name: "Active Problem-Solving", description: "Engage and address" },
  { id: "social-support", name: "Seek Social Support", description: "Turn to others" },
];

export const CURIOSITY_LEVELS = [
  { id: "none", name: "None/Neophobic", description: "Avoids novelty" },
  { id: "low", name: "Low", description: "Cautious exploration" },
  { id: "moderate", name: "Moderate", description: "Balanced curiosity" },
  { id: "high", name: "High", description: "Actively seeks novelty" },
  { id: "extreme", name: "Extreme/Neophilic", description: "Obsessive exploration" },
];

// ============================================================================
// Section 11: Vestigial & Transitional Traits
// ============================================================================

export const VESTIGIAL_TRAIT_STATES = [
  { id: "functional-reduced", name: "Functional but Reduced", description: "Still works, smaller/weaker" },
  { id: "non-functional", name: "Non-Functional", description: "Present but serves no purpose" },
  { id: "repurposed", name: "Repurposed (Exaptation)", description: "Now serves different function" },
  { id: "atavistic", name: "Atavistic (Occasional)", description: "Rarely appears in individuals" },
  { id: "developmental-only", name: "Developmental Only", description: "Present only in embryo" },
];

// ============================================================================
// Section 12: Non-Human Viewpoint Test
// ============================================================================

export const HUMAN_ASSUMPTIONS_TO_AVOID = [
  { id: "visual-primacy", name: "Visual Primacy", description: "Assuming vision is primary sense" },
  { id: "bilateral-bias", name: "Bilateral Bias", description: "Assuming two-sided body plan" },
  { id: "individual-identity", name: "Individual Identity", description: "Assuming strong self-concept" },
  { id: "linear-time", name: "Linear Time Perception", description: "Assuming sequential time experience" },
  { id: "solid-body", name: "Solid Body", description: "Assuming fixed physical form" },
  { id: "territorial-instinct", name: "Territorial Instinct", description: "Assuming space ownership" },
  { id: "fear-of-death", name: "Fear of Death", description: "Assuming mortality anxiety" },
  { id: "parent-child-bond", name: "Parent-Child Bonding", description: "Assuming familial attachment" },
  { id: "emotional-expression", name: "Emotional Expression", description: "Assuming readable emotions" },
  { id: "goal-orientation", name: "Goal-Oriented Behavior", description: "Assuming purpose-driven action" },
  { id: "cause-effect", name: "Cause-Effect Reasoning", description: "Assuming linear causality" },
  { id: "object-permanence", name: "Object Permanence", description: "Assuming things exist when unseen" },
];

// ============================================================================
// Section Guidance Prompts
// ============================================================================

export const SECTION_GUIDANCE: Record<string, string> = {
  foundations:
    "Start here. What environment shaped this species? Link to existing planet/ECR worksheets to import environmental data. Every trait should trace back to a survival pressure.",
  biochemistry:
    "What does the environment offer for energy? What constraints does the atmosphere, temperature, or available chemicals place on metabolism?",
  adaptations:
    "For each major trait, identify the selective pressure that favored it and the tradeoff it required. Convergent evolution with Earth life is fine, but know why.",
  "body-plan":
    "Form follows function. How does the body plan serve survival in this environment? Consider symmetry, size constraints, and how limbs evolved.",
  sensory:
    "What does this species need to perceive to survive? What's invisible to them? How do their senses shape their understanding of reality?",
  reproduction:
    "Reproduction strategy reflects environmental stability. Unstable environments favor many offspring; stable ones favor few with heavy investment.",
  social:
    "Social structure emerges from survival needs. Predators often hunt in groups; prey herd for protection. What pressures shaped this species' sociality?",
  cognition:
    "Intelligence is expensive. What survival challenge was so demanding that it favored energy-costly brains? How does cognition manifest differently than in humans?",
  communication:
    "Communication evolved for survival advantage. What messages are critical? How does the environment constrain or enable signal transmission?",
  psychology:
    "Emotions and drives are biological adaptations. What feelings would this species' evolutionary history have selected for? What human emotions might be absent?",
  vestigial:
    "Vestigial traits tell evolutionary history. What did ancestors look like? What old adaptations became obsolete? This adds depth and realism.",
  "viewpoint-test":
    "The hardest part: escaping human assumptions. How does this species' biology create a genuinely alien perspective on existence?",
  integration:
    "Check consistency. Do all traits work together? Are there contradictions? Does the overall design feel like a coherent product of evolution?",
};
