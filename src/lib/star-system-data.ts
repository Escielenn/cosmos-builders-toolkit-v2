// Star System Builder Data
// Comprehensive options for designing multi-planet star systems

// Spectral Classes with detailed worldbuilding consequences
export const SPECTRAL_CLASSES = [
  {
    id: "o-type",
    name: "O-Type (Blue Giant)",
    temperature: "30,000-50,000 K",
    luminosity: "30,000-1,000,000 L",
    lifetime: "1-10 million years",
    description: "Extremely hot, massive, and short-lived blue giants",
    consequences: [
      "Intense UV radiation sterilizes nearby planets",
      "Massive stellar winds strip atmospheres",
      "Too short-lived for complex life to evolve",
      "Will explode as supernova",
      "Creates heavy elements for future systems",
    ],
    worldbuilding: "Ancient alien ruins from a race that knew their star would die. Desperate colonization attempts. Mining operations harvesting rare elements before the end.",
    examples: ["Alnitak", "Mintaka"],
  },
  {
    id: "b-type",
    name: "B-Type (Blue-White)",
    temperature: "10,000-30,000 K",
    luminosity: "25-30,000 L",
    lifetime: "10-100 million years",
    description: "Hot, luminous stars with short but not extreme lifetimes",
    consequences: [
      "High UV radiation requires adaptation",
      "Short lifetime limits evolution",
      "Wide habitable zones but unstable",
      "May host artificial habitats",
      "Spectacular night skies",
    ],
    worldbuilding: "Worlds colonized by ancient species before extinction. Terraforming projects abandoned when the star aged too quickly. Tomb worlds.",
    examples: ["Rigel", "Spica"],
  },
  {
    id: "a-type",
    name: "A-Type (White)",
    temperature: "7,500-10,000 K",
    luminosity: "5-25 L",
    lifetime: "0.4-2 billion years",
    description: "Bright white stars, often rapidly rotating",
    consequences: [
      "Possibly enough time for simple life",
      "High UV requires ozone layer or adaptation",
      "Often have debris disks",
      "Rapid rotation causes equatorial bulging",
      "Strong stellar winds",
    ],
    worldbuilding: "Young worlds with nascent life. Civilizations racing against time. Systems rich in asteroid resources from failed planet formation.",
    examples: ["Sirius A", "Vega", "Fomalhaut"],
  },
  {
    id: "f-type",
    name: "F-Type (Yellow-White)",
    temperature: "6,000-7,500 K",
    luminosity: "1.5-5 L",
    lifetime: "2-4 billion years",
    description: "Hotter and brighter than the Sun",
    consequences: [
      "Marginal time for complex life evolution",
      "Wider habitable zone than Sun",
      "Higher UV but manageable",
      "Good for terraforming targets",
      "Often have planetary systems",
    ],
    worldbuilding: "Worlds where evolution was accelerated. Civilizations that developed quickly or were seeded. Planets that feel 'almost right' but subtly wrong.",
    examples: ["Procyon A", "Tau Bootis", "Upsilon Andromedae"],
  },
  {
    id: "g-type",
    name: "G-Type (Yellow Dwarf)",
    temperature: "5,200-6,000 K",
    luminosity: "0.6-1.5 L",
    lifetime: "8-12 billion years",
    description: "Sun-like stars, the gold standard for habitability",
    consequences: [
      "Ample time for complex life to evolve",
      "Earth-like conditions possible",
      "Moderate habitable zone distance",
      "Relatively stable output",
      "Well-understood physics",
    ],
    worldbuilding: "The comfortable default. Human-compatible worlds. Parallel Earths with alternate histories. The kind of star we instinctively seek.",
    examples: ["Sun", "Alpha Centauri A", "Kepler-452"],
  },
  {
    id: "k-type",
    name: "K-Type (Orange Dwarf)",
    temperature: "3,900-5,200 K",
    luminosity: "0.08-0.6 L",
    lifetime: "15-45 billion years",
    description: "Cooler than the Sun but extremely long-lived",
    consequences: [
      "Very long-lived - multiple generations of civilizations possible",
      "Lower UV radiation than Sun",
      "More stable than G-types",
      "Narrower but comfortable habitable zone",
      "Excellent for long-term colonization",
    ],
    worldbuilding: "Ancient worlds with deep history. Civilizations that have risen and fallen many times. The patient stars that outlast empires.",
    examples: ["Alpha Centauri B", "Epsilon Eridani", "Tau Ceti"],
  },
  {
    id: "m-type",
    name: "M-Type (Red Dwarf)",
    temperature: "2,400-3,900 K",
    luminosity: "0.0001-0.08 L",
    lifetime: "50-200+ billion years",
    description: "Cool, dim stars that make up 70% of all stars",
    consequences: [
      "Extremely long-lived (effectively immortal)",
      "Habitable zone very close to star",
      "High probability of tidal locking",
      "Frequent stellar flares can sterilize planets",
      "Dim, red-shifted light affects photosynthesis",
    ],
    worldbuilding: "Twilight worlds of eternal dusk. Life that evolved in the dark. Civilizations that emerged from the shadow of their parent star. Plants that are black or purple to absorb dim light.",
    examples: ["Proxima Centauri", "TRAPPIST-1", "Barnard's Star"],
  },
  {
    id: "white-dwarf",
    name: "White Dwarf",
    temperature: "8,000-40,000 K (cooling)",
    luminosity: "0.0001-0.1 L",
    lifetime: "Cooling over trillions of years",
    description: "Stellar remnant, the core of a dead star",
    consequences: [
      "No longer undergoes fusion",
      "Extremely dense matter",
      "Habitable zone extremely close",
      "Former planetary system may survive",
      "Tidal forces can shred planets",
    ],
    worldbuilding: "Systems that survived their star's death. Civilizations clinging to dying embers. Archaeological treasures from the star's previous life. The long twilight.",
    examples: ["Sirius B", "Procyon B", "Van Maanen's Star"],
  },
  {
    id: "neutron-star",
    name: "Neutron Star/Pulsar",
    temperature: "600,000+ K (surface)",
    luminosity: "Varies, mostly X-ray",
    lifetime: "Cools over millions of years",
    description: "Ultra-dense remnant of a massive star's core",
    consequences: [
      "Extreme gravity warps spacetime",
      "Intense magnetic fields",
      "Deadly radiation beams (pulsars)",
      "Exotic physics environments",
      "Navigation beacons for interstellar travel",
    ],
    worldbuilding: "The ultimate hostile environment. Mining operations for exotic matter. Time dilation effects near the surface. Religious significance for species that worship the dead.",
    examples: ["PSR B1919+21", "Crab Pulsar"],
  },
];

