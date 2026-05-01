// Space Expansion Modeler - Data Constants
// Section navigation, force categories, modifier types, templates, SF examples

import type { Section } from "@/components/tools/SectionNavigation";

// ─── Type Definitions ───────────────────────────────────────────────

export type ForceCategory =
  | "industrial"
  | "governmental"
  | "religious"
  | "economic"
  | "social"
  | "scientific";

export type ModifierType =
  | "wall"
  | "gap"
  | "barrier"
  | "catalyst"
  | "driver"
  | "pursuit";

export type InteractionResult =
  | "synergy"
  | "tension"
  | "conflict"
  | "neutral"
  | "";

export type ForceDirection = "driving" | "resisting" | "neutral";

export type TrajectoryType =
  | "accelerating"
  | "decelerating"
  | "stalled"
  | "cyclical"
  | "exponential"
  | "";

export type InfrastructureLevel =
  | "outpost"
  | "settlement"
  | "colony"
  | "civilization"
  | "";

export type ExpansionPhaseId =
  | "earth-orbit"
  | "luna"
  | "mars"
  | "belt"
  | "outer"
  | "interstellar";

// ─── Sub-interfaces ─────────────────────────────────────────────────

export interface Foundation {
  expansionName: string;
  oneBigLie: string;
  originCivilization: string;
  startYear: string;
  startingConditions: string;
}

export interface ExpansionPhase {
  id: ExpansionPhaseId;
  name: string;
  reached: boolean;
  yearReached: string;
  milestone: string;
  infrastructureLevel: InfrastructureLevel;
  population: string;
  selfSufficiency: number;
  description: string;
}

export interface ForceConfig {
  phaseId: ExpansionPhaseId;
  forceCategory: ForceCategory;
  intensity: number;
  direction: ForceDirection;
  description: string;
  keyActors: string;
  dependencies: string;
}

export interface ModifierNode {
  id: string;
  name: string;
  type: ModifierType;
  affectedPhases: ExpansionPhaseId[];
  affectedForces: ForceCategory[];
  yearOccurred: string;
  description: string;
  impact: string;
  severity: "minor" | "moderate" | "major" | "fundamental" | "";
  resolution: string;
}

export interface ConsequenceCell {
  forceA: ForceCategory;
  forceB: ForceCategory;
  interaction: InteractionResult;
  description: string;
  narrativeHook: string;
}

export interface ConsequenceMatrix {
  phaseId: ExpansionPhaseId;
  cells: ConsequenceCell[];
}

export interface MoodboardImage {
  id: string;
  url: string;
}

// ─── Main FormState ─────────────────────────────────────────────────

