// ─── K-Scale: Kardashev Scale Calculator ─────────────────────────────
// Data, types, presets, and cascade content for the Kardashev Scale tool.
// No React dependencies — importable from PDF templates.

// ─── Types ────────────────────────────────────────────────────────────

export type KardashevLevel =
  | "sub-I"
  | "I"
  | "I-II"
  | "II"
  | "II-III"
  | "III"
  | "III+"
  | "omega";

export interface EnergySource {
  id: string;
  label: string;
  description: string;
  powerWatts: number; // typical power output in watts
  category: "planetary" | "stellar" | "galactic" | "exotic";
}

export interface CivilizationPreset {
  id: string;
  label: string;
  emoji: string;
  powerWatts: number;
  description: string;
  source: "real" | "historical" | "fictional";
  reference?: string;
}

export interface KardashevBand {
  level: KardashevLevel;
  label: string;
  minPower: number; // watts (log10)
  maxPower: number; // watts (log10)
  color: string;
  description: string;
  characteristics: string[];
}

export interface CascadeImplication {
  category: string;
  icon: string;
  implications: {
    level: KardashevLevel;
    text: string;
  }[];
}

export interface Section {
  id: string;
  title: string;
}

// ─── Sections ─────────────────────────────────────────────────────────

export const KARDASHEV_SECTIONS: Section[] = [
  { id: "presets", title: "Civilization Presets" },
  { id: "energy-inputs", title: "Energy Configuration" },
  { id: "results", title: "Classification Results" },
  { id: "energy-budget", title: "Energy Budget Breakdown" },
  { id: "cascade", title: "Cascade Implications" },
  { id: "story-notes", title: "Story Notes" },
];

export const SECTION_HELPERS: Record<string, string> = {
  presets: "Select a real or fictional civilization as a starting point, or configure from scratch.",
  "energy-inputs": "Set total energy consumption. Add energy sources to build up the budget.",
  results: "Where your civilization falls on the Kardashev Scale and what that means.",
  "energy-budget": "Break down how your civilization allocates its energy across sectors.",
  cascade: "How energy level cascades through governance, warfare, economics, and culture.",
  "story-notes": "Your narrative notes about what this energy level means for your story.",
};

// ─── Kardashev Bands ──────────────────────────────────────────────────

export const KARDASHEV_BANDS: KardashevBand[] = [
  {
    level: "sub-I",
    label: "Sub-Type I",
    minPower: 0,
    maxPower: 16,
    color: "#6B7280",
    description: "Pre-planetary civilization. Cannot harness the full energy output of its home planet.",
    characteristics: [
      "Dependent on fossil fuels or early nuclear",
      "Limited to surface of home planet",
      "Cannot prevent extinction-level events",
      "Fragmented governance",
      "Information technology emerging",
    ],
  },
  {
    level: "I",
    label: "Type I — Planetary",
    minPower: 16,
    maxPower: 17,
    color: "#3B82F6",
    description: "Planetary civilization. Commands the total energy resources of its home planet.",
    characteristics: [
      "Controls planetary weather and climate",
      "Complete energy independence from fossils",
      "Planetary-scale engineering projects",
      "Unified or federated governance likely",
      "Can prevent most natural disasters",
    ],
  },
  {
    level: "I-II",
    label: "Type I-II — Interplanetary",
    minPower: 17,
    maxPower: 24,
    color: "#8B5CF6",
    description: "Transitional civilization. Expanding beyond home planet but not yet commanding stellar output.",
    characteristics: [
      "Multi-planet colonization",
      "Early megastructures (orbital habitats, space elevators)",
      "Significant off-world industry",
      "Governance tensions between worlds",
      "Early stellar engineering experiments",
    ],
  },
  {
    level: "II",
    label: "Type II — Stellar",
    minPower: 24,
    maxPower: 26,
    color: "#F59E0B",
    description: "Stellar civilization. Commands the total energy output of its home star.",
    characteristics: [
      "Dyson swarm or equivalent stellar collector",
      "Star lifting and stellar engineering",
      "Effective immortality through technology",
      "Can survive home planet destruction",
      "Interstellar travel practical",
    ],
  },
  {
    level: "II-III",
    label: "Type II-III — Interstellar",
    minPower: 26,
    maxPower: 36,
    color: "#EF4444",
    description: "Transitional civilization. Expanding across multiple star systems.",
    characteristics: [
      "Multi-star colonization",
      "FTL communication or travel (if possible)",
      "Multiple Dyson swarms",
      "Galactic-scale political structures forming",
      "Encountering other civilizations likely",
    ],
  },
  {
    level: "III",
    label: "Type III — Galactic",
    minPower: 36,
    maxPower: 37,
    color: "#EC4899",
    description: "Galactic civilization. Commands the total energy output of its home galaxy.",
    characteristics: [
      "Controls hundreds of billions of stars",
      "Galactic-scale engineering",
      "May manipulate spacetime directly",
      "Effectively indestructible by natural means",
      "Dark energy/matter manipulation possible",
    ],
  },
  {
    level: "III+",
    label: "Type III+ — Intergalactic",
    minPower: 37,
    maxPower: 45,
    color: "#14B8A6",
    description: "Intergalactic civilization. Energy command spanning multiple galaxies or the cosmic web.",
    characteristics: [
      "Multi-galaxy presence",
      "Cosmic-scale engineering",
      "May approach physical limits of energy use",
      "Cosmological impact possible",
      "Transcendence threshold",
    ],
  },
  {
    level: "omega",
    label: "Type Omega",
    minPower: 45,
    maxPower: 50,
    color: "#FAFAFA",
    description: "Hypothetical. Commands energy on the scale of the observable universe or beyond.",
    characteristics: [
      "Universe-scale manipulation",
      "May create or modify physical constants",
      "Effectively godlike by any conventional measure",
      "Beyond meaningful classification",
      "Exists primarily in philosophical SF",
    ],
  },
];

