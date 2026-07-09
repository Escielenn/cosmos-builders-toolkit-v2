// Surface Gravity Calculator, Data, Constants, Presets, and Cascade Content
// No React dependencies, importable from PDF templates

import type { Section } from "@/components/tools/SectionNavigation";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GravityRegime = "microgravity" | "low" | "earthlike" | "high" | "extreme";

export interface CompositionPreset {
  id: string;
  label: string;
  description: string;
  color: string; // for visualization
  /** Given mass in Earth masses, return radius in Earth radii */
  massToRadius: (mass: number) => number;
  /** Given radius in Earth radii, return mass in Earth masses */
  radiusToMass: (radius: number) => number;
}

export interface PlanetPreset {
  id: string;
  label: string;
  emoji: string;
  mass: number; // Earth masses
  radius: number; // Earth radii
  compositionPreset: string;
  source: "real" | "fictional";
  description: string;
  surfaceTemp?: number; // K
}

export interface AtmosphericPreset {
  id: string;
  label: string;
  molecularWeight: number; // g/mol
}

export interface GasData {
  id: string;
  name: string;
  formula: string;
  molecularWeight: number; // g/mol
  color: string;
}

export interface ReferenceWorld {
  name: string;
  gravity: number; // in g
  label?: string;
}

export interface DeltaVVerdict {
  maxDeltaV: number; // km/s
  label: string;
  color: string;
  description: string;
}

export interface CascadeBlock {
  regime: GravityRegime;
  heading: string;
  paragraphs: string[];
  prompts: string[];
}

export interface CascadeCategory {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  blocks: CascadeBlock[];
}

// ─── Gravity Regime Thresholds ───────────────────────────────────────────────

export const GRAVITY_REGIMES: { regime: GravityRegime; min: number; max: number; label: string; color: string }[] = [
  { regime: "microgravity", min: 0, max: 0.3, label: "Microgravity", color: "text-blue-400" },
  { regime: "low", min: 0.3, max: 0.7, label: "Low Gravity", color: "text-cyan-400" },
  { regime: "earthlike", min: 0.7, max: 1.5, label: "Earth-like", color: "text-green-400" },
  { regime: "high", min: 1.5, max: 3.0, label: "High Gravity", color: "text-amber-400" },
  { regime: "extreme", min: 3.0, max: Infinity, label: "Extreme Gravity", color: "text-red-400" },
];

export function getGravityRegimeInfo(g: number) {
  return GRAVITY_REGIMES.find((r) => g >= r.min && g < r.max) ?? GRAVITY_REGIMES[GRAVITY_REGIMES.length - 1];
}

// ─── Composition Presets ─────────────────────────────────────────────────────
// Mass-radius relations from Zeng et al. (2016, 2019)
// R = coefficient * M^exponent, with compression correction for M > 5

function massRadiusPowerLaw(coeff: number, exp: number) {
  return {
    massToRadius: (mass: number): number => {
      let r = coeff * Math.pow(mass, exp);
      if (mass > 5) r *= 1 - 0.03 * (mass - 5);
      return Math.max(r, 0.3);
    },
    radiusToMass: (radius: number): number => {
      // Invert R = coeff * M^exp → M = (R / coeff)^(1/exp)
      return Math.max(Math.pow(radius / coeff, 1 / exp), 0.01);
    },
  };
}

export const COMPOSITION_PRESETS: CompositionPreset[] = [
  {
    id: "custom",
    label: "Custom",
    description: "Both sliders independent, physically implausible combinations allowed",
    color: "#15C17B",
    massToRadius: (m) => m, // unused when custom
    radiusToMass: (r) => r, // unused when custom
  },
  {
    id: "iron-rich",
    label: "Iron-rich (Mercury-like)",
    description: "High density, small radius for mass. Dense metallic core.",
    color: "#8B8682",
    ...massRadiusPowerLaw(0.80, 0.267),
  },
  {
    id: "rocky",
    label: "Rocky (Earth-like)",
    description: "Baseline density ~5.5 g/cm³. Iron core + silicate mantle.",
    color: "#C4956A",
    ...massRadiusPowerLaw(1.0, 0.267),
  },
  {
    id: "ocean",
    label: "Ocean World",
    description: "Lower density ~3.5–4.0 g/cm³. Deep global ocean over rocky core.",
    color: "#1E6091",
    ...massRadiusPowerLaw(1.39, 0.267),
  },
  {
    id: "ice",
    label: "Ice World",
    description: "Low density ~2.0–3.0 g/cm³. Thick ice/volatile layers.",
    color: "#A8D8EA",
    ...massRadiusPowerLaw(1.52, 0.267),
  },
  {
    id: "super-earth",
    label: "Super-Earth (Rocky)",
    description: "Scaled Earth composition. Higher mass, proportionally larger.",
    color: "#D4A574",
    ...massRadiusPowerLaw(1.0, 0.267),
  },
  {
    id: "mini-neptune",
    label: "Mini-Neptune",
    description: "Gas envelope over rocky core. Very low surface gravity relative to mass.",
    color: "#5B7FBF",
    ...massRadiusPowerLaw(2.0, 0.30),
  },
];

