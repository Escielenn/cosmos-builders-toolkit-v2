// Tool wiki metadata, categories, complexity, cascade positions, and relationships
// Source of truth for the /guide/tools reference and /getting-started pathways
// Tool IDs and display names come from tools-config.ts

export type ToolCategory =
  | 'stars-systems'
  | 'worlds'
  | 'life'
  | 'civilizations'
  | 'mythology'
  | 'integration';

export type ComplexityLevel = 'entry' | 'intermediate' | 'advanced';

export type ToolType =
  | 'simulator'
  | 'calculator'
  | 'worksheet'
  | 'cartographer';

export type CascadePosition =
  | 'physics'
  | 'environment'
  | 'biology'
  | 'psychology'
  | 'mythology'
  | 'culture'
  | 'meta';

export type RelationshipStrength = 'required' | 'recommended' | 'optional';

export interface ToolRelationship {
  toolId: string;
  strength: RelationshipStrength;
  note: string;
}

export interface ToolWikiEntry {
  id: string;
  tagline: string;
  category: ToolCategory;
  complexity: ComplexityLevel;
  type: ToolType;
  cascade: CascadePosition;
  workshopWeek: number;
  timeEstimate: string;
  buildsOn: ToolRelationship[];
  feedsInto: ToolRelationship[];
}

export const CATEGORY_META: Record<
  ToolCategory,
  { label: string; color: string; description: string }
> = {
  'stars-systems': {
    label: 'Stars & Systems',
    color: '#FFB800',
    description: 'The cosmic context, what your world orbits and who its neighbors are.',
  },
  worlds: {
    label: 'Worlds',
    color: '#4D9FFF',
    description: 'Planetary parameters, the physics that constrains everything else.',
  },
  life: {
    label: 'Life',
    color: '#00FF88',
    description: 'Biology, from basic biochemistry to complex organisms.',
  },
  civilizations: {
    label: 'Civilizations',
    color: '#9B5DE5',
    description: 'Societies, how intelligent life organizes itself.',
  },
  mythology: {
    label: 'Mythology',
    color: '#5B8DEF',
    description: 'The stories civilizations tell themselves.',
  },
  integration: {
    label: 'Integration',
    color: '#15C17B',
    description: 'Bringing it all together, cross-tool connections and timelines.',
  },
};

export const COMPLEXITY_META: Record<
  ComplexityLevel,
  { label: string; icon: string; description: string }
> = {
  entry: {
    label: 'Entry',
    icon: '○',
    description: 'No prerequisites. Good first tool in its category.',
  },
  intermediate: {
    label: 'Intermediate',
    icon: '◐',
    description: 'Assumes basic familiarity. Benefits from prior tool outputs.',
  },
  advanced: {
    label: 'Advanced',
    icon: '●',
    description: 'Requires understanding of related concepts. Maximum flexibility.',
  },
};

export const CASCADE_META: Record<
  CascadePosition,
  { label: string; order: number; color: string }
> = {
  physics: { label: 'Physics', order: 1, color: '#FFB800' },
  environment: { label: 'Environment', order: 2, color: '#4D9FFF' },
  biology: { label: 'Biology', order: 3, color: '#00FF88' },
  psychology: { label: 'Psychology', order: 4, color: '#9B5DE5' },
  mythology: { label: 'Mythology', order: 5, color: '#5B8DEF' },
  culture: { label: 'Culture', order: 6, color: '#FF9800' },
  meta: { label: 'Integration', order: 7, color: '#15C17B' },
};

export const TYPE_META: Record<ToolType, { label: string }> = {
  simulator: { label: 'Simulator' },
  calculator: { label: 'Calculator' },
  worksheet: { label: 'Worksheet' },
  cartographer: { label: 'Cartographer' },
};

export const WORKSHOP_WEEKS: Record<number, { title: string; theme: string }> = {
  1: { title: 'Week 1', theme: 'Environment & Planet' },
  2: { title: 'Week 2', theme: 'Physics & Propulsion' },
  3: { title: 'Week 3', theme: 'Biology' },
  4: { title: 'Week 4', theme: 'Culture & Civilization' },
  5: { title: 'Week 5', theme: 'Communication & Fermi' },
  6: { title: 'Week 6', theme: 'Mythology & Integration' },
};

