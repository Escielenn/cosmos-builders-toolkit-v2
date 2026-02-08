// Tool tier configuration for subscription gating

export const FREE_TOOL_IDS = [
  'environmental-chain-reaction',
  'spacecraft-designer',
  'propulsion-consequences-map',
];

export const PRO_TOOL_IDS = [
  'planetary-profile',
  'drake-equation-calculator',
  'xenomythology-framework-builder',
  'evolutionary-biology',
  'star-system-builder',
  'empire-designer',
  'technology-consequences',
  'species-interaction-matrix',
];

export const isProTool = (toolId: string): boolean => {
  return PRO_TOOL_IDS.includes(toolId);
};

export const isFreeTool = (toolId: string): boolean => {
  return FREE_TOOL_IDS.includes(toolId);
};

// Tool display names (slug → human-readable)
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'environmental-chain-reaction': 'Environmental Chain Reaction',
  'spacecraft-designer': 'Spacecraft Designer',
  'propulsion-consequences-map': 'Propulsion Consequences Map',
  'planetary-profile': 'Planetary Profile',
  'drake-equation-calculator': 'Drake Equation Calculator',
  'xenomythology-framework-builder': 'Xenomythology Framework Builder',
  'evolutionary-biology': 'Evolutionary Biology',
  'star-system-builder': 'Star System Builder',
  'empire-designer': 'Empire Designer',
  'technology-consequences': 'Technology Consequences',
  'species-interaction-matrix': 'Species Interaction Matrix',
};

export const getToolDisplayName = (toolType: string): string => {
  return TOOL_DISPLAY_NAMES[toolType] || toolType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Pricing configuration
export const PRICING = {
  monthly: {
    price: 4.99,
    interval: 'month' as const,
    label: 'Monthly',
  },
  yearly: {
    price: 49,
    interval: 'year' as const,
    label: 'Yearly',
    savings: '18%',
    monthlyEquivalent: 4.08,
  },
};
