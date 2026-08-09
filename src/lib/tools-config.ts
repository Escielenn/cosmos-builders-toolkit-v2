// Tool tier configuration for subscription gating

export type SubscriptionTier = 'free' | 'pro' | 'vanguard';

// Early access tools, Vanguard-only until general Pro release.
// Move tool IDs from here to PRO_TOOL_IDS when they graduate.
export const EARLY_ACCESS_TOOL_IDS: string[] = [];

export const isEarlyAccessTool = (toolId: string): boolean => {
  return EARLY_ACCESS_TOOL_IDS.includes(toolId);
};

export const FREE_TOOL_IDS = [
  'environmental-chain-reaction',
  'spacecraft-designer',
  'propulsion-consequences-map',
];

export const PRO_TOOL_IDS = [
  'planetary-profile',
  'space-expansion-modeler',
  'drake-equation-calculator',
  'xenomythology-framework-builder',
  'evolutionary-biology',
  'star-system-builder',
  'empire-designer',
  'technology-consequences',
  'species-interaction-matrix',
  'one-big-lie',
  'time-dilation',
  'habitable-zone-calculator',
  'lexdrift',
  'surface-gravity-calculator',
  'timeline',
  'sensorium',
  'gravitas',
  'kardashev-scale',
  // Simulators
  'rogue',
  'tidelock',
  'exosky',
  'exoforge',
  'solaris',
  // Cartographers
  'stellar-cartographer',
  // Workshop
  'writing-workshop',
];

// The real-time simulators, a subset of PRO_TOOL_IDS. Counted separately in
// marketing copy, so keep it derived rather than restated as a numeral.
export const SIMULATOR_TOOL_IDS = [
  'rogue',
  'tidelock',
  'exosky',
  'exoforge',
  'solaris',
];

// Catalog counts. Every user-facing count ("3 free, 25 with Pro", "all 28
// tools") must read from these so marketing copy can never drift from the
// catalog arrays above.
export const FREE_TOOL_COUNT = FREE_TOOL_IDS.length;
export const PRO_TOOL_COUNT = PRO_TOOL_IDS.length;
export const TOTAL_TOOL_COUNT = FREE_TOOL_COUNT + PRO_TOOL_COUNT;
export const SIMULATOR_COUNT = SIMULATOR_TOOL_IDS.length;

export const isProTool = (toolId: string): boolean => {
  return PRO_TOOL_IDS.includes(toolId);
};

export const isFreeTool = (toolId: string): boolean => {
  return FREE_TOOL_IDS.includes(toolId);
};

// Tool display names (slug → human-readable)
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'environmental-chain-reaction': 'Cascade: Environmental Chain Reaction',
  'spacecraft-designer': 'Vessel: Lived-In Spacecraft Designer',
  'propulsion-consequences-map': 'Impulse: Propulsion Consequences',
  'planetary-profile': 'Genesis: Planetary Profile',
  'drake-equation-calculator': 'Signal: Drake Equation Calculator',
  'xenomythology-framework-builder': 'Mythos: Xenomythology Framework',
  'evolutionary-biology': 'Phylo: Evolutionary Biology',
  'star-system-builder': 'Orrery: Star System Builder',
  'empire-designer': 'Dominion: Empire Designer',
  'technology-consequences': 'Paradigm: Technology Consequences',
  'species-interaction-matrix': 'Symbiosis: Species Interaction Matrix',
  'one-big-lie': 'Axiom: The One Big Lie',
  'time-dilation': 'Paradox: Time Dilation Calculator',
  'space-expansion-modeler': 'Exodus: Space Expansion Modeler',
  'habitable-zone-calculator': 'Goldilocks: Habitable Zone Calculator',
  'lexdrift': 'Lexdrift: Language Evolution',
  'surface-gravity-calculator': 'Atlas: Surface Gravity Calculator',
  'timeline': 'Epoch: Timeline',
  'sensorium': 'Sensorium: Alien Sensory Systems',
  'gravitas': 'Gravitas: Spacecraft & Habitat Gravity Simulator',
  'rogue': 'Rogue: Wandering Object Encounters',
  'tidelock': 'Tidelock: Locked World Simulator',
  'exosky': 'Exosky: Alien Night Sky',
  'exoforge': 'ExoForge: Procedural Exoplanet Forge',
  'solaris': 'Solaris: Procedural Star System Simulator',
  'kardashev-scale': 'K-Scale: Kardashev Scale Calculator',
  // Cartographers
  'stellar-cartographer': 'Stellar Cartographer: Galaxy Mapper',
  // Workshop
  'writing-workshop': 'Writing Prompts',
};