// ─── Planet Presets ───────────────────────────────────────────────────────────

export const PLANET_PRESETS: PlanetPreset[] = [
  // Real worlds
  {
    id: "earth",
    label: "Earth",
    emoji: "🌍",
    mass: 1.0,
    radius: 1.0,
    compositionPreset: "rocky",
    source: "real",
    description: "The baseline. 1.0g, the gravity your readers know in their bones.",
    surfaceTemp: 288,
  },
  {
    id: "mars",
    label: "Mars",
    emoji: "🔴",
    mass: 0.107,
    radius: 0.532,
    compositionPreset: "rocky",
    source: "real",
    description: "0.38g, the colonist's world. Low enough to reshape human biology over generations.",
    surfaceTemp: 210,
  },
  {
    id: "moon",
    label: "Moon",
    emoji: "🌕",
    mass: 0.0123,
    radius: 0.273,
    compositionPreset: "rocky",
    source: "real",
    description: "0.16g, bounding strides and towering leaps. No atmosphere to retain.",
    surfaceTemp: 250,
  },
  {
    id: "kepler-442b",
    label: "Kepler-442b",
    emoji: "🪐",
    mass: 2.34,
    radius: 1.34,
    compositionPreset: "rocky",
    source: "real",
    description: "~1.3g, best known habitable zone super-Earth candidate. Noticeably heavier than home.",
    surfaceTemp: 233,
  },
  {
    id: "kepler-22b",
    label: "Kepler-22b",
    emoji: "🌊",
    mass: 9.1,
    radius: 2.4,
    compositionPreset: "ocean",
    source: "real",
    description: "Possible ocean world. Large but relatively low surface gravity for its mass.",
    surfaceTemp: 262,
  },
  // Fictional worlds
  {
    id: "arrakis",
    label: "Arrakis (Dune)",
    emoji: "🏜️",
    mass: 0.9,
    radius: 0.97,
    compositionPreset: "rocky",
    source: "fictional",
    description: "~0.9g, Herbert never specified, but the desert ecology and human performance suggest near-Earth gravity.",
  },
  {
    id: "mesklin",
    label: "Mesklin",
    emoji: "🪨",
    mass: 16.0,
    radius: 3.3,
    compositionPreset: "custom",
    source: "fictional",
    description: "Hal Clement's masterwork. 3g at equator, 700g at poles. The Mesklinites fear heights of even a few inches.",
  },
  {
    id: "pandora",
    label: "Pandora (Avatar)",
    emoji: "🌿",
    mass: 0.72,
    radius: 0.95,
    compositionPreset: "rocky",
    source: "fictional",
    description: "~0.8g, low enough for floating mountains (with unobtanium) and massive flying creatures.",
  },
];

// ─── Atmospheric Presets ─────────────────────────────────────────────────────

export const ATMOSPHERIC_PRESETS: AtmosphericPreset[] = [
  { id: "earth", label: "Earth-like (N₂/O₂)", molecularWeight: 29 },
  { id: "venus", label: "Venus-like (CO₂)", molecularWeight: 44 },
  { id: "hydrogen", label: "H₂-rich", molecularWeight: 2 },
  { id: "helium", label: "He-rich", molecularWeight: 4 },
  { id: "custom", label: "Custom", molecularWeight: 29 },
];

// ─── Gas Data for Atmospheric Retention ──────────────────────────────────────