// Complete wiki metadata for all 25 live tools
export const TOOL_WIKI: Record<string, ToolWikiEntry> = {
  // ── FREE TOOLS ──────────────────────────────────────────────
  'environmental-chain-reaction': {
    id: 'environmental-chain-reaction',
    tagline: 'Change one variable, trace the cascade through biology, psychology, mythology, and culture.',
    category: 'integration',
    complexity: 'entry',
    type: 'worksheet',
    cascade: 'meta',
    workshopWeek: 1,
    timeEstimate: '10-20 min',
    buildsOn: [],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Understanding cascade improves all tool use' },
    ],
  },
  'spacecraft-designer': {
    id: 'spacecraft-designer',
    tagline: 'Design spacecraft as lived-in spaces, beyond engineering specs to daily life.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'culture',
    workshopWeek: 2,
    timeEstimate: '20-30 min',
    buildsOn: [
      { toolId: 'one-big-lie', strength: 'recommended', note: 'Propulsion type constrains ship design' },
      { toolId: 'gravitas', strength: 'recommended', note: 'Gravity choices affect layout' },
      { toolId: 'propulsion-consequences-map', strength: 'recommended', note: 'Travel duration affects life support' },
    ],
    feedsInto: [
      { toolId: 'space-expansion-modeler', strength: 'optional', note: 'Ship capabilities affect expansion patterns' },
      { toolId: 'timeline', strength: 'optional', note: 'Ship journeys as historical events' },
    ],
  },
  'propulsion-consequences-map': {
    id: 'propulsion-consequences-map',
    tagline: 'Map how propulsion shapes economics, warfare, colonization, and society.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'culture',
    workshopWeek: 2,
    timeEstimate: '20-30 min',
    buildsOn: [
      { toolId: 'one-big-lie', strength: 'required', note: 'Must know your propulsion rules' },
      { toolId: 'time-dilation', strength: 'recommended', note: 'If relativistic travel' },
    ],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'required', note: 'Travel shapes governance' },
      { toolId: 'space-expansion-modeler', strength: 'required', note: 'Propulsion determines expansion rate' },
      { toolId: 'spacecraft-designer', strength: 'recommended', note: 'Propulsion affects ship design' },
      { toolId: 'lexdrift', strength: 'optional', note: 'Travel time affects linguistic isolation' },
    ],
  },

  // ── PRO WORKSHEETS ──────────────────────────────────────────
  'planetary-profile': {
    id: 'planetary-profile',
    tagline: 'The foundation document, systematic documentation of your world\'s physical characteristics.',
    category: 'worlds',
    complexity: 'entry',
    type: 'worksheet',
    cascade: 'environment',
    workshopWeek: 1,
    timeEstimate: '15-30 min',
    buildsOn: [
      { toolId: 'habitable-zone-calculator', strength: 'recommended', note: 'Establishes orbital parameters' },
      { toolId: 'surface-gravity-calculator', strength: 'recommended', note: 'Core physical parameter' },
    ],
    feedsInto: [
      { toolId: 'evolutionary-biology', strength: 'required', note: 'Life adapts to planetary conditions' },
      { toolId: 'tidelock', strength: 'optional', note: 'If tidally locked world' },
      { toolId: 'sensorium', strength: 'recommended', note: 'Environment determines useful senses' },
    ],
  },
  'one-big-lie': {
    id: 'one-big-lie',
    tagline: 'Declare your single speculative element, commit to rigor everywhere else.',
    category: 'civilizations',
    complexity: 'entry',
    type: 'worksheet',
    cascade: 'physics',
    workshopWeek: 2,
    timeEstimate: '15-20 min',
    buildsOn: [],
    feedsInto: [
      { toolId: 'propulsion-consequences-map', strength: 'required', note: 'Your "lie" often involves FTL' },
      { toolId: 'time-dilation', strength: 'optional', note: 'If relativistic travel involved' },
      { toolId: 'technology-consequences', strength: 'recommended', note: 'Speculative element has tech implications' },
    ],
  },
  'evolutionary-biology': {
    id: 'evolutionary-biology',
    tagline: 'Design species shaped by environmental pressures, evolution as conversation.',
    category: 'life',
    complexity: 'entry',
    type: 'worksheet',
    cascade: 'biology',
    workshopWeek: 3,
    timeEstimate: '25-40 min',
    buildsOn: [
      { toolId: 'planetary-profile', strength: 'required', note: 'Gravity, atmosphere, radiation constrain body plans' },
    ],
    feedsInto: [
      { toolId: 'sensorium', strength: 'recommended', note: 'Deepens sensory details' },
      { toolId: 'species-interaction-matrix', strength: 'recommended', note: 'Species interact in ecosystems' },
      { toolId: 'xenomythology-framework-builder', strength: 'optional', note: 'Biology shapes what\'s sacred' },
    ],
  },
  'xenomythology-framework-builder': {
    id: 'xenomythology-framework-builder',
    tagline: 'Create mythological systems using Campbell\'s Four Functions of Myth.',
    category: 'mythology',
    complexity: 'entry',
    type: 'worksheet',
    cascade: 'mythology',
    workshopWeek: 6,
    timeEstimate: '25-40 min',
    buildsOn: [
      { toolId: 'evolutionary-biology', strength: 'recommended', note: 'Biology shapes what\'s sacred' },
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Environment provides mythological imagery' },
    ],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'optional', note: 'Mythology influences governance' },
      { toolId: 'timeline', strength: 'optional', note: 'Mythological events as historical anchors' },
    ],
  },
  'star-system-builder': {
    id: 'star-system-builder',
    tagline: 'Build complete star systems, planets, moons, asteroid belts, and orbital relationships.',
    category: 'stars-systems',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'physics',
    workshopWeek: 1,
    timeEstimate: '20-30 min',
    buildsOn: [
      { toolId: 'habitable-zone-calculator', strength: 'recommended', note: 'Establishes orbital viability' },
    ],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'required', note: 'System context for individual worlds' },
      { toolId: 'exosky', strength: 'recommended', note: 'System architecture determines sky' },
      { toolId: 'rogue', strength: 'optional', note: 'Tests orbital stability' },
    ],
  },
  'empire-designer': {
    id: 'empire-designer',
    tagline: 'Design interstellar empires, governance, territory, and the tensions that hold civilizations together.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'culture',
    workshopWeek: 4,
    timeEstimate: '25-40 min',
    buildsOn: [
      { toolId: 'propulsion-consequences-map', strength: 'required', note: 'Travel shapes governance' },
      { toolId: 'evolutionary-biology', strength: 'recommended', note: 'Biology shapes social structures' },
      { toolId: 'lexdrift', strength: 'optional', note: 'Language barriers affect governance' },
    ],
    feedsInto: [
      { toolId: 'xenomythology-framework-builder', strength: 'optional', note: 'Empire generates founding myths' },
      { toolId: 'timeline', strength: 'recommended', note: 'Political events as history' },
      { toolId: 'space-expansion-modeler', strength: 'optional', note: 'Empire as expansion result' },
    ],
  },
  'technology-consequences': {
    id: 'technology-consequences',
    tagline: 'Every invention changes everything, trace the ripple effects across society.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'culture',
    workshopWeek: 4,
    timeEstimate: '20-30 min',
    buildsOn: [
      { toolId: 'one-big-lie', strength: 'recommended', note: 'Your speculative technology' },
      { toolId: 'planetary-profile', strength: 'optional', note: 'Environment constrains technology' },
    ],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'recommended', note: 'Technology shapes governance' },
      { toolId: 'propulsion-consequences-map', strength: 'optional', note: 'If technology affects travel' },
      { toolId: 'timeline', strength: 'optional', note: 'Technological milestones as events' },
    ],
  },
  'species-interaction-matrix': {
    id: 'species-interaction-matrix',
    tagline: 'Map predator-prey dynamics, mutualism, parasitism, the ecological web of your world.',
    category: 'life',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'biology',
    workshopWeek: 3,
    timeEstimate: '20-30 min',
    buildsOn: [
      { toolId: 'evolutionary-biology', strength: 'required', note: 'Need species to interact' },
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Environment shapes ecological niches' },
    ],
    feedsInto: [
      { toolId: 'xenomythology-framework-builder', strength: 'optional', note: 'Ecological relationships become mythological symbols' },
      { toolId: 'empire-designer', strength: 'optional', note: 'Resource competition shapes politics' },
    ],
  },
  timeline: {
    id: 'timeline',
    tagline: 'Multi-track timeline for world history, geological eras, conflicts, migrations, and personal events.',
    category: 'integration',
    complexity: 'intermediate',
    type: 'worksheet',
    cascade: 'meta',
    workshopWeek: 6,
    timeEstimate: '30-60 min',
    buildsOn: [
      { toolId: 'empire-designer', strength: 'recommended', note: 'Political events as history' },
      { toolId: 'xenomythology-framework-builder', strength: 'optional', note: 'Mythological events as anchors' },
    ],
    feedsInto: [],
  },
  'space-expansion-modeler': {
    id: 'space-expansion-modeler',
    tagline: 'Model how civilizations expand through space, colonization waves, trade, and frontier dynamics.',
    category: 'civilizations',
    complexity: 'advanced',
    type: 'worksheet',
    cascade: 'culture',
    workshopWeek: 4,
    timeEstimate: '20-30 min',
    buildsOn: [
      { toolId: 'propulsion-consequences-map', strength: 'required', note: 'Travel capability determines expansion rate' },
      { toolId: 'time-dilation', strength: 'optional', note: 'Relativistic effects on expansion' },
    ],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'required', note: 'Expansion creates empires' },
      { toolId: 'lexdrift', strength: 'recommended', note: 'Expansion creates linguistic isolation' },
      { toolId: 'timeline', strength: 'recommended', note: 'Expansion waves as historical events' },
    ],
  },

  // ── PRO CALCULATORS ─────────────────────────────────────────
  'habitable-zone-calculator': {
    id: 'habitable-zone-calculator',
    tagline: 'Calculate where life-supporting planets can exist around any star.',
    category: 'stars-systems',
    complexity: 'entry',
    type: 'calculator',
    cascade: 'physics',
    workshopWeek: 1,
    timeEstimate: '2-5 min',
    buildsOn: [],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'required', note: 'Establishes orbital distance' },
      { toolId: 'tidelock', strength: 'recommended', note: 'Close-in zones cause tidal locking' },
      { toolId: 'rogue', strength: 'optional', note: 'Defines stable orbital regions' },
    ],
  },
  'surface-gravity-calculator': {
    id: 'surface-gravity-calculator',
    tagline: 'Calculate surface gravity, how it shapes biology, architecture, and daily life.',
    category: 'worlds',
    complexity: 'entry',
    type: 'calculator',
    cascade: 'physics',
    workshopWeek: 1,
    timeEstimate: '2-5 min',
    buildsOn: [],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'required', note: 'Core physical parameter' },
      { toolId: 'evolutionary-biology', strength: 'required', note: 'Gravity constrains body plans' },
      { toolId: 'gravitas', strength: 'recommended', note: 'Foundation for habitat gravity' },
    ],
  },
  'time-dilation': {
    id: 'time-dilation',
    tagline: 'Calculate relativistic time dilation, essential for hard SF plotting.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'calculator',
    cascade: 'physics',
    workshopWeek: 2,
    timeEstimate: '5-10 min',
    buildsOn: [
      { toolId: 'one-big-lie', strength: 'required', note: 'Must know propulsion capabilities' },
    ],
    feedsInto: [
      { toolId: 'propulsion-consequences-map', strength: 'required', note: 'Time dilation shapes interstellar society' },
      { toolId: 'space-expansion-modeler', strength: 'optional', note: 'Affects expansion timelines' },
    ],
  },
  'drake-equation-calculator': {
    id: 'drake-equation-calculator',
    tagline: 'Estimate communicating civilizations in the galaxy, your universe\'s cosmic context.',
    category: 'civilizations',
    complexity: 'advanced',
    type: 'calculator',
    cascade: 'culture',
    workshopWeek: 5,
    timeEstimate: '10-15 min',
    buildsOn: [],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'optional', note: 'Cosmic context affects empire design' },
      { toolId: 'timeline', strength: 'optional', note: 'Historical context for civilization' },
    ],
  },
  lexdrift: {
    id: 'lexdrift',
    tagline: 'Model language evolution during interstellar travel, dialects, splits, and communication barriers.',
    category: 'civilizations',
    complexity: 'advanced',
    type: 'calculator',
    cascade: 'psychology',
    workshopWeek: 5,
    timeEstimate: '10-20 min',
    buildsOn: [
      { toolId: 'propulsion-consequences-map', strength: 'recommended', note: 'Travel times affect linguistic isolation' },
      { toolId: 'space-expansion-modeler', strength: 'optional', note: 'Expansion patterns create language branches' },
    ],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'recommended', note: 'Language barriers affect governance' },
      { toolId: 'xenomythology-framework-builder', strength: 'optional', note: 'Language shapes mythological expression' },
    ],
  },
  sensorium: {
    id: 'sensorium',
    tagline: 'Design alien sensory systems, echolocation, infrared, electroreception, and beyond.',
    category: 'life',
    complexity: 'intermediate',
    type: 'calculator',
    cascade: 'biology',
    workshopWeek: 3,
    timeEstimate: '10-20 min',
    buildsOn: [
      { toolId: 'evolutionary-biology', strength: 'recommended', note: 'Biology constrains sensory systems' },
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Environment determines useful senses' },
    ],
    feedsInto: [
      { toolId: 'xenomythology-framework-builder', strength: 'optional', note: 'Perception shapes what\'s sacred' },
      { toolId: 'species-interaction-matrix', strength: 'optional', note: 'Sensory differences affect inter-species relations' },
    ],
  },

  // ── PRO SIMULATORS ──────────────────────────────────────────
  rogue: {
    id: 'rogue',
    tagline: 'Real-time gravitational dynamics, orbital mechanics, multi-body systems, and stellar encounters.',
    category: 'worlds',
    complexity: 'advanced',
    type: 'simulator',
    cascade: 'physics',
    workshopWeek: 2,
    timeEstimate: '15-45 min',
    buildsOn: [
      { toolId: 'habitable-zone-calculator', strength: 'recommended', note: 'Helps establish where to place planets' },
    ],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Orbital parameters inform planetary conditions' },
      { toolId: 'exosky', strength: 'optional', note: 'System architecture affects sky appearance' },
    ],
  },
  tidelock: {
    id: 'tidelock',
    tagline: 'Explore tidally locked worlds, terminator zones, heat distribution, and habitable regions.',
    category: 'worlds',
    complexity: 'intermediate',
    type: 'simulator',
    cascade: 'environment',
    workshopWeek: 1,
    timeEstimate: '15-30 min',
    buildsOn: [
      { toolId: 'habitable-zone-calculator', strength: 'required', note: 'Most locked worlds orbit red dwarfs' },
    ],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Tidal locking creates unique conditions' },
      { toolId: 'evolutionary-biology', strength: 'recommended', note: 'Life adapts to terminator zone' },
    ],
  },
  exosky: {
    id: 'exosky',
    tagline: 'Visualize alien skies, star colors, visible planets, moons, and celestial events.',
    category: 'stars-systems',
    complexity: 'intermediate',
    type: 'simulator',
    cascade: 'environment',
    workshopWeek: 1,
    timeEstimate: '10-20 min',
    buildsOn: [
      { toolId: 'star-system-builder', strength: 'recommended', note: 'System architecture determines sky' },
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Atmosphere affects sky appearance' },
    ],
    feedsInto: [
      { toolId: 'xenomythology-framework-builder', strength: 'recommended', note: 'Celestial appearance shapes religion' },
    ],
  },
  exoforge: {
    id: 'exoforge',
    tagline: 'Procedurally generate exoplanets with scientifically grounded parameters.',
    category: 'worlds',
    complexity: 'intermediate',
    type: 'simulator',
    cascade: 'environment',
    workshopWeek: 1,
    timeEstimate: '10-20 min',
    buildsOn: [
      { toolId: 'habitable-zone-calculator', strength: 'recommended', note: 'Establishes orbital constraints' },
      { toolId: 'star-system-builder', strength: 'optional', note: 'System context for the planet' },
    ],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'recommended', note: 'Generated planet becomes starting point' },
      { toolId: 'evolutionary-biology', strength: 'optional', note: 'Environmental parameters constrain biology' },
    ],
  },
  solaris: {
    id: 'solaris',
    tagline: 'Procedural star system simulator, single, binary, trinary, and quaternary stellar configurations with real orbital mechanics.',
    category: 'stars-systems',
    complexity: 'advanced',
    type: 'simulator',
    cascade: 'physics',
    workshopWeek: 1,
    timeEstimate: '15-45 min',
    buildsOn: [
      { toolId: 'habitable-zone-calculator', strength: 'recommended', note: 'Helps understand habitable zone boundaries' },
      { toolId: 'star-system-builder', strength: 'optional', note: 'Worksheet-based system design complements simulation' },
    ],
    feedsInto: [
      { toolId: 'planetary-profile', strength: 'recommended', note: 'System architecture constrains planetary conditions' },
      { toolId: 'exosky', strength: 'recommended', note: 'Multi-star systems create unique sky appearances' },
      { toolId: 'tidelock', strength: 'optional', note: 'Close-in orbits may produce tidal locking' },
      { toolId: 'rogue', strength: 'optional', note: 'System stability informs encounter scenarios' },
    ],
  },
  gravitas: {
    id: 'gravitas',
    tagline: 'Simulate gravity aboard spacecraft, rotation, thrust gravity, zero-g, and experiential effects.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'simulator',
    cascade: 'physics',
    workshopWeek: 2,
    timeEstimate: '10-30 min',
    buildsOn: [
      { toolId: 'surface-gravity-calculator', strength: 'recommended', note: 'Understand gravity fundamentals' },
      { toolId: 'spacecraft-designer', strength: 'optional', note: 'Spacecraft parameters inform habitat gravity' },
    ],
    feedsInto: [
      { toolId: 'spacecraft-designer', strength: 'recommended', note: 'Gravity choices affect ship design' },
      { toolId: 'evolutionary-biology', strength: 'optional', note: 'Long-term gravity affects biology' },
    ],
  },

  // ── PRO CALCULATOR (Civilizations) ─────────────────────────
  'kardashev-scale': {
    id: 'kardashev-scale',
    tagline: 'Classify civilizations by energy consumption, Kardashev numbers, cascade implications, and growth projections.',
    category: 'civilizations',
    complexity: 'intermediate',
    type: 'calculator',
    cascade: 'culture',
    workshopWeek: 4,
    timeEstimate: '10-20 min',
    buildsOn: [
      { toolId: 'empire-designer', strength: 'recommended', note: 'Political structure informs energy governance' },
      { toolId: 'technology-consequences', strength: 'recommended', note: 'Technology level shapes energy capacity' },
      { toolId: 'one-big-lie', strength: 'optional', note: 'Exotic physics may unlock higher energy tiers' },
    ],
    feedsInto: [
      { toolId: 'space-expansion-modeler', strength: 'recommended', note: 'Energy level constrains expansion capability' },
      { toolId: 'spacecraft-designer', strength: 'optional', note: 'Energy budget affects ship capabilities' },
      { toolId: 'drake-equation-calculator', strength: 'optional', note: 'Energy level affects detectability' },
    ],
  },

  // ── PRO CARTOGRAPHER ────────────────────────────────────────
  'stellar-cartographer': {
    id: 'stellar-cartographer',
    tagline: 'Map star systems, sectors, and regions, spatial relationships and trade routes.',
    category: 'stars-systems',
    complexity: 'advanced',
    type: 'cartographer',
    cascade: 'physics',
    workshopWeek: 6,
    timeEstimate: '30-60 min',
    buildsOn: [
      { toolId: 'star-system-builder', strength: 'recommended', note: 'Individual systems to place on map' },
      { toolId: 'space-expansion-modeler', strength: 'optional', note: 'Expansion patterns inform layout' },
    ],
    feedsInto: [
      { toolId: 'empire-designer', strength: 'recommended', note: 'Territory visualization' },
      { toolId: 'propulsion-consequences-map', strength: 'optional', note: 'Route planning' },
    ],
  },
};