// Binary/Multiple Star Configurations
export const STELLAR_CONFIGURATIONS = [
  {
    id: "single",
    name: "Single Star",
    description: "One star, the simplest configuration",
    consequences: [
      "Stable, predictable orbital mechanics",
      "Single day/night cycle",
      "Earth-like conditions easiest to achieve",
      "Standard habitable zone calculations apply",
    ],
    stability: "Very High",
  },
  {
    id: "close-binary",
    name: "Close Binary",
    description: "Two stars orbiting within ~1 AU of each other",
    consequences: [
      "Stars appear as one from planetary distances",
      "Planets orbit both stars (circumbinary)",
      "Complex but predictable orbits possible",
      "Variable illumination as stars eclipse",
      "Double sunrises/sunsets",
    ],
    stability: "Moderate to High",
  },
  {
    id: "wide-binary",
    name: "Wide Binary",
    description: "Two stars separated by 10+ AU",
    consequences: [
      "Planets may orbit one star (S-type) or both (P-type)",
      "Companion star appears as bright point in sky",
      "Long orbital periods for the binary",
      "Complex seasonal variations",
      "Two distinct 'suns' visible",
    ],
    stability: "Moderate",
  },
  {
    id: "hierarchical-triple",
    name: "Hierarchical Triple",
    description: "Close binary with distant third companion",
    consequences: [
      "Most stable triple configuration",
      "Three distinct light sources possible",
      "Complex shadow patterns",
      "May have stable planetary orbits",
      "Rich mythology potential",
    ],
    stability: "Moderate",
  },
  {
    id: "trinary",
    name: "Trinary (Three-Body)",
    description: "Three stars in complex orbital dance",
    consequences: [
      "Highly unstable over long periods",
      "Chaotic climate variations",
      "Stars may be ejected eventually",
      "Spectacular but dangerous",
      "Short-term habitation only",
    ],
    stability: "Low",
  },
  {
    id: "quadruple",
    name: "Quadruple/Higher",
    description: "Four or more stars in hierarchical arrangement",
    consequences: [
      "Must be hierarchical to be stable",
      "Usually two binary pairs orbiting each other",
      "Exotic sky phenomena",
      "Complex navigation challenges",
      "Multiple habitable zones possible",
    ],
    stability: "Low to Moderate (if hierarchical)",
  },
];