// ─── Energy Sources ───────────────────────────────────────────────────

export const ENERGY_SOURCES: EnergySource[] = [
  // Planetary
  { id: "fossil-fuels", label: "Fossil Fuels", description: "Coal, oil, natural gas combustion", powerWatts: 1.8e13, category: "planetary" },
  { id: "nuclear-fission", label: "Nuclear Fission", description: "Uranium/thorium reactors", powerWatts: 2.7e12, category: "planetary" },
  { id: "solar-terrestrial", label: "Solar (Planetary)", description: "Ground and orbital solar arrays", powerWatts: 1.7e15, category: "planetary" },
  { id: "geothermal", label: "Geothermal", description: "Planetary core heat extraction", powerWatts: 4.4e13, category: "planetary" },
  { id: "wind-hydro", label: "Wind & Hydro", description: "Atmospheric and hydrological energy", powerWatts: 1.5e12, category: "planetary" },
  { id: "fusion-reactors", label: "Fusion Reactors", description: "Deuterium-tritium or advanced fusion", powerWatts: 1e15, category: "planetary" },
  { id: "antimatter", label: "Antimatter Annihilation", description: "Matter-antimatter reactions", powerWatts: 1e18, category: "planetary" },

  // Stellar
  { id: "dyson-swarm", label: "Dyson Swarm", description: "Partial stellar energy collection", powerWatts: 3.8e25, category: "stellar" },
  { id: "dyson-sphere", label: "Dyson Sphere", description: "Complete stellar energy capture", powerWatts: 3.8e26, category: "stellar" },
  { id: "star-lifting", label: "Star Lifting", description: "Extracting stellar material for fuel", powerWatts: 1e25, category: "stellar" },
  { id: "stellar-engine", label: "Stellar Engine", description: "Using a star as a propulsion system", powerWatts: 1e24, category: "stellar" },

  // Galactic
  { id: "quasar-tap", label: "Quasar Tap", description: "Extracting energy from active galactic nuclei", powerWatts: 1e40, category: "galactic" },
  { id: "black-hole-engine", label: "Black Hole Engine", description: "Penrose process or Hawking radiation harvesting", powerWatts: 1e36, category: "galactic" },
  { id: "galactic-dyson", label: "Galactic Dyson Array", description: "Dyson structures around multiple stars", powerWatts: 4e37, category: "galactic" },

  // Exotic
  { id: "vacuum-energy", label: "Vacuum Energy", description: "Zero-point energy extraction", powerWatts: 1e42, category: "exotic" },
  { id: "dark-energy", label: "Dark Energy Tap", description: "Harvesting cosmological expansion energy", powerWatts: 1e44, category: "exotic" },
  { id: "big-rip-engine", label: "Big Rip Engine", description: "Harnessing the accelerating expansion itself", powerWatts: 1e47, category: "exotic" },
];

