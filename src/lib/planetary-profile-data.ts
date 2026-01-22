// Star Types with worldbuilding consequences
export const STAR_TYPES = [
  {
    id: "m-dwarf",
    name: "M-Dwarf (Red Dwarf)",
    description: "Cool, dim stars that make up ~70% of all stars",
    consequences: [
      "Habitable zone very close to star",
      "High likelihood of tidal locking",
      "Frequent stellar flares",
      "Long stellar lifetime (trillions of years)",
      "Planets may have permanent day/night sides",
    ],
    examples: ["Proxima Centauri", "TRAPPIST-1"],
  },
  {
    id: "k-dwarf",
    name: "K-Dwarf (Orange Dwarf)",
    description: "Intermediate between red and yellow stars",
    consequences: [
      "More stable than M-dwarfs",
      "Wider habitable zone than M-dwarfs",
      "Lower UV radiation",
      "Very long stellar lifetime (15-45 billion years)",
      "Good candidate for habitable planets",
    ],
    examples: ["Alpha Centauri B", "Epsilon Eridani"],
  },
  {
    id: "g-type",
    name: "G-Type (Yellow Dwarf)",
    description: "Sun-like stars with moderate temperature",
    consequences: [
      "Earth-like conditions possible",
      "~10 billion year main sequence lifetime",
      "Moderate habitable zone distance",
      "Relatively stable output",
      "Higher UV than K-dwarfs",
    ],
    examples: ["Sun", "Kepler-452"],
  },
  {
    id: "f-type",
    name: "F-Type (Yellow-White)",
    description: "Hotter and brighter than the Sun",
    consequences: [
      "Shorter stellar lifetime (2-4 billion years)",
      "Higher UV radiation",
      "Wider habitable zone",
      "Faster evolution may limit complex life",
      "More energetic stellar wind",
    ],
    examples: ["Procyon A", "Tau Bootis"],
  },
  {
    id: "binary",
    name: "Binary/Multiple Star System",
    description: "Two or more stars orbiting a common center",
    consequences: [
      "Complex orbital dynamics",
      "Variable day/night cycles",
      "Multiple shadows",
      "Complex habitable zones",
      "Spectacular sky views",
    ],
    examples: ["Alpha Centauri AB", "Kepler-16"],
  },
];

// Atmospheric composition options
export const ATMOSPHERIC_GASES = {
  primary: [
    { id: "nitrogen", name: "Nitrogen (N₂)", description: "Inert, dominant in Earth's atmosphere" },
    { id: "oxygen", name: "Oxygen (O₂)", description: "Essential for aerobic life, highly reactive" },
    { id: "carbon-dioxide", name: "Carbon Dioxide (CO₂)", description: "Greenhouse gas, used by plants" },
    { id: "methane", name: "Methane (CH₄)", description: "Potent greenhouse gas, possible biosignature" },
    { id: "hydrogen", name: "Hydrogen (H₂)", description: "Lightest element, escapes easily to space" },
    { id: "helium", name: "Helium (He)", description: "Inert, common in gas giants" },
    { id: "argon", name: "Argon (Ar)", description: "Noble gas, chemically inert" },
  ],
  secondary: [
    { id: "water-vapor", name: "Water Vapor (H₂O)", description: "Greenhouse gas, varies with temperature" },
    { id: "ammonia", name: "Ammonia (NH₃)", description: "Toxic to Earth life, possible alternative solvent" },
    { id: "sulfur-dioxide", name: "Sulfur Dioxide (SO₂)", description: "Volcanic gas, causes acid rain" },
    { id: "hydrogen-sulfide", name: "Hydrogen Sulfide (H₂S)", description: "Volcanic gas, toxic to most life" },
    { id: "ozone", name: "Ozone (O₃)", description: "UV shield, indicates oxygen atmosphere" },
    { id: "neon", name: "Neon (Ne)", description: "Noble gas, trace amounts" },
    { id: "chlorine", name: "Chlorine (Cl₂)", description: "Highly reactive, toxic" },
  ],
};

