// Export category configuration for hierarchical views

export interface ExportCategory {
  id: string;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  toolTypes: string[];
}

export const EXPORT_CATEGORIES: ExportCategory[] = [
  {
    id: "planet",
    label: "Planet View",
    description: "Star systems, planetary profiles, and environmental cascades",
    icon: "Globe",
    toolTypes: [
      "star-system-builder",
      "planetary-profile",
      "environmental-chain-reaction",
      "one-big-lie",
      "habitable-zone-calculator",
      "surface-gravity-calculator",
    ],
  },
  {
    id: "species",
    label: "Species View",
    description: "Evolutionary biology and species interactions",
    icon: "Dna",
    toolTypes: ["evolutionary-biology", "sensorium", "species-interaction-matrix"],
  },
  {
    id: "empire",
    label: "Empire View",
    description: "Political structures, technology impacts, and galactic civilizations",
    icon: "Crown",
    toolTypes: [
      "empire-designer",
      "technology-consequences",
      "drake-equation-calculator",
      "space-expansion-modeler",
      "timeline",
    ],
  },
  {
    id: "spacecraft",
    label: "Spacecraft View",
    description: "Spacecraft design and propulsion consequences",
    icon: "Rocket",
    toolTypes: ["spacecraft-designer", "propulsion-consequences-map", "time-dilation", "gravitas"],
  },
  {
    id: "culture",
    label: "Culture View",
    description: "Mythological and cultural frameworks",
    icon: "Sparkles",
    toolTypes: ["xenomythology-framework-builder", "lexdrift"],
  },
];

export function getCategoryById(
  categoryId: string
): ExportCategory | undefined {
  return EXPORT_CATEGORIES.find((c) => c.id === categoryId);
}

export function getCategoryForTool(
  toolType: string
): ExportCategory | undefined {
  return EXPORT_CATEGORIES.find((c) => c.toolTypes.includes(toolType));
}