export const GAS_DATA: GasData[] = [
  { id: "h2", name: "Hydrogen", formula: "H₂", molecularWeight: 2.016, color: "#60A5FA" },
  { id: "he", name: "Helium", formula: "He", molecularWeight: 4.003, color: "#A78BFA" },
  { id: "h2o", name: "Water", formula: "H₂O", molecularWeight: 18.015, color: "#22D3EE" },
  { id: "n2", name: "Nitrogen", formula: "N₂", molecularWeight: 28.014, color: "#34D399" },
  { id: "o2", name: "Oxygen", formula: "O₂", molecularWeight: 31.998, color: "#2ECC71" },
  { id: "co2", name: "Carbon Dioxide", formula: "CO₂", molecularWeight: 44.009, color: "#F59E0B" },
];

// ─── Reference Worlds for Gravity Scale Bar ──────────────────────────────────

export const REFERENCE_WORLDS: ReferenceWorld[] = [
  { name: "Moon", gravity: 0.166 },
  { name: "Mars", gravity: 0.379 },
  { name: "Venus", gravity: 0.905 },
  { name: "Earth", gravity: 1.0 },
  { name: "Kepler-442b", gravity: 1.3, label: "K-442b" },
  { name: "Jupiter", gravity: 2.528 },
];

// ─── Delta-V Verdicts ────────────────────────────────────────────────────────

export const DELTA_V_VERDICTS: DeltaVVerdict[] = [
  {
    maxDeltaV: 7,
    label: "Easy Access",
    color: "text-green-400",
    description: "Easier than Earth, your civilization reaches space with less effort. Expect early and widespread orbital infrastructure.",
  },
  {
    maxDeltaV: 12,
    label: "Comparable to Earth",
    color: "text-cyan-400",
    description: "Conventional rocketry works. Chemical propulsion can achieve orbit with practical mass ratios.",
  },
  {
    maxDeltaV: 20,
    label: "Significantly Harder",
    color: "text-amber-400",
    description: "Requires advanced propulsion or orbital infrastructure. Space elevators, railguns, or nuclear thermal rockets become necessary. Chemical rockets alone are marginal.",
  },
  {
    maxDeltaV: 30,
    label: "Extremely Difficult",
    color: "text-orange-400",
    description: "Chemical rockets are essentially useless. Civilization may be gravity-locked without exotic technology. Consider space elevators, laser propulsion, or orbital tethers as civilization-defining megaprojects.",
  },
  {
    maxDeltaV: Infinity,
    label: "GRAVITY-LOCKED",
    color: "text-red-400",
    description: "Effectively trapped. Reaching orbit requires physics-breaking technology or external rescue. This is one of the most profound worldbuilding choices in hard SF, intelligent beings who can see the cosmos but are imprisoned by their own world's mass.",
  },
];

// ─── Worldbuilding Cascade Content ───────────────────────────────────────────