// Planetary Body Types
export const PLANETARY_BODY_TYPES = [
  {
    id: "terrestrial",
    name: "Terrestrial (Rocky)",
    description: "Earth-like rocky planets with solid surfaces",
    subtypes: [
      { id: "earth-like", name: "Earth-like", description: "Similar size and composition to Earth" },
      { id: "super-earth", name: "Super-Earth", description: "1.5-10 Earth masses, rocky" },
      { id: "sub-earth", name: "Sub-Earth", description: "Smaller than Earth (Mars-like)" },
      { id: "mercury-type", name: "Mercury-type", description: "Small, dense, close to star" },
    ],
    consequences: [
      "Potential for surface life",
      "Can retain atmospheres",
      "May have plate tectonics",
      "Resource extraction possible",
    ],
  },
  {
    id: "gas-giant",
    name: "Gas Giant",
    description: "Massive planets dominated by hydrogen/helium",
    subtypes: [
      { id: "jupiter-like", name: "Jupiter-like", description: "Cold gas giants with bands and storms" },
      { id: "hot-jupiter", name: "Hot Jupiter", description: "Gas giant very close to star" },
      { id: "saturn-like", name: "Saturn-like", description: "Lower density, prominent rings" },
      { id: "sub-saturn", name: "Sub-Saturn", description: "Neptune-sized but gas-dominated" },
    ],
    consequences: [
      "No solid surface",
      "Many moons possible",
      "Powerful radiation belts",
      "Atmospheric mining opportunities",
      "Gravitational shepherding of system",
    ],
  },
  {
    id: "ice-giant",
    name: "Ice Giant",
    description: "Large planets with water/ammonia/methane ice",
    subtypes: [
      { id: "neptune-like", name: "Neptune-like", description: "Blue-green, distant, cold" },
      { id: "uranus-like", name: "Uranus-like", description: "Tilted, mild appearance" },
      { id: "mini-neptune", name: "Mini-Neptune", description: "Smaller ice giants" },
    ],
    consequences: [
      "Exotic atmospheric chemistry",
      "Diamond rain in deep atmosphere",
      "Interesting moons in outer system",
      "Less radiation than gas giants",
    ],
  },
  {
    id: "dwarf-planet",
    name: "Dwarf Planet",
    description: "Small bodies that haven't cleared their orbit",
    subtypes: [
      { id: "pluto-type", name: "Pluto-type", description: "Kuiper belt objects with nitrogen ice" },
      { id: "ceres-type", name: "Ceres-type", description: "Asteroid belt dwarf planets" },
      { id: "sedna-type", name: "Sedna-type", description: "Distant, eccentric orbits" },
    ],
    consequences: [
      "Low gravity challenges",
      "Potential water ice resources",
      "Distant outposts and research stations",
      "Prison colonies or exile locations",
    ],
  },
  {
    id: "asteroid-belt",
    name: "Asteroid Belt",
    description: "Region of rocky/metallic debris",
    subtypes: [
      { id: "inner-belt", name: "Inner Belt", description: "Between terrestrial and gas giant zones" },
      { id: "kuiper-belt", name: "Kuiper Belt", description: "Icy bodies beyond gas giants" },
      { id: "oort-cloud", name: "Oort Cloud", description: "Distant cometary reservoir" },
    ],
    consequences: [
      "Rich mining opportunities",
      "Navigation hazards",
      "Habitat construction materials",
      "Hidden bases and outposts",
    ],
  },
  {
    id: "rogue-planet",
    name: "Rogue Planet",
    description: "Planet not bound to any star",
    subtypes: [
      { id: "ejected-terrestrial", name: "Ejected Terrestrial", description: "Rocky world cast out" },
      { id: "ejected-giant", name: "Ejected Giant", description: "Gas giant wandering space" },
      { id: "primordial", name: "Primordial", description: "Never captured by a star" },
    ],
    consequences: [
      "No stellar energy - must rely on internal heat",
      "Eternal darkness on surface",
      "Could pass through system temporarily",
      "Subsurface oceans possible from radioactive decay",
    ],
  },
];