// ─── Civilization Presets ─────────────────────────────────────────────

export const CIVILIZATION_PRESETS: CivilizationPreset[] = [
  // Real / Historical
  {
    id: "ancient-rome",
    label: "Ancient Rome",
    emoji: "🏛️",
    powerWatts: 3e9,
    description: "Peak Roman Empire (~100 CE). Human/animal labor, water mills, limited combustion.",
    source: "historical",
  },
  {
    id: "industrial-revolution",
    label: "Industrial Revolution",
    emoji: "🏭",
    powerWatts: 5e11,
    description: "Britain circa 1850. Coal-powered steam engines, early factories.",
    source: "historical",
  },
  {
    id: "earth-2025",
    label: "Earth (2025)",
    emoji: "🌍",
    powerWatts: 1.8e13,
    description: "Current human civilization. ~0.73 on the Kardashev scale.",
    source: "real",
  },
  {
    id: "earth-2100-optimistic",
    label: "Earth (2100, optimistic)",
    emoji: "🌐",
    powerWatts: 1e15,
    description: "Projected with fusion, extensive solar, and orbital infrastructure.",
    source: "real",
  },

  // Fictional
  {
    id: "star-trek-federation",
    label: "United Federation of Planets",
    emoji: "🖖",
    powerWatts: 1e27,
    description: "Multi-system civilization with matter-antimatter warp cores. ~Type II.",
    source: "fictional",
    reference: "Star Trek",
  },
  {
    id: "star-wars-empire",
    label: "Galactic Empire",
    emoji: "⚔️",
    powerWatts: 1e35,
    description: "Galaxy-spanning empire. Death Star alone represents ~Type II output.",
    source: "fictional",
    reference: "Star Wars",
  },
  {
    id: "the-culture",
    label: "The Culture",
    emoji: "🔮",
    powerWatts: 1e30,
    description: "Post-scarcity civilization with grid energy and hyperspace taps. High Type II.",
    source: "fictional",
    reference: "Iain M. Banks",
  },
  {
    id: "xeelee",
    label: "Xeelee",
    emoji: "✦",
    powerWatts: 1e42,
    description: "Cosmological-scale engineering. Manipulate spacetime at galactic scales. Type III+.",
    source: "fictional",
    reference: "Stephen Baxter",
  },
  {
    id: "timelords",
    label: "Time Lords",
    emoji: "⏳",
    powerWatts: 1e45,
    description: "Mastery of time itself. Eye of Harmony captures a black hole. Near-Omega.",
    source: "fictional",
    reference: "Doctor Who",
  },
  {
    id: "downstreamers",
    label: "Downstreamers",
    emoji: "∞",
    powerWatts: 1e48,
    description: "End-of-time descendants of humanity. Manipulate the timeline of the universe.",
    source: "fictional",
    reference: "Stephen Baxter",
  },
];

// ─── Energy Budget Categories ─────────────────────────────────────────

export interface BudgetCategory {
  id: string;
  label: string;
  description: string;
  defaultPercent: number;
}

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "infrastructure", label: "Infrastructure & Construction", description: "Building, maintaining, and expanding physical structures", defaultPercent: 25 },
  { id: "defense", label: "Defense & Warfare", description: "Military operations, shields, weapons systems", defaultPercent: 15 },
  { id: "research", label: "Research & Development", description: "Science, technology advancement, exploration", defaultPercent: 15 },
  { id: "life-support", label: "Life Support & Agriculture", description: "Food production, atmosphere, water, habitat maintenance", defaultPercent: 20 },
  { id: "transportation", label: "Transportation & Communication", description: "FTL drives, sublight engines, comm networks", defaultPercent: 10 },
  { id: "industry", label: "Industry & Manufacturing", description: "Resource extraction, fabrication, trade goods", defaultPercent: 10 },
  { id: "culture", label: "Culture & Quality of Life", description: "Entertainment, art, education, luxury", defaultPercent: 5 },
];