export interface FormState {
  foundation: Foundation;
  phases: ExpansionPhase[];
  forces: ForceConfig[];
  modifiers: ModifierNode[];
  consequenceMatrices: ConsequenceMatrix[];
  synthesis: {
    dominantForce: string;
    overallTrajectory: TrajectoryType;
    biggestTensionPoint: string;
    narrativeTheme: string;
    storyHooks: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

// ─── Section Navigation ─────────────────────────────────────────────

export const SPACE_EXPANSION_SECTIONS: Section[] = [
  { id: "section-examples", title: "SF Examples" },
  { id: "section-templates", title: "Quick-Start Templates" },
  { id: "section-foundation", title: "1. Foundation" },
  { id: "section-phases", title: "2. Expansion Phases" },
  { id: "section-forces", title: "3. Force Configuration" },
  { id: "section-modifiers", title: "4. Expansion Modifiers" },
  { id: "section-matrix", title: "5. Consequence Matrix" },
  { id: "section-synthesis", title: "Synthesis" },
];

// ─── Force Categories ───────────────────────────────────────────────

export interface ForceCategoryDef {
  id: ForceCategory;
  name: string;
  description: string;
  tailwindColor: string;
  hex: string;
  thinkLike: string;
}

export const FORCE_CATEGORIES: ForceCategoryDef[] = [
  {
    id: "industrial",
    name: "Industrial",
    description: "Mining, manufacturing, resource extraction, supply chains, infrastructure, automation, labor",
    tailwindColor: "text-amber-400",
    hex: "#F59E0B",
    thinkLike: "Think like a logistics engineer or factory owner",
  },
  {
    id: "governmental",
    name: "Governmental",
    description: "National/international policy, military priorities, regulation, treaties, sovereignty, colonial admin",
    tailwindColor: "text-red-500",
    hex: "#DC2626",
    thinkLike: "Think like a senator, admiral, or colonial governor",
  },
  {
    id: "religious",
    name: "Religious / Ideological",
    description: "Theological justifications, cosmic significance, prohibitions, utopian visions, existential meaning",
    tailwindColor: "text-fuchsia-400",
    hex: "#D946EF",
    thinkLike: "Think like a prophet, cult leader, or ideological revolutionary",
  },
  {
    id: "economic",
    name: "Economic",
    description: "Funding mechanisms, ROI timelines, market creation, wealth distribution, cost curves, speculation",
    tailwindColor: "text-emerald-400",
    hex: "#10B981",
    thinkLike: "Think like a venture capitalist or central banker",
  },
  {
    id: "social",
    name: "Social",
    description: "Population pressure, cultural attitudes toward risk, migration, frontier mythology, demographics",
    tailwindColor: "text-cyan-400",
    hex: "#06B6D4",
    thinkLike: "Think like a sociologist or migration historian",
  },
  {
    id: "scientific",
    name: "Scientific / Technological",
    description: "Capability enabling, breakthrough dependencies, research priorities, innovation ecosystems",
    tailwindColor: "text-neutral-200",
    hex: "#E5E5E5",
    thinkLike: "Think like a research director or chief engineer",
  },
];

export const getForceDef = (id: ForceCategory): ForceCategoryDef =>
  FORCE_CATEGORIES.find((f) => f.id === id) || FORCE_CATEGORIES[0];

// ─── Modifier Types ─────────────────────────────────────────────────

export interface ModifierTypeDef {
  id: ModifierType;
  name: string;
  description: string;
  color: string;
  hex: string;
}

export const MODIFIER_TYPES: ModifierTypeDef[] = [
  {
    id: "wall",
    name: "Wall",
    description: "Hard physical, technological, or biological limit that cannot be overcome without fundamental breakthroughs",
    color: "text-red-500",
    hex: "#DC2626",
  },
  {
    id: "gap",
    name: "Gap",
    description: "Missing capability, infrastructure, or knowledge that must be developed but is achievable",
    color: "text-yellow-400",
    hex: "#FACC15",
  },
  {
    id: "barrier",
    name: "Barrier",
    description: "Political, economic, social, or ideological obstacle that is surmountable but requires significant effort",
    color: "text-orange-400",
    hex: "#FB923C",
  },
  {
    id: "catalyst",
    name: "Catalyst",
    description: "Event, discovery, or circumstance that suddenly accelerates expansion",
    color: "text-emerald-400",
    hex: "#10B981",
  },
  {
    id: "driver",
    name: "Driver",
    description: "Ongoing motivation that sustains expansion momentum over time",
    color: "text-cyan-400",
    hex: "#06B6D4",
  },
  {
    id: "pursuit",
    name: "Pursuit",
    description: "Specific goal that shapes the direction and character of expansion",
    color: "text-fuchsia-400",
    hex: "#D946EF",
  },
];

export const getModifierDef = (id: ModifierType): ModifierTypeDef =>
  MODIFIER_TYPES.find((m) => m.id === id) || MODIFIER_TYPES[0];

// ─── Default Phases ─────────────────────────────────────────────────

export interface PhaseDef {
  id: ExpansionPhaseId;
  name: string;
  description: string;
}

export const DEFAULT_PHASES: PhaseDef[] = [
  { id: "earth-orbit", name: "Earth Orbit", description: "Space stations, tourism, early orbital industry" },
  { id: "luna", name: "Luna", description: "Lunar mining, manufacturing, waystation operations" },
  { id: "mars", name: "Mars", description: "First interplanetary settlement, terraforming attempts" },
  { id: "belt", name: "Asteroid Belt", description: "Asteroid mining, distributed habitats, belt culture" },
  { id: "outer", name: "Outer System", description: "Jupiter/Saturn moons, Kuiper Belt, deep-space stations" },
  { id: "interstellar", name: "Interstellar", description: "Generation ships, probes, first stars" },
];

// ─── Force Direction Options ────────────────────────────────────────

export const FORCE_DIRECTIONS: { value: ForceDirection; label: string; description: string }[] = [
  { value: "driving", label: "Driving", description: "Actively pushing expansion forward" },
  { value: "resisting", label: "Resisting", description: "Actively opposing or slowing expansion" },
  { value: "neutral", label: "Neutral", description: "Present but not significantly affecting expansion" },
];

// ─── Interaction Types ──────────────────────────────────────────────

export const INTERACTION_TYPES: { value: InteractionResult; label: string; description: string; hex: string }[] = [
  { value: "synergy", label: "Synergy", description: "Forces amplify each other", hex: "#10B981" },
  { value: "tension", label: "Tension", description: "Forces pull in different directions", hex: "#F59E0B" },
  { value: "conflict", label: "Conflict", description: "Forces actively oppose each other", hex: "#DC2626" },
  { value: "neutral", label: "Neutral", description: "No significant interaction", hex: "#6B7280" },
];

export const getInteractionDef = (value: InteractionResult) =>
  INTERACTION_TYPES.find((i) => i.value === value);

// ─── Severity Options ───────────────────────────────────────────────

export const SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "major", label: "Major" },
  { value: "fundamental", label: "Fundamental" },
] as const;