// Orbital Zone Classifications
export const ORBITAL_ZONES = [
  {
    id: "inner-system",
    name: "Inner System",
    description: "Inside the habitable zone, close to the star",
    characteristics: [
      "High temperatures",
      "Short orbital periods",
      "High radiation exposure",
      "Tidal locking common",
    ],
    typicalBodies: ["Mercury-type planets", "Hot Jupiters", "Vulcanoid asteroids"],
  },
  {
    id: "habitable-zone",
    name: "Habitable Zone",
    description: "The 'Goldilocks zone' where liquid water can exist",
    characteristics: [
      "Moderate temperatures",
      "Potential for life",
      "Most valuable real estate",
      "Prime terraforming targets",
    ],
    typicalBodies: ["Earth-like planets", "Super-Earths", "Habitable moons"],
  },
  {
    id: "outer-system",
    name: "Outer System",
    description: "Beyond the habitable zone, cold and distant",
    characteristics: [
      "Low temperatures",
      "Long orbital periods",
      "Ice-dominated chemistry",
      "Resource-rich",
    ],
    typicalBodies: ["Gas giants", "Ice giants", "Dwarf planets", "Comets"],
  },
  {
    id: "frost-line",
    name: "Frost Line",
    description: "Boundary where water ice becomes stable",
    characteristics: [
      "Divides rocky from icy formation",
      "Gas giants typically form beyond",
      "Critical for system architecture",
      "Varies with stellar luminosity",
    ],
    typicalBodies: ["Gas giant migration zone", "Main asteroid belt"],
  },
];

// Orbital Resonance Patterns
export const ORBITAL_RESONANCES = [
  {
    id: "no-resonance",
    name: "No Significant Resonance",
    description: "Planets orbit independently without synchronized periods",
    stability: "Generally stable if well-separated",
    consequences: ["Simple orbital mechanics", "Predictable conjunctions", "Standard navigation"],
  },
  {
    id: "2-1",
    name: "2:1 Resonance",
    description: "One planet completes two orbits for every one of another",
    stability: "Can be stable or unstable depending on configuration",
    consequences: ["Regular gravitational tugs", "Potential for orbital migration", "Creates gaps in debris disks"],
    examples: ["Jupiter-Saturn (near 5:2)", "Io-Europa"],
  },
  {
    id: "3-2",
    name: "3:2 Resonance",
    description: "One planet completes three orbits for every two of another",
    stability: "Often stable",
    consequences: ["Moderate gravitational interaction", "Can protect against ejection"],
    examples: ["Pluto-Neptune"],
  },
  {
    id: "laplace",
    name: "Laplace Resonance (4:2:1)",
    description: "Three bodies in synchronized orbits",
    stability: "Remarkably stable over billions of years",
    consequences: ["Tidal heating of inner bodies", "Complex eclipse patterns", "Spectacular conjunctions"],
    examples: ["Io-Europa-Ganymede", "TRAPPIST-1 system (near-chain)"],
  },
  {
    id: "resonant-chain",
    name: "Resonant Chain",
    description: "Multiple planets all in resonance with neighbors",
    stability: "Stable but delicate - disruption affects entire chain",
    consequences: ["Extremely organized system", "Suggests gentle formation history", "Spectacular orbital mechanics"],
    examples: ["TRAPPIST-1 (7 planets)", "Kepler-223"],
  },
];