// Hydrosphere options
export const HYDROSPHERE_OPTIONS = [
  { id: "global-ocean", name: "Global Ocean", description: "Planet-wide water coverage, no major landmasses" },
  { id: "partial-ocean", name: "Partial Oceans", description: "Earth-like distribution of water and land" },
  { id: "ice-world", name: "Ice World", description: "Water exists primarily as ice caps and glaciers" },
  { id: "subsurface-ocean", name: "Subsurface Ocean", description: "Liquid water beneath ice shell (like Europa)" },
  { id: "desert-world", name: "Desert World", description: "Minimal surface water, possibly underground aquifers" },
  { id: "swamp-world", name: "Swamp/Marsh World", description: "Extensive wetlands and shallow seas" },
  { id: "archipelago", name: "Archipelago World", description: "Mostly ocean with scattered island chains" },
  { id: "no-water", name: "No Liquid Water", description: "Too hot, cold, or no water present" },
];

// Habitability tiers
export const HABITABILITY_TIERS = [
  {
    tier: 1,
    name: "Shirt-Sleeve Environment",
    description: "Humans can survive with minimal protection",
    characteristics: [
      "Breathable atmosphere",
      "Comfortable temperature range",
      "Tolerable gravity",
      "Low radiation",
      "Stable environment",
    ],
  },
  {
    tier: 2,
    name: "Minimal Protection Required",
    description: "Basic equipment needed for comfort/safety",
    characteristics: [
      "Atmosphere may need filtering or supplementation",
      "Temperature extremes manageable with clothing",
      "Some environmental hazards present",
      "Settlement possible with basic technology",
    ],
  },
  {
    tier: 3,
    name: "Significant Adaptation Required",
    description: "Substantial technology or genetic modification needed",
    characteristics: [
      "Pressure suits required outdoors",
      "Domed or underground habitats",
      "Significant health challenges",
      "Resource-intensive colonization",
    ],
  },
  {
    tier: 4,
    name: "Hostile Environment",
    description: "Survival requires constant technological support",
    characteristics: [
      "Full EVA suits required at all times",
      "Extreme temperatures or pressures",
      "High radiation or toxic atmosphere",
      "Isolated outposts only",
    ],
  },
  {
    tier: 5,
    name: "Extreme Hazard",
    description: "Only robotic or highly modified presence possible",
    characteristics: [
      "Conditions exceed human tolerance",
      "Brief human visits at most",
      "Primarily automated operations",
      "Exotic environments (gas giants, etc.)",
    ],
  },
];

// Required adaptations checklist
export const ADAPTATION_OPTIONS = [
  { id: "pressure-suits", name: "Pressure/Environment Suits", description: "Protection from atmospheric conditions" },
  { id: "breathing-apparatus", name: "Breathing Apparatus", description: "Oxygen supply or air filtration" },
  { id: "radiation-shielding", name: "Radiation Shielding", description: "Protection from stellar/cosmic radiation" },
  { id: "gravity-adaptation", name: "Gravity Adaptation", description: "Physiological changes for different gravity" },
  { id: "thermal-regulation", name: "Thermal Regulation", description: "Heating or cooling systems" },
  { id: "domed-habitats", name: "Domed/Sealed Habitats", description: "Enclosed living spaces" },
  { id: "underground-living", name: "Underground Habitation", description: "Subterranean settlements" },
  { id: "genetic-modification", name: "Genetic Modification", description: "Biological adaptation to environment" },
  { id: "cybernetic-augmentation", name: "Cybernetic Augmentation", description: "Technological body enhancement" },
  { id: "atmospheric-processing", name: "Atmospheric Processing", description: "Terraforming or air generation" },
];