// ─── Infrastructure Levels ──────────────────────────────────────────

export const INFRASTRUCTURE_LEVELS = [
  { value: "outpost", label: "Outpost", description: "Temporary presence, fully dependent on resupply" },
  { value: "settlement", label: "Settlement", description: "Permanent but not self-sustaining" },
  { value: "colony", label: "Colony", description: "Partially self-sufficient, growing population" },
  { value: "civilization", label: "Civilization", description: "Fully self-sustaining, independent culture" },
] as const;

// ─── Trajectory Options ─────────────────────────────────────────────

export const TRAJECTORY_OPTIONS: { value: TrajectoryType; label: string; description: string }[] = [
  { value: "accelerating", label: "Accelerating", description: "Expansion is speeding up" },
  { value: "decelerating", label: "Decelerating", description: "Expansion is slowing down" },
  { value: "stalled", label: "Stalled", description: "Expansion has hit a wall" },
  { value: "cyclical", label: "Cyclical", description: "Boom-bust cycles of expansion" },
  { value: "exponential", label: "Exponential", description: "Self-reinforcing expansion growth" },
];

// ─── SF Examples ────────────────────────────────────────────────────

export interface SFExpansionExample {
  name: string;
  source: string;
  model: string;
  dominantForces: string;
  consequence: string;
}