// ─── Cascade Implications ─────────────────────────────────────────────

export const CASCADE_CONTENT: CascadeImplication[] = [
  {
    category: "Governance",
    icon: "crown",
    implications: [
      { level: "sub-I", text: "Nation-states compete for finite resources. Governance fragmented by geography. War is about territory and energy access." },
      { level: "I", text: "Planetary unification likely (voluntary or imposed). Energy abundance reduces but doesn't eliminate conflict. Bureaucratic scale challenges." },
      { level: "II", text: "Post-scarcity governance. Authority derives from coordination, not resource control. AI governance becomes viable or necessary." },
      { level: "III", text: "Galactic-scale governance requires fundamentally alien political structures. Light-lag makes centralization impossible without FTL." },
    ],
  },
  {
    category: "Warfare",
    icon: "swords",
    implications: [
      { level: "sub-I", text: "Conventional and nuclear weapons. MAD deterrence. Wars last months to years." },
      { level: "I", text: "Planetary-scale weapons possible. Weather control as weapon. Cyber-physical warfare dominates." },
      { level: "II", text: "Stellar-scale weapons (nova bombs, focused stellar output). Single ships can sterilize planets. Deterrence requires equal capability." },
      { level: "III", text: "Galaxy-scale conflict. Relativistic kill vehicles. Weaponized physics (vacuum decay, strangelet bombs). War may be unthinkable or instantaneous." },
    ],
  },
  {
    category: "Economics",
    icon: "coins",
    implications: [
      { level: "sub-I", text: "Scarcity-based economics. Currency represents energy debt. Growth constrained by energy access." },
      { level: "I", text: "Approaching post-scarcity for basics. Scarcity shifts to information, status, and unique experiences." },
      { level: "II", text: "Post-material scarcity. Economy based on attention, creativity, and novelty. Energy is the fundamental unit of exchange." },
      { level: "III", text: "Economics as we understand it may not apply. Resource allocation at civilizational scale. Trade between Type II civilizations within the federation." },
    ],
  },
  {
    category: "Biology & Identity",
    icon: "dna",
    implications: [
      { level: "sub-I", text: "Biological constraints dominate. Life expectancy limited. Identity tied to physical body and birthplace." },
      { level: "I", text: "Genetic engineering widespread. Disease eliminated. Transhumanist modifications begin. Identity crisis at species level." },
      { level: "II", text: "Biology is a choice. Mind uploading possible. Multiple simultaneous embodiments. 'Species' becomes meaningless." },
      { level: "III", text: "Post-biological existence likely. Consciousness may operate on stellar-scale substrates. Individual identity may merge into collective." },
    ],
  },
  {
    category: "Culture & Mythology",
    icon: "scroll",
    implications: [
      { level: "sub-I", text: "Culture tied to geography and survival. Myths explain the unknown. Art reflects mortal concerns." },
      { level: "I", text: "Global culture emerges. Traditional religions adapt or decline. Planetary identity forms. Art explores post-scarcity existence." },
      { level: "II", text: "Deep time awareness. Myths become creation science. Culture spans millennia. Art may operate on stellar scales." },
      { level: "III", text: "Culture incomprehensible to sub-Type I minds. Mythology becomes physics. Art is reality engineering." },
    ],
  },
];

// ─── Growth Model Defaults ────────────────────────────────────────────

export const GROWTH_RATES = {
  conservative: { label: "Conservative", rate: 0.01, description: "1% annual growth (sustainability-focused)" },
  moderate: { label: "Moderate", rate: 0.025, description: "2.5% annual growth (current trajectory)" },
  aggressive: { label: "Aggressive", rate: 0.05, description: "5% annual growth (rapid expansion)" },
  exponential: { label: "Exponential", rate: 0.10, description: "10% annual growth (post-singularity)" },
} as const;

export type GrowthRateKey = keyof typeof GROWTH_RATES;