// System Age Categories
export const SYSTEM_AGES = [
  {
    id: "protoplanetary",
    name: "Protoplanetary (< 10 million years)",
    description: "Still forming, disk of gas and dust present",
    characteristics: [
      "Planets still accreting",
      "Heavy bombardment ongoing",
      "No stable surfaces yet",
      "Giant impacts common",
    ],
    worldbuilding: "Primordial chaos. Watching a solar system being born. Time-dilated observers from ancient civilizations.",
  },
  {
    id: "young",
    name: "Young (10 million - 1 billion years)",
    description: "Planets formed but still settling",
    characteristics: [
      "Late heavy bombardment possible",
      "Atmospheres still evolving",
      "Moons still forming/captured",
      "Magnetic fields establishing",
    ],
    worldbuilding: "Volatile worlds still finding their rhythm. Early life struggling to survive. The dawn of possibilities.",
  },
  {
    id: "mature",
    name: "Mature (1-5 billion years)",
    description: "Stable, Earth-like age",
    characteristics: [
      "Complex life possible",
      "Stable climate patterns",
      "Geological activity ongoing",
      "Civilizations could arise",
    ],
    worldbuilding: "The sweet spot. Worlds teeming with life. The age of empires and first contact.",
  },
  {
    id: "old",
    name: "Old (5-10 billion years)",
    description: "Ancient but still viable",
    characteristics: [
      "Geological activity slowing",
      "Atmosphere potentially escaping",
      "Ancient civilizations possible",
      "Resources may be depleted",
    ],
    worldbuilding: "Worlds past their prime. Ancient races contemplating the end. Dying empires and final legacies.",
  },
  {
    id: "stellar-death",
    name: "Post-Main-Sequence",
    description: "Star is dying or dead",
    characteristics: [
      "Habitable zone shifting/gone",
      "Planetary orbits destabilized",
      "Mass loss affecting system",
      "Final chapter for any life",
    ],
    worldbuilding: "The long goodbye. Civilizations evacuating or accepting the end. Tombs and monuments to what was.",
  },
];

// Science Fiction Examples for Inspiration
export const SF_SYSTEM_EXAMPLES = [
  {
    name: "Tatooine (Star Wars)",
    configuration: "Close Binary",
    description: "Desert planet orbiting twin suns, famous for double sunset",
    notable: "Shows how binary systems create iconic imagery and harsh conditions",
  },
  {
    name: "Trisolaris (Three-Body Problem)",
    configuration: "Trinary",
    description: "Chaotic triple-star system with unpredictable 'Stable' and 'Chaotic' eras",
    notable: "Explores how orbital instability shapes civilization and psychology",
  },
  {
    name: "TRAPPIST-1 (Real)",
    configuration: "Single (M-dwarf)",
    description: "Seven Earth-sized planets in tight resonant chain around red dwarf",
    notable: "Real system with multiple potentially habitable worlds",
  },
  {
    name: "Alpha Centauri (Real)",
    configuration: "Hierarchical Triple",
    description: "Two Sun-like stars with distant red dwarf (Proxima)",
    notable: "Nearest star system to Earth, with confirmed exoplanet",
  },
  {
    name: "Kalgash (Nightfall)",
    configuration: "Sextuple",
    description: "Six suns ensure constant daylight - darkness drives civilization mad",
    notable: "Explores psychological impact of stellar configuration",
  },
  {
    name: "Epsilon Eridani (Real)",
    configuration: "Single (K-dwarf)",
    description: "Young K-dwarf with asteroid belts and possible planets",
    notable: "Featured in many SF works as nearby, potentially habitable system",
  },
  {
    name: "Ringworld System (Niven)",
    configuration: "Single (G-type)",
    description: "Artificial megastructure orbiting a Sun-like star",
    notable: "Megastructures can replace planets entirely",
  },
];

// Formation Scenarios
export const FORMATION_SCENARIOS = [
  {
    id: "standard",
    name: "Standard Accretion",
    description: "Typical planetary formation from protoplanetary disk",
    results: ["Rocky inner planets", "Gas giants beyond frost line", "Asteroid belt", "Outer ice giants"],
  },
  {
    id: "hot-jupiter-migration",
    name: "Hot Jupiter Migration",
    description: "Gas giant formed far out, migrated inward",
    results: ["Gas giant very close to star", "Inner planets destroyed or ejected", "Unusual architecture"],
  },
  {
    id: "grand-tack",
    name: "Grand Tack",
    description: "Jupiter migrated in then back out (like our system)",
    results: ["Sculpted asteroid belt", "Mars stayed small", "Earth got water delivery"],
  },
  {
    id: "capture",
    name: "Captured Bodies",
    description: "Some planets were captured from passing systems",
    results: ["Unusual orbital inclinations", "Retrograde orbits possible", "Different compositions"],
  },
  {
    id: "collision",
    name: "Giant Impact",
    description: "Major collision shaped the system",
    results: ["Unusual axial tilts", "Large moons from debris", "Planetary rings", "Merged planets"],
  },
];

