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
  'species-creator',
  'culture-designer',
  'technology-mapper',
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
    price: 12.50,
    interval: 'month' as const,
    label: 'Monthly',
  },
  yearly: {
    price: 99,
    interval: 'year' as const,
    label: 'Yearly',
    savings: '34%',
    monthlyEquivalent: 8.25,
  },
};