// Tectonic activity levels
export const TECTONIC_LEVELS = [
  { id: "none", name: "Geologically Dead", description: "No tectonic activity, like Mars" },
  { id: "minimal", name: "Minimal Activity", description: "Rare earthquakes, no active volcanism" },
  { id: "moderate", name: "Moderate Activity", description: "Earth-like plate tectonics" },
  { id: "high", name: "High Activity", description: "Frequent earthquakes and volcanic events" },
  { id: "extreme", name: "Extreme Activity", description: "Constant geological upheaval, like Io" },
];

// Real exoplanet examples for SF Examples section
export const EXOPLANET_EXAMPLES = [
  {
    name: "TRAPPIST-1e",
    type: "Potentially Habitable",
    starType: "M-Dwarf",
    distance: "39 light-years",
    characteristics: [
      "Earth-sized rocky planet",
      "Within habitable zone",
      "Likely tidally locked",
      "Part of 7-planet system",
      "Possible thin atmosphere",
    ],
    storyPotential: [
      "Permanent twilight zone between day and night",
      "Extreme temperature gradients create dramatic weather",
      "Civilizations clustered in terminator zone",
      "Red-tinted eternal sunset landscapes",
    ],
  },
  {
    name: "Proxima Centauri b",
    type: "Nearest Known Exoplanet",
    starType: "M-Dwarf",
    distance: "4.2 light-years",
    characteristics: [
      "Minimum mass 1.17 Earth masses",
      "11-day orbital period",
      "Subject to stellar flares",
      "Habitable zone location uncertain",
      "Possibly tidally locked",
    ],
    storyPotential: [
      "Closest potential colony target",
      "Flare events as plot devices",
      "Underground civilizations avoiding radiation",
      "First interstellar destination narratives",
    ],
  },
  {
    name: "TOI-715 b",
    type: "Super-Earth",
    starType: "M-Dwarf",
    distance: "137 light-years",
    characteristics: [
      "1.55 Earth radii",
      "Conservative habitable zone",
      "19-day orbital period",
      "Relatively cool M-dwarf host",
      "Potential for liquid water",
    ],
    storyPotential: [
      "Larger gravity affects human settlers",
      "Longer year but short day cycle",
      "Possible thick atmosphere",
      "Weather patterns on larger scale",
    ],
  },
  {
    name: "Kepler-452b",
    type: "Earth's Older Cousin",
    starType: "G-Type (Sun-like)",
    distance: "1,400 light-years",
    characteristics: [
      "60% larger than Earth",
      "385-day orbital period",
      "6 billion year old star",
      "Higher surface gravity",
      "Possible runaway greenhouse",
    ],
    storyPotential: [
      "What Earth might become",
      "Ancient civilizations (older star)",
      "Higher gravity culture",
      "Near-Earth-like conditions",
    ],
  },
  {
    name: "K2-18b",
    type: "Sub-Neptune/Hycean World",
    starType: "M-Dwarf",
    distance: "124 light-years",
    characteristics: [
      "2.6 Earth radii",
      "8.6 Earth masses",
      "Detected water vapor",
      "33-day orbital period",
      "Possible ocean world",
    ],
    storyPotential: [
      "Waterworld civilization",
      "Floating or underwater habitats",
      "Unique aquatic biology",
      "High-pressure ocean depths",
    ],
  },
];

// Section navigation configuration
export const PLANETARY_PROFILE_SECTIONS = [
  { id: "stellar-environment", title: "Stellar Environment" },
  { id: "physical-characteristics", title: "Physical Characteristics" },
  { id: "atmospheric-composition", title: "Atmospheric Composition" },
  { id: "hydrosphere", title: "Hydrosphere" },
  { id: "temperature-profile", title: "Temperature Profile" },
  { id: "habitability", title: "Habitability Assessment" },
  { id: "geological", title: "Geological Features" },
  { id: "three-pressures", title: "The Three Pressures" },
  { id: "narrative", title: "Narrative Integration" },
  { id: "sf-examples", title: "SF Examples" },
  { id: "consistency", title: "Consistency Check" },
];