// Moons and Ring Systems
export const MOON_TYPES = [
  {
    id: "captured",
    name: "Captured",
    description: "Asteroid or dwarf planet captured by gravity",
    characteristics: ["Irregular orbit", "Often retrograde", "Different composition than planet"],
    examples: ["Triton", "Phobos", "Deimos"],
  },
  {
    id: "co-formation",
    name: "Co-formation",
    description: "Formed from same material as planet",
    characteristics: ["Regular orbit", "Similar composition", "Often tidally locked"],
    examples: ["Galilean moons", "Titan", "Major Saturnian moons"],
  },
  {
    id: "impact",
    name: "Impact-Generated",
    description: "Created by giant impact ejecting material",
    characteristics: ["Large relative to planet", "Close orbit", "Similar composition to planet's mantle"],
    examples: ["Earth's Moon", "Charon (possibly)"],
  },
  {
    id: "shepherd",
    name: "Shepherd Moon",
    description: "Small moon that shapes planetary rings",
    characteristics: ["Very small", "Embedded in or near rings", "Critical for ring structure"],
    examples: ["Pan", "Daphnis", "Prometheus"],
  },
];

export const RING_TYPES = [
  {
    id: "major",
    name: "Major Ring System",
    description: "Prominent, visible rings like Saturn's",
    composition: "Mostly water ice with rock",
    stability: "Millions to billions of years",
  },
  {
    id: "dusty",
    name: "Dusty Rings",
    description: "Faint rings of small particles",
    composition: "Dust and small debris",
    stability: "Must be replenished by moons/impacts",
  },
  {
    id: "debris",
    name: "Debris Ring",
    description: "Ring from recent moon destruction",
    composition: "Rock and ice fragments",
    stability: "Temporary - will disperse or re-accrete",
  },
];

// Habitable Zone Modifiers
export const HZ_MODIFIERS = [
  {
    id: "greenhouse",
    name: "Strong Greenhouse Effect",
    effect: "Extends habitable zone outward",
    description: "Thick CO2 or other greenhouse gases trap heat",
  },
  {
    id: "tidal-heating",
    name: "Tidal Heating",
    effect: "Creates subsurface habitability beyond HZ",
    description: "Gravitational flexing from moons or star heats interior",
  },
  {
    id: "albedo",
    name: "High Albedo",
    effect: "Shifts habitable zone inward",
    description: "Reflective clouds or ice cool the planet",
  },
  {
    id: "atmospheric-escape",
    name: "Atmospheric Escape",
    effect: "Reduces long-term habitability",
    description: "Small planets or close orbits lose atmosphere over time",
  },
  {
    id: "magnetic-field",
    name: "Strong Magnetic Field",
    effect: "Protects habitability",
    description: "Shields atmosphere from stellar wind stripping",
  },
];

// Numeric defaults for each spectral class, used for HZ calculations and diagrams.
// Values are representative midpoints (geometric mean) of the ranges in SPECTRAL_CLASSES.
// spectralLetter maps to SPECTRAL_COLORS keys used by OrbitalDiagram.
export const SPECTRAL_CLASS_NUMERIC_DEFAULTS: Record<string, { luminosity: number; mass: number; spectralLetter: string }> = {
  "o-type":       { luminosity: 170000,  mass: 40,   spectralLetter: "O" },
  "b-type":       { luminosity: 870,     mass: 10,   spectralLetter: "B" },
  "a-type":       { luminosity: 11,      mass: 2.5,  spectralLetter: "A" },
  "f-type":       { luminosity: 2.7,     mass: 1.4,  spectralLetter: "F" },
  "g-type":       { luminosity: 1.0,     mass: 1.0,  spectralLetter: "G" },
  "k-type":       { luminosity: 0.22,    mass: 0.7,  spectralLetter: "K" },
  "m-type":       { luminosity: 0.003,   mass: 0.3,  spectralLetter: "M" },
  "white-dwarf":  { luminosity: 0.003,   mass: 0.6,  spectralLetter: "G" },
  "neutron-star": { luminosity: 0,       mass: 1.4,  spectralLetter: "G" },
};