// ── HELPER FUNCTIONS ────────────────────────────────────────

export function getToolsByCategory(category: ToolCategory): ToolWikiEntry[] {
  return Object.values(TOOL_WIKI)
    .filter((t) => t.category === category)
    .sort((a, b) => {
      const order: ComplexityLevel[] = ['entry', 'intermediate', 'advanced'];
      return order.indexOf(a.complexity) - order.indexOf(b.complexity);
    });
}

export function getToolsByCascade(cascade: CascadePosition): ToolWikiEntry[] {
  return Object.values(TOOL_WIKI)
    .filter((t) => t.cascade === cascade)
    .sort((a, b) => {
      const order: ComplexityLevel[] = ['entry', 'intermediate', 'advanced'];
      return order.indexOf(a.complexity) - order.indexOf(b.complexity);
    });
}

export function getToolsByComplexity(complexity: ComplexityLevel): ToolWikiEntry[] {
  return Object.values(TOOL_WIKI).filter((t) => t.complexity === complexity);
}

export function getToolsByWorkshopWeek(week: number): ToolWikiEntry[] {
  return Object.values(TOOL_WIKI).filter((t) => t.workshopWeek === week);
}

export function getToolWiki(toolId: string): ToolWikiEntry | undefined {
  return TOOL_WIKI[toolId];
}