export const CASCADE_CONTENT: CascadeCategory[] = [
  {
    id: "biology",
    label: "Biology",
    icon: "Dna",
    blocks: [
      {
        regime: "microgravity",
        heading: "Life Without Weight",
        paragraphs: [
          "In microgravity, organisms have essentially no structural constraints from gravity. Skeletal systems are vestigial or nonexistent. Bodies can be enormous, fragile, and three-dimensionally complex, think jellyfish-like forms the size of buildings.",
          "Flight costs almost nothing. Aerial or floating organisms dominate. Ground-dwelling body plans are an evolutionary dead end.",
          "Cardiovascular systems barely need to work against gravity. Blood pressure is low, hearts are small, and fainting from standing up is not a concept.",
        ],
        prompts: [
          "What body plan dominates your world? Without gravity to enforce bilateral symmetry, radial or asymmetric forms are plausible.",
          "How do organisms anchor themselves? In near-zero g, staying in one place may be harder than moving.",
        ],
      },
      {
        regime: "low",
        heading: "Graceful Giants",
        paragraphs: [
          "Organisms can grow tall and spindly. Expect elongated limbs, lighter skeletal structures, and larger wingspans. Flight is dramatically easier, flying creatures could be massive.",
          "Cardiovascular systems need less pressure to circulate blood. Bone density decreases over generations. Bodies trend toward graceful, elongated forms.",
          "Oceans are calmer with smaller waves. Tsunamis are less destructive. Mountains can grow much taller before crustal collapse, think Olympus Mons on Mars (0.38g).",
          "Vegetation grows tall and thin. Trees can reach extraordinary heights with minimal structural investment. Think: soaring canopies, delicate branching, world-forests.",
        ],
        prompts: [
          "How tall do your species grow? At 0.4g, a humanoid might naturally reach 2.5–3 meters.",
          "What flies on your world? At this gravity, creatures with 10-meter wingspans are aerodynamically plausible.",
          "How does the landscape differ? Mountains twice the height of Everest, with gentler erosion patterns.",
        ],
      },
      {
        regime: "earthlike",
        heading: "Familiar Constraints",
        paragraphs: [
          "Familiar biological constraints apply. This range allows the widest variety of Earth-analog body plans. Vertebrate designs, insect designs, and everything in between work here.",
          "Differentiate your biology through other environmental factors: atmosphere composition, light spectrum, available chemistry, day length, and seasonal extremes.",
          "The 0.7–1.5g window is where most habitable-zone terrestrial planets likely fall, making this the most common gravity regime for complex life in the universe.",
        ],
        prompts: [
          "Since gravity is near-Earth, what other environmental factors make your biology distinctive?",
          "Consider atmosphere, light spectrum, or biochemistry as your primary biological differentiators.",
        ],
      },
      {
        regime: "high",
        heading: "Built Like Tanks",
        paragraphs: [
          "Biology trends toward squat, dense, powerful builds. Expect thick bones, heavy musculature, low centers of gravity, and wide flat bodies. Flight requires enormous energy, flying creatures are small or nonexistent.",
          "Cardiovascular systems are under extreme strain. Hearts must pump harder; blood pressure is high. Beings tire quickly from vertical exertion. Spinal compression is a constant evolutionary pressure.",
          "Vegetation grows low and wide, no tall trees. Think: ground-hugging mats, thick woody shrubs, mushroom-like spreading structures. Root systems are massive and shallow.",
          "Water falls faster and hits harder. Rain is punishing. Rivers cut deeper. Erosion is accelerated. Waterfalls are violent.",
        ],
        prompts: [
          "How does your species compensate for the crushing weight? Multiple legs, hydraulic joints, or exoskeletal support?",
          "What does predation look like when everything is slow, heavy, and close to the ground?",
          "How do your species' hearts work? At 2g, a vertical circulatory system like humans have would cause constant problems.",
        ],
      },
      {
        regime: "extreme",
        heading: "The Crushing World",
        paragraphs: [
          "Multicellular life faces severe structural challenges above 3g. Expect armored, centipede-like body plans with distributed weight. Hydraulic rather than muscular movement becomes essential. Liquid-filled body cavities provide structural support.",
          "Vertical movement is energetically prohibitive. Life spreads horizontally. A fall of even a few body-lengths could be fatal.",
          "No vertebrate-style body plan is plausible above ~4–5g without radical biological innovation. Consider exotic biochemistry: silicon-based structures, metallic bones, fluid-filled pressure vessels.",
          "Vegetation, if it exists, is flat, mat-like, and structurally more like coral than trees. Nothing grows upward that doesn't have to.",
        ],
        prompts: [
          "Is complex life even possible at this gravity? What biological innovations make it work?",
          "Hal Clement's Mesklinites at 3g equatorial had caterpillar-like body plans and pathological fear of heights. What does your species fear?",
        ],
      },
    ],
  },
  {
    id: "psychology",
    label: "Psychology",
    icon: "Brain",
    blocks: [
      {
        regime: "microgravity",
        heading: "Thinking in Three Dimensions",
        paragraphs: [
          "Without a gravitational 'down,' spatial cognition is fully volumetric. These beings think in 3D naturally. Concepts like 'above' and 'below' may not exist in their language.",
          "Physical vulnerability, fragile bodies in a weightless environment, may drive cooperative social strategies or technological augmentation from early evolutionary stages.",
          "Motion is constant and effortless. Stillness may be the unusual state. Psychology may associate rest with danger and motion with safety.",
        ],
        prompts: [
          "How does your species navigate without a 'down'? Magnetic sense? Chemical trails? Echolocation?",
          "What is their equivalent of vertigo? In zero-g, disorientation might come from unexpected rotation rather than height.",
        ],
      },
      {
        regime: "low",
        heading: "The Sky Is Close",
        paragraphs: [
          "Beings from low-g worlds perceive vertical space differently. 'Up' is easy, exploration is three-dimensional. Fear of falling is diminished, a fall from human-lethal height is merely bruising here.",
          "Physical vulnerability from fragile, elongated bodies might drive cooperative social strategies or early tool use for protection.",
          "The ease of reaching high places could make your species psychologically comfortable with heights, open spaces, and vertical environments. Agoraphilia rather than agoraphobia.",
        ],
        prompts: [
          "How does reduced fear of falling change your species' relationship with risk?",
          "If 'up' is easy, does your species colonize vertical space naturally, cliffs, canopies, floating habitats?",
        ],
      },
      {
        regime: "earthlike",
        heading: "Familiar Psychology",
        paragraphs: [
          "Standard psychological frameworks apply. Fear of falling is calibrated to about 1g, a fall from 3 meters is dangerous but survivable. Height aversion exists but is manageable.",
          "The balance between horizontal and vertical movement is familiar. Your species navigates both planes with roughly equal comfort.",
          "Focus your psychological differentiation on other factors: social structure, sensory capabilities, lifespan, or cognitive architecture.",
        ],
        prompts: [
          "What non-gravitational factors most shape your species' psychology?",
          "How does their sensory world differ from ours? That may matter more than gravity at this range.",
        ],
      },
      {
        regime: "high",
        heading: "The Ground Is Safety",
        paragraphs: [
          "The ground is safety. Beings from high-g worlds may be psychologically averse to heights, open spaces, or unsupported structures. Claustrophilia, preference for enclosed, solid-walled spaces, is adaptive.",
          "Physical strength is baseline survival. Cultural values emphasize endurance, solidity, and permanence. Weakness is more than social stigma, it's a death sentence.",
          "The sky is impossibly far away. A civilization that has never easily looked up may develop fundamentally different cosmological thinking. The heavens are abstract, unreachable, alien.",
          "Patience is supreme. Everything takes more energy. Quick movements are wasteful. A high-g psychology likely values deliberation, efficiency, and conservation of effort.",
        ],
        prompts: [
          "Does your species have a concept of 'soaring' or 'flying free'? Or is that as alien to them as echolocation is to us?",
          "How does the constant physical burden shape their emotional baseline? Are they stoic by nature or psychology?",
        ],
      },
      {
        regime: "extreme",
        heading: "Prisoners of Weight",
        paragraphs: [
          "Psychology is dominated by the omnipresence of crushing weight. Every movement is effort. Rest is not leisure but recovery. The concept of 'lightness' may be literally incomprehensible.",
          "A fall of even a body-length could be crippling or fatal. Height phobia isn't a disorder, it's the dominant survival instinct. Mesklinites in Hal Clement's novel couldn't bear to be lifted even inches off the ground.",
          "These beings may have no concept of personal flight, no myths of angels or bird-people, no metaphor of 'rising above.' Their psychological metaphors all point sideways or downward.",
        ],
        prompts: [
          "What is the emotional experience of existing at 4+ g? Is there a baseline exhaustion that shapes all consciousness?",
          "How does your species conceptualize freedom? If they can't move upward, what does 'liberation' mean?",
        ],
      },
    ],
  },
  {
    id: "culture",
    label: "Culture & Tech",
    icon: "Building2",
    blocks: [
      {
        regime: "microgravity",
        heading: "Civilization in Free Fall",
        paragraphs: [
          "Architecture has no need for structural support, structures are pressure vessels, not weight-bearing. Cities are spherical or amorphous. 'Floor' and 'ceiling' are arbitrary.",
          "Manufacturing faces unique challenges: liquids form spheres, sedimentation doesn't work, convection doesn't drive cooling. But crystal growth is perfect, and zero-g materials science produces exotic alloys.",
          "Space travel is trivial, they're already in space, conceptually. The delta-v to orbit is negligible. Expect a civilization that expands rapidly into space.",
        ],
        prompts: [
          "How does zero-g architecture differ from every civilization your readers have imagined?",
          "What technologies develop first when gravity isn't a constraint? What technologies never develop?",
        ],
      },
      {
        regime: "low",
        heading: "Cities That Soar",
        paragraphs: [
          "Architecture soars. Impossibly tall, thin structures are stable. Cities might be vertical. Construction is easier, materials go further, cranes lift more, workers fatigue less.",
          "Reaching orbit is cheap. A space-faring civilization develops early. Expect widespread orbital infrastructure, space stations, and asteroid mining as routine industries.",
          "Sports and movement arts would be spectacular, imagine martial arts at 0.3g, or competitive flying with biological or mechanical wings.",
          "Transportation favors flight. Ground vehicles may be less common than personal aircraft or ballistic transit.",
        ],
        prompts: [
          "How tall is the tallest structure on your world? At 0.4g, a building a kilometer tall is structurally plausible.",
          "When did your civilization first reach orbit? With low delta-v, it could be centuries earlier than our own timeline.",
        ],
      },
      {
        regime: "earthlike",
        heading: "Familiar Infrastructure",
        paragraphs: [
          "Standard engineering principles apply. Architecture, transportation, and manufacturing follow patterns recognizable to Earth readers.",
          "Space access requires significant but achievable investment. Chemical rockets work. Your civilization's space timeline likely mirrors Earth's ±a few centuries.",
          "Differentiate through cultural priorities, available resources, and historical path rather than gravitational constraints.",
        ],
        prompts: [
          "What cultural or resource differences make your civilization's technology distinctive?",
        ],
      },
      {
        regime: "high",
        heading: "Built to Last",
        paragraphs: [
          "Architecture is bunker-like. Wide, squat, reinforced. Underground construction is preferred for structural stability. Multi-story buildings are rare and prestigious.",
          "Reaching orbit is the Great Challenge. A high-g civilization that achieves spaceflight has overcome enormous obstacles, they would value it profoundly. Their ships would be overbuilt by human standards.",
          "Manufacturing benefits from gravity: smelting, casting, and material separation processes work efficiently. Industrial chemistry is well-suited to this environment.",
          "Transportation is energy-intensive. Flight requires extreme power. Ground transport dominates. Wheeled vehicles are heavy and slow but reliable.",
        ],
        prompts: [
          "Is space access a civilization-defining achievement? A quasi-religious endeavor? A military project?",
          "How does heavy gravity shape warfare? Fortification is easy; mobility is hard. Siege warfare may dominate.",
          "If delta-v to orbit exceeds 20 km/s, your civilization may have advanced computing and materials science far beyond their spaceflight capability. A technologically sophisticated but gravity-locked world.",
        ],
      },
      {
        regime: "extreme",
        heading: "The Horizontal Empire",
        paragraphs: [
          "Civilization spreads horizontally, never vertically. Multi-story construction may be unknown. Roads are flat and wide. Everything is built low, dense, and strong.",
          "If delta-v to orbit exceeds 30 km/s, this civilization is effectively gravity-locked. They can see the stars but cannot reach them. This is one of the most poignant worldbuilding setups in science fiction.",
          "Technology may be extremely advanced in ground-based domains, computing, materials science, energy production, medicine, while space capability remains primitive or nonexistent.",
          "Trade and expansion follow surface routes only. Oceans, if they exist, are shallow and violent. Maritime technology is engineering at its most extreme.",
        ],
        prompts: [
          "How does your gravity-locked civilization react to receiving a radio signal from space? They know intelligence exists out there but they can never visit.",
          "What is their Fermi answer? They know why they haven't been visited, the universe is full of gravity-locked worlds.",
        ],
      },
    ],
  },
  {
    id: "mythology",
    label: "Mythology",
    icon: "Scroll",
    blocks: [
      {
        regime: "microgravity",
        heading: "Myths of Stillness",
        paragraphs: [
          "In a world of constant motion, stillness is sacred. Creation myths may center on the first moment of rest, the first solid anchor point, the first being that chose to stop.",
          "There is no 'fall from grace', gravity doesn't pull things down. Sin might be conceptualized as being stuck, trapped, or frozen in place rather than falling.",
          "Gods may be associated with stability, density, and mass rather than height and transcendence.",
        ],
        prompts: [
          "What is your species' creation myth? Without 'up' and 'down,' what is the primordial metaphor?",
          "What do they worship or aspire to? In zero-g, what plays the role that the sky plays in human mythology?",
        ],
      },
      {
        regime: "low",
        heading: "The Reachable Heavens",
        paragraphs: [
          "The sky is accessible. Myths treat the heavens as reachable, literal. Gods live in places you can visit. Ascension myths are practical, not metaphorical.",
          "Creation myths may describe beings who descended from the sky, and your species might take this literally, because going to the sky is something they can actually do.",
          "The boundary between 'earthly' and 'divine' is permeable. Your species' relationship with transcendence is hands-on, not abstract.",
        ],
        prompts: [
          "If your species can physically reach their 'heaven,' what did they find when they got there?",
          "How does accessible sky change their concept of death? Ascension isn't metaphorical, souls going 'up' is a physical direction they understand.",
        ],
      },
      {
        regime: "earthlike",
        heading: "Familiar Dualities",
        paragraphs: [
          "The sky is visible but unreachable without technology. Standard mythological frameworks work: heaven above, underworld below, mortal plane between.",
          "Build your mythology from cultural values, history, and sensory experience rather than gravitational extremes.",
        ],
        prompts: [
          "What unique aspects of your world's environment shape its mythology beyond gravity?",
        ],
      },
      {
        regime: "high",
        heading: "The Unreachable Sky",
        paragraphs: [
          "The sky is an unreachable domain. Myths may frame the heavens as forbidden, sacred, or belonging to beings fundamentally unlike the ground-dwellers.",
          "The concept of 'escape' carries enormous mythic weight. Heroes who defy gravity, who climb, who fly, who rise, are figures of radical transgression.",
          "The underworld may not be fearsome at all. Down is safe. Down is home. The terrifying direction is up.",
          "If your civilization has never seen a bird (because flight is impossible at this gravity), their myths have no winged angels, no sky-gods, no eagles bearing heroes aloft. What fills that mythic space instead?",
        ],
        prompts: [
          "What is the most forbidden act in your species' mythology? Is it attempting to reach the sky?",
          "How do they explain the stars? Distant, unreachable lights may be seen as trapped spirits, or eyes of vast beings, or anything other than 'places to go.'",
        ],
      },
      {
        regime: "extreme",
        heading: "The Weight of Existence",
        paragraphs: [
          "Existence itself is a burden, and mythology reflects this. Creation myths may describe the world being pressed into existence by an incomprehensible force.",
          "The gravity-locked civilization's mythology: they know the stars exist but cannot reach them. Their Fermi answer is built in. Their greatest myth may be the dream of weightlessness, an impossible paradise where nothing presses down.",
          "Heroes in their mythology don't slay dragons or sail seas, they endure. The supreme virtue is bearing the unbearable weight. Atlas doesn't hold up the sky; Atlas IS the sky.",
          "Death may be conceptualized not as falling but as finally being allowed to be still. Release from the constant effort of existence.",
        ],
        prompts: [
          "What is your species' concept of paradise? Is it weightlessness? Freedom from the crushing burden?",
          "How do they tell stories about beings from lighter worlds? Are low-g species mythologized as impossibly graceful, angelic, or fragile?",
        ],
      },
    ],
  },
];