export const SF_EXPANSION_EXAMPLES: SFExpansionExample[] = [
  {
    name: "The Expanse",
    source: "James S.A. Corey",
    model: "Corporate + Government-driven solar system colonization. Belt labor exploitation creates permanent underclass.",
    dominantForces: "Industrial (dominant), Governmental (enabling/regulating), Social (resisting in Belt)",
    consequence: "Belt independence movement. Three-way political split between Earth (welfare state), Mars (military expansion), and Belt (labor revolt). Economic forces create the conditions; social forces spark revolution.",
  },
  {
    name: "Foundation",
    source: "Isaac Asimov",
    model: "Scientific prediction (psychohistory) guides millennia of political maneuvering through galactic collapse and reconstruction.",
    dominantForces: "Scientific (Seldon Plan), Governmental (declining Empire), Religious (Foundation's cover story)",
    consequence: "Science masquerades as religion to maintain power during dark ages. The tension between genuine scientific understanding and its use as political tool drives the entire narrative.",
  },
  {
    name: "Dune",
    source: "Frank Herbert",
    model: "Religious + economic synergy drives interstellar expansion. Control of a single resource (spice/melange) determines political power.",
    dominantForces: "Religious (Bene Gesserit breeding program, Fremen prophecy), Economic (CHOAM, spice monopoly), Governmental (Imperial Houses)",
    consequence: "Religious motivation provides willing colonists; economic forces determine which worlds matter. The Fremen become the most powerful force because they combine religious fervor with control of the essential resource.",
  },
  {
    name: "Kim Stanley Robinson's Mars Trilogy",
    source: "Kim Stanley Robinson",
    model: "All six forces in detailed, realistic interplay across centuries of Mars colonization and terraforming.",
    dominantForces: "Scientific (terraforming tech), Economic (metanational corporations), Social (generational identity shifts), Governmental (Earth vs Mars sovereignty)",
    consequence: "The most realistic treatment of space expansion forces. Scientific capability enables colonization, but economic exploitation, social identity formation, and governmental control create cascading conflicts. Mars develops its own culture precisely because all six forces operate simultaneously.",
  },
  {
    name: "Aurora",
    source: "Kim Stanley Robinson",
    model: "Generation ship to Tau Ceti reveals the walls of interstellar expansion. Every gap compounds over centuries.",
    dominantForces: "Scientific (walls dominate, ecosystem closure, radiation, alien biochemistry), Social (generational trauma, ship politics)",
    consequence: "A deliberate counter-narrative to optimistic expansion. Shows how walls (closed-loop ecology failure, immune system incompatibility with alien biomes) can make interstellar expansion fundamentally impossible without the One Big Lie.",
  },
  {
    name: "Revelation Space",
    source: "Alastair Reynolds",
    model: "No FTL, lightspeed is the wall. Expansion happens through slowships and automated probes. Centuries of isolation create divergent civilizations.",
    dominantForces: "Scientific (lighthugger tech), Industrial (Pattern Juggler biotech, alien artifacts), Social (posthuman divergence)",
    consequence: "Without FTL as a catalyst, expansion is slow and uneven. Each colony becomes culturally isolated. The Melding Plague (a wall) collapses one civilization entirely. Shows how a single technological wall can reverse centuries of expansion.",
  },
];

// ─── Section Helpers ────────────────────────────────────────────────

export const SECTION_HELPERS = {
  foundation: "Every expansion begins with a starting point. Define who is expanding, when, and what single physics departure (the One Big Lie) makes it possible.",
  phases: "Space expansion happens in stages, each milestone represents a new era of capability and challenge. Not every story reaches the stars.",
  forces: "Six fundamental forces shape every expansion. At each phase, configure their intensity and direction. Like ocean currents, they can push with or against the tide of expansion.",
  modifiers: "Events and conditions that alter the pace and direction of expansion. Walls stop it. Catalysts accelerate it. Gaps must be filled. Barriers must be overcome.",
  matrix: "How do the six forces interact with each other at each phase? Synergies accelerate expansion. Conflicts create drama. Tensions generate the best stories.",
  examples: "Real SF works that demonstrate how expansion dynamics create compelling narratives.",
  templates: "Pre-configured expansion models based on classic SF paradigms. Apply one as a starting point, then customize.",
  synthesis: "Step back and see the big picture. What force dominates? What's the biggest tension point? What story does this expansion model tell?",
} as const;

// ─── Initial FormState ──────────────────────────────────────────────

const PHASE_IDS: ExpansionPhaseId[] = ["earth-orbit", "luna", "mars", "belt", "outer", "interstellar"];
const FORCE_IDS: ForceCategory[] = ["industrial", "governmental", "religious", "economic", "social", "scientific"];

// Generate all 15 unique force pairs (upper triangle of 6x6 grid)
export function generateForcePairs(): { forceA: ForceCategory; forceB: ForceCategory }[] {
  const pairs: { forceA: ForceCategory; forceB: ForceCategory }[] = [];
  for (let i = 0; i < FORCE_IDS.length; i++) {
    for (let j = i + 1; j < FORCE_IDS.length; j++) {
      pairs.push({ forceA: FORCE_IDS[i], forceB: FORCE_IDS[j] });
    }
  }
  return pairs;
}

export function createEmptyConsequenceMatrix(phaseId: ExpansionPhaseId): ConsequenceMatrix {
  const pairs = generateForcePairs();
  return {
    phaseId,
    cells: pairs.map((p) => ({
      forceA: p.forceA,
      forceB: p.forceB,
      interaction: "" as InteractionResult,
      description: "",
      narrativeHook: "",
    })),
  };
}