// Canonical route for every tool in the catalog. Shared by the header nav,
// the landing showcase, and the tool reference so a tool can never be listed
// with a different destination on different surfaces.
export const TOOL_ROUTES: Record<string, string> = {
  'environmental-chain-reaction': '/tools/environmental-chain-reaction',
  'spacecraft-designer': '/tools/spacecraft-designer',
  'propulsion-consequences-map': '/tools/propulsion-consequences-map',
  'planetary-profile': '/tools/planetary-profile',
  'space-expansion-modeler': '/tools/space-expansion-modeler',
  'drake-equation-calculator': '/tools/drake-equation-calculator',
  'xenomythology-framework-builder': '/tools/xenomythology-framework-builder',
  'evolutionary-biology': '/tools/evolutionary-biology',
  'star-system-builder': '/tools/star-system-builder',
  'empire-designer': '/tools/empire-designer',
  'technology-consequences': '/tools/technology-consequences',
  'species-interaction-matrix': '/tools/species-interaction-matrix',
  'one-big-lie': '/tools/one-big-lie',
  'time-dilation': '/tools/time-dilation',
  'habitable-zone-calculator': '/tools/habitable-zone-calculator',
  'lexdrift': '/tools/lexdrift',
  'surface-gravity-calculator': '/tools/surface-gravity-calculator',
  'timeline': '/tools/timeline',
  'sensorium': '/tools/sensorium',
  'gravitas': '/tools/gravitas',
  'kardashev-scale': '/tools/kardashev-scale',
  'rogue': '/rogue',
  'tidelock': '/tools/tidelock',
  'exosky': '/tools/exosky',
  'exoforge': '/tools/exoforge',
  'solaris': '/tools/solaris',
  'stellar-cartographer': '/tools/stellar-cartographer',
  'writing-workshop': '/workshop',
};

export const getToolRoute = (toolId: string): string | undefined =>
  TOOL_ROUTES[toolId];

export const getToolDisplayName = (toolType: string): string => {
  return TOOL_DISPLAY_NAMES[toolType] || toolType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Pricing configuration
export const PRICING = {
  pro: {
    monthly: {
      price: 4.99,
      interval: 'month' as const,
      label: 'Monthly',
      courseDiscount: '5%',
    },
    yearly: {
      price: 49,
      interval: 'year' as const,
      label: 'Yearly',
      savings: '18%',
      monthlyEquivalent: 4.08,
      courseDiscount: '10%',
    },
  },
  vanguard: {
    monthly: {
      price: 7.99,
      interval: 'month' as const,
      label: 'Monthly',
      courseDiscount: '10%',
    },
    yearly: {
      price: 79.99,
      interval: 'year' as const,
      label: 'Yearly',
      savings: '17%',
      monthlyEquivalent: 6.66,
      courseDiscount: '25%',
    },
  },
};

// Convenience: course discount lookup by tier + plan_type
export function getCourseDiscount(tier: SubscriptionTier, planType: 'monthly' | 'yearly'): string {
  if (tier === 'vanguard') return PRICING.vanguard[planType].courseDiscount;
  if (tier === 'pro') return PRICING.pro[planType].courseDiscount;
  return '0%';
}