// ─── Section Navigation ──────────────────────────────────────────────────────

export const SURFACE_GRAVITY_SECTIONS: Section[] = [
  { id: "presets", title: "1. Planet Presets" },
  { id: "primary-inputs", title: "2. Primary Inputs" },
  { id: "advanced", title: "3. Advanced" },
  { id: "results", title: "4. Results" },
  { id: "weight-comparisons", title: "5. Weight Comparisons" },
  { id: "atmospheric-retention", title: "6. Atmosphere" },
  { id: "delta-v", title: "7. Delta-V to Orbit" },
  { id: "visualization", title: "8. Visualization" },
  { id: "worldbuilding-cascade", title: "9. Cascade" },
  { id: "story-notes", title: "10. Story Notes" },
];

export const SECTION_HELPERS: Record<string, string> = {
  "presets": "Quick-select a known planet (real or fictional) to auto-populate all parameters.",
  "primary-inputs": "Set planet mass and radius. Choose a composition preset to link them via empirical mass-radius relations, or use Custom for full creative freedom.",
  "advanced": "Surface temperature affects atmospheric retention. Molecular weight sets the reference atmosphere.",
  "results": "Core gravitational data: surface gravity, escape velocity, orbital velocity, and mean density.",
  "weight-comparisons": "Intuitive comparisons for writers, how heavy is a person? How fast does something fall?",
  "atmospheric-retention": "Which gases can your planet hold? Based on Jeans escape: a planet retains gas if escape velocity exceeds 6× the gas's thermal velocity.",
  "delta-v": "How hard is it to reach orbit? The Tsiolkovsky rocket equation determines whether chemical rockets can work, or whether your civilization is gravity-locked.",
  "visualization": "Visual comparison of your planet to Earth, and where it falls on the gravity spectrum.",
  "worldbuilding-cascade": "The heart of this tool. Trace how gravity cascades through biology, psychology, mythology, and culture.",
  "story-notes": "Your notes on how gravity shapes your world's story.",
};