export function createDefaultPhases(): ExpansionPhase[] {
  return DEFAULT_PHASES.map((p) => ({
    id: p.id,
    name: p.name,
    reached: false,
    yearReached: "",
    milestone: "",
    infrastructureLevel: "" as InfrastructureLevel,
    population: "",
    selfSufficiency: 0,
    description: "",
  }));
}

export function createDefaultForces(): ForceConfig[] {
  const forces: ForceConfig[] = [];
  for (const phaseId of PHASE_IDS) {
    for (const forceId of FORCE_IDS) {
      forces.push({
        phaseId,
        forceCategory: forceId,
        intensity: 0,
        direction: "neutral",
        description: "",
        keyActors: "",
        dependencies: "",
      });
    }
  }
  return forces;
}

export const INITIAL_FORM_STATE: FormState = {
  foundation: {
    expansionName: "",
    oneBigLie: "",
    originCivilization: "",
    startYear: "",
    startingConditions: "",
  },
  phases: createDefaultPhases(),
  forces: createDefaultForces(),
  modifiers: [],
  consequenceMatrices: PHASE_IDS.map(createEmptyConsequenceMatrix),
  synthesis: {
    dominantForce: "",
    overallTrajectory: "",
    biggestTensionPoint: "",
    narrativeTheme: "",
    storyHooks: "",
  },
  generalNotes: "",
  moodboard: [],
};

// ─── Quick-Start Templates ──────────────────────────────────────────

export interface QuickStartTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  reference: string;
}

// Templates provide foundation + phase + force presets (applied via applyTemplate function)
export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: "optimistic",
    name: "Optimistic Federation",
    tagline: "Cooperation over competition",
    description: "Strong governmental/scientific synergy drives rapid expansion. Economic abundance removes most barriers. Religious and ideological forces are minimal. A Star Trek-style united front.",
    reference: "Star Trek, The Culture (Banks)",
  },
  {
    id: "corporate",
    name: "Corporate Frontier",
    tagline: "Profit drives the void",
    description: "Economic and industrial forces dominate. Government is reactive and regulatory. Social tensions grow as labor exploitation spreads to new worlds. The Expanse model.",
    reference: "The Expanse, Alien franchise",
  },
  {
    id: "religious",
    name: "Religious Exodus",
    tagline: "The stars are destiny",
    description: "Religious or ideological forces are the primary driver. Economic forces serve ideology. Government is fragmented or theocratic. Expansion targets specific sacred destinations.",
    reference: "Dune, Mormons in The Expanse",
  },
  {
    id: "survival",
    name: "Survival Imperative",
    tagline: "Leave or die",
    description: "Existential catalyst triggers rapid expansion. All forces temporarily align under crisis. Walls become urgent gaps to fill. Compressed timeline, desperate decisions.",
    reference: "Interstellar, Seveneves",
  },
  {
    id: "slow-creep",
    name: "Slow Creep",
    tagline: "Centuries of patience",
    description: "Balanced forces with no dominant driver. Scientific walls impose hard limits. Social barriers slow progress. A realistic near-term model spanning centuries.",
    reference: "Aurora, Revelation Space",
  },
];

