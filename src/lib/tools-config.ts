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
