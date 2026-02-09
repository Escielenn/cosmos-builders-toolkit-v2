// World Bible helpers for organizing worksheets into chapters

export interface ChapterDefinition {
  id: string;
  number: number;
  title: string;
  toolTypes: string[];
}

export const CHAPTERS: ChapterDefinition[] = [
  {
    id: "star-system",
    number: 1,
    title: "Star System & Planets",
    toolTypes: ["star-system-builder", "planetary-profile"],
  },
  {
    id: "environment",
    number: 2,
    title: "Environment",
    toolTypes: ["environmental-chain-reaction"],
  },
  {
    id: "species",
    number: 3,
    title: "Species & Biology",
    toolTypes: ["evolutionary-biology", "species-interaction-matrix"],
  },
  {
    id: "civilizations",
    number: 4,
    title: "Civilizations",
    toolTypes: ["empire-designer", "technology-consequences", "drake-equation-calculator"],
  },
  {
    id: "culture",
    number: 5,
    title: "Culture & Mythology",
    toolTypes: ["xenomythology-framework-builder"],
  },
  {
    id: "technology",
    number: 6,
    title: "Technology & Spacecraft",
    toolTypes: ["spacecraft-designer", "propulsion-consequences-map"],
  },
];

export interface WorksheetRecord {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
}

export interface ChapterWithWorksheets {
  chapter: ChapterDefinition;
  worksheets: WorksheetRecord[];
}

export function groupWorksheetsByChapter(
  worksheets: WorksheetRecord[]
): ChapterWithWorksheets[] {
  return CHAPTERS.map((chapter) => ({
    chapter,
    worksheets: worksheets.filter((ws) =>
      chapter.toolTypes.includes(ws.tool_type)
    ),
  })).filter((cw) => cw.worksheets.length > 0);
}

// Safe nested property access
export function get(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let val: unknown = obj;
  for (const p of parts) {
    if (val && typeof val === "object" && p in val) {
      val = (val as Record<string, unknown>)[p];
    } else {
      return "";
    }
  }
  if (Array.isArray(val)) return val.filter(Boolean).join(", ");
  return val != null ? String(val) : "";
}

// Tool display names
export const TOOL_NAMES: Record<string, string> = {
  "planetary-profile": "Planetary Profile",
  "environmental-chain-reaction": "Environmental Chain Reaction",
  "evolutionary-biology": "Evolutionary Biology",
  "xenomythology-framework-builder": "Xenomythology Framework",
  "spacecraft-designer": "Spacecraft Designer",
  "propulsion-consequences-map": "Propulsion Consequences Map",
  "drake-equation-calculator": "Drake Equation Calculator",
  "star-system-builder": "Star System Builder",
  "empire-designer": "Empire/Government Designer",
  "technology-consequences": "Technology Consequences Map",
  "species-interaction-matrix": "Species Interaction Matrix",
};