export function applyTemplate(templateId: string): FormState {
  const base = { ...INITIAL_FORM_STATE };
  const phases = createDefaultPhases();
  const forces = createDefaultForces();

  const getForce = (phaseId: ExpansionPhaseId, cat: ForceCategory) =>
    forces.find((f) => f.phaseId === phaseId && f.forceCategory === cat)!;

  switch (templateId) {
    case "optimistic": {
      base.foundation = {
        ...base.foundation,
        expansionName: "United Earth Expansion",
        oneBigLie: "Post-scarcity energy via controlled fusion and reactionless drive enabling 0.1c travel.",
        originCivilization: "United Earth Federation",
        startYear: "2150",
        startingConditions: "Global unification following first contact signal. Cooperative spirit prevails.",
      };
      // Mark first 4 phases reached
      phases[0].reached = true; phases[0].yearReached = "2080"; phases[0].milestone = "First permanent orbital habitat";
      phases[1].reached = true; phases[1].yearReached = "2120"; phases[1].milestone = "Lunar manufacturing base";
      phases[2].reached = true; phases[2].yearReached = "2155"; phases[2].milestone = "Mars colony self-sufficient";
      phases[3].reached = true; phases[3].yearReached = "2210"; phases[3].milestone = "Belt cooperative network";
      // Scientific and governmental forces high, driving
      for (const pid of ["earth-orbit", "luna", "mars", "belt"] as ExpansionPhaseId[]) {
        getForce(pid, "scientific").intensity = 85; getForce(pid, "scientific").direction = "driving";
        getForce(pid, "governmental").intensity = 75; getForce(pid, "governmental").direction = "driving";
        getForce(pid, "economic").intensity = 50; getForce(pid, "economic").direction = "driving";
        getForce(pid, "social").intensity = 60; getForce(pid, "social").direction = "driving";
        getForce(pid, "industrial").intensity = 55; getForce(pid, "industrial").direction = "driving";
        getForce(pid, "religious").intensity = 15; getForce(pid, "religious").direction = "neutral";
      }
      break;
    }
    case "corporate": {
      base.foundation = {
        ...base.foundation,
        expansionName: "The Corporate Expansion",
        oneBigLie: "Epstein-type high-efficiency fusion drive making interplanetary travel economically viable.",
        originCivilization: "Earth-based megacorporations",
        startYear: "2080",
        startingConditions: "Resource depletion on Earth drives corporate-funded space ventures. Governments contract out.",
      };
      phases[0].reached = true; phases[0].yearReached = "2050"; phases[0].milestone = "First corporate space station";
      phases[1].reached = true; phases[1].yearReached = "2090"; phases[1].milestone = "Helium-3 mining operations";
      phases[2].reached = true; phases[2].yearReached = "2130"; phases[2].milestone = "Mars worker settlements";
      phases[3].reached = true; phases[3].yearReached = "2200"; phases[3].milestone = "Belt mining cartels";
      for (const pid of ["earth-orbit", "luna", "mars", "belt"] as ExpansionPhaseId[]) {
        getForce(pid, "economic").intensity = 90; getForce(pid, "economic").direction = "driving";
        getForce(pid, "industrial").intensity = 85; getForce(pid, "industrial").direction = "driving";
        getForce(pid, "governmental").intensity = 40; getForce(pid, "governmental").direction = "neutral";
        getForce(pid, "social").intensity = 65; getForce(pid, "social").direction = "resisting";
        getForce(pid, "scientific").intensity = 50; getForce(pid, "scientific").direction = "driving";
        getForce(pid, "religious").intensity = 10; getForce(pid, "religious").direction = "neutral";
      }
      break;
    }
    case "religious": {
      base.foundation = {
        ...base.foundation,
        expansionName: "The Great Pilgrimage",
        oneBigLie: "Space-folding navigation requires consciousness-altering substance found only off-world.",
        originCivilization: "Theocratic Alliance",
        startYear: "2200",
        startingConditions: "Prophetic revelation identifies specific star systems as sacred destinations. Faithful mobilize.",
      };
      phases[0].reached = true; phases[0].yearReached = "2120"; phases[0].milestone = "Orbital cathedral station";
      phases[1].reached = true; phases[1].yearReached = "2180"; phases[1].milestone = "Lunar monastery colonies";
      phases[2].reached = true; phases[2].yearReached = "2220"; phases[2].milestone = "Mars: the First Holy Settlement";
      for (const pid of ["earth-orbit", "luna", "mars"] as ExpansionPhaseId[]) {
        getForce(pid, "religious").intensity = 90; getForce(pid, "religious").direction = "driving";
        getForce(pid, "governmental").intensity = 60; getForce(pid, "governmental").direction = "driving";
        getForce(pid, "economic").intensity = 55; getForce(pid, "economic").direction = "driving";
        getForce(pid, "industrial").intensity = 45; getForce(pid, "industrial").direction = "driving";
        getForce(pid, "social").intensity = 70; getForce(pid, "social").direction = "driving";
        getForce(pid, "scientific").intensity = 30; getForce(pid, "scientific").direction = "neutral";
      }
      break;
    }
    case "survival": {
      base.foundation = {
        ...base.foundation,
        expansionName: "Exodus Protocol",
        oneBigLie: "Emergency-developed warp capable of 0.3c, but with severe radiation side effects on crews.",
        originCivilization: "Remnant Earth Coalition",
        startYear: "2045",
        startingConditions: "Confirmed asteroid impact in 30 years. All resources redirected to off-world survival.",
      };
      phases[0].reached = true; phases[0].yearReached = "2035"; phases[0].milestone = "Emergency orbital arks";
      phases[1].reached = true; phases[1].yearReached = "2040"; phases[1].milestone = "Lunar bunker complex";
      phases[2].reached = true; phases[2].yearReached = "2055"; phases[2].milestone = "Mars survival colony";
      phases[3].reached = true; phases[3].yearReached = "2070"; phases[3].milestone = "Belt refuge habitats";
      for (const pid of ["earth-orbit", "luna", "mars", "belt"] as ExpansionPhaseId[]) {
        getForce(pid, "scientific").intensity = 80; getForce(pid, "scientific").direction = "driving";
        getForce(pid, "governmental").intensity = 85; getForce(pid, "governmental").direction = "driving";
        getForce(pid, "social").intensity = 90; getForce(pid, "social").direction = "driving";
        getForce(pid, "economic").intensity = 70; getForce(pid, "economic").direction = "driving";
        getForce(pid, "industrial").intensity = 75; getForce(pid, "industrial").direction = "driving";
        getForce(pid, "religious").intensity = 40; getForce(pid, "religious").direction = "driving";
      }
      break;
    }
    case "slow-creep": {
      base.foundation = {
        ...base.foundation,
        expansionName: "The Long Reach",
        oneBigLie: "None, hard science only. Chemical and nuclear thermal propulsion. No FTL, no magical drives.",
        originCivilization: "International Space Consortium",
        startYear: "2030",
        startingConditions: "Incremental progress. No single catalyst. Just persistent human curiosity and resource needs.",
      };
      phases[0].reached = true; phases[0].yearReached = "2030"; phases[0].milestone = "ISS successors operational";
      phases[1].reached = true; phases[1].yearReached = "2080"; phases[1].milestone = "Permanent lunar base";
      phases[2].reached = true; phases[2].yearReached = "2160"; phases[2].milestone = "First Mars hab operational";
      for (const pid of ["earth-orbit", "luna", "mars"] as ExpansionPhaseId[]) {
        getForce(pid, "scientific").intensity = 55; getForce(pid, "scientific").direction = "driving";
        getForce(pid, "governmental").intensity = 45; getForce(pid, "governmental").direction = "neutral";
        getForce(pid, "economic").intensity = 50; getForce(pid, "economic").direction = "driving";
        getForce(pid, "industrial").intensity = 40; getForce(pid, "industrial").direction = "driving";
        getForce(pid, "social").intensity = 30; getForce(pid, "social").direction = "neutral";
        getForce(pid, "religious").intensity = 10; getForce(pid, "religious").direction = "neutral";
      }
      break;
    }
  }

  return {
    ...base,
    phases,
    forces,
    consequenceMatrices: PHASE_IDS.map(createEmptyConsequenceMatrix),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

export function getForceConfig(
  forces: ForceConfig[],
  phaseId: ExpansionPhaseId,
  forceCategory: ForceCategory
): ForceConfig | undefined {
  return forces.find((f) => f.phaseId === phaseId && f.forceCategory === forceCategory);
}

export function getConsequenceMatrix(
  matrices: ConsequenceMatrix[],
  phaseId: ExpansionPhaseId
): ConsequenceMatrix | undefined {
  return matrices.find((m) => m.phaseId === phaseId);
}

export function getConsequenceCell(
  matrix: ConsequenceMatrix,
  forceA: ForceCategory,
  forceB: ForceCategory
): ConsequenceCell | undefined {
  return matrix.cells.find(
    (c) =>
      (c.forceA === forceA && c.forceB === forceB) ||
      (c.forceA === forceB && c.forceB === forceA)
  );
}
