import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { TOOL_DISPLAY_NAMES } from "@/lib/worksheet-links-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CascadeLayer =
  | "environment"
  | "biology"
  | "psychology"
  | "culture"
  | "mythology"
  | "technology"
  | "narrative";

export type CompletionStatus = "complete" | "partial" | "empty";

export interface WorldElement {
  id: string;
  kind: "worksheet" | "entry";
  title: string;
  /** Tool slug (only for worksheets) */
  toolType?: string;
  /** Branded tool name e.g. "Genesis" */
  toolDisplayName?: string;
  /** Entry type (only for entries) */
  entryType?: string;
  /** Cascade layer this element belongs to */
  layerId: CascadeLayer;
  completionStatus: CompletionStatus;
  /** Parent entry id (tree hierarchy) */
  parentId?: string | null;
  /** Raw worksheet data for determining completion */
  data?: Record<string, unknown>;
}

export interface WorldLayerData {
  layerId: CascadeLayer;
  label: string;
  elements: WorldElement[];
  completionStatus: CompletionStatus;
}

export interface WorldEntry {
  id: string;
  world_id: string;
  entry_type: string;
  title: string;
  content: string | null;
  metadata: Json;
  sort_order: number;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorldConnection {
  id: string;
  world_id: string;
  source_worksheet_id: string | null;
  target_worksheet_id: string | null;
  source_entry_id: string | null;
  target_entry_id: string | null;
  connection_type: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface WorldDataSummary {
  layers: WorldLayerData[];
  entries: WorldEntry[];
  connections: WorldConnection[];
  totalCompletion: number;
}

// ---------------------------------------------------------------------------
// Layer configuration
// ---------------------------------------------------------------------------

export const LAYER_ORDER: CascadeLayer[] = [
  "environment",
  "biology",
  "psychology",
  "culture",
  "mythology",
  "technology",
  "narrative",
];

export const LAYER_LABELS: Record<CascadeLayer, string> = {
  environment: "Environment",
  biology: "Biology",
  psychology: "Psychology",
  culture: "Culture",
  mythology: "Mythology",
  technology: "Technology",
  narrative: "Narrative",
};

export const LAYER_TOOL_MAP: Record<CascadeLayer, string[]> = {
  environment: [
    "star-system-builder",
    "planetary-profile",
    "environmental-chain-reaction",
    "habitable-zone-calculator",
    "one-big-lie",
    "surface-gravity-calculator",
  ],
  biology: ["evolutionary-biology", "sensorium", "species-interaction-matrix"],
  psychology: [], // No dedicated tool — evo-bio psychology sections
  culture: ["empire-designer", "lexdrift", "space-expansion-modeler"],
  mythology: ["xenomythology-framework-builder"],
  technology: [
    "technology-consequences",
    "propulsion-consequences-map",
    "spacecraft-designer",
    "time-dilation",
    "gravitas",
  ],
  narrative: ["timeline", "drake-equation-calculator"],
};

/** Reverse lookup: tool → layer */
const TOOL_TO_LAYER: Record<string, CascadeLayer> = {};
for (const [layer, tools] of Object.entries(LAYER_TOOL_MAP)) {
  for (const tool of tools) {
    TOOL_TO_LAYER[tool] = layer as CascadeLayer;
  }
}

export function getLayerForTool(toolType: string): CascadeLayer {
  return TOOL_TO_LAYER[toolType] ?? "narrative";
}

// ---------------------------------------------------------------------------
// Completion heuristic
// ---------------------------------------------------------------------------

function countNonEmptyKeys(data: Record<string, unknown>): number {
  let count = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("_")) continue; // skip internal fields like _linkedWorksheets
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) continue;
    count++;
  }
  return count;
}

export function determineCompletionStatus(
  data: Record<string, unknown> | undefined
): CompletionStatus {
  if (!data) return "empty";
  const filled = countNonEmptyKeys(data);
  if (filled === 0) return "empty";
  // "Complete" threshold: at least 5 non-empty top-level keys
  if (filled >= 5) return "complete";
  return "partial";
}

function layerCompletionFromElements(elements: WorldElement[]): CompletionStatus {
  if (elements.length === 0) return "empty";
  const statuses = elements.map((e) => e.completionStatus);
  if (statuses.every((s) => s === "complete")) return "complete";
  if (statuses.every((s) => s === "empty")) return "empty";
  return "partial";
}

// ---------------------------------------------------------------------------
// Entry tree builder
// ---------------------------------------------------------------------------

export interface EntryTreeNode extends WorldEntry {
  children: EntryTreeNode[];
}

export function buildEntryTree(entries: WorldEntry[]): EntryTreeNode[] {
  const map = new Map<string, EntryTreeNode>();
  const roots: EntryTreeNode[] = [];

  // Create tree nodes
  for (const entry of entries) {
    map.set(entry.id, { ...entry, children: [] });
  }

  // Build tree
  for (const entry of entries) {
    const node = map.get(entry.id)!;
    if (entry.parent_id && map.has(entry.parent_id)) {
      map.get(entry.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by sort_order
  const sortChildren = (nodes: EntryTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

// ---------------------------------------------------------------------------
// Main aggregator
// ---------------------------------------------------------------------------

export async function getWorldData(worldId: string): Promise<WorldDataSummary> {
  // Fetch all three data sources in parallel
  const [worksheetsRes, entriesRes, connectionsRes] = await Promise.all([
    supabase
      .from("worksheets")
      .select("*")
      .eq("world_id", worldId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("world_entries")
      .select("*")
      .eq("world_id", worldId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("world_connections")
      .select("*")
      .eq("world_id", worldId)
      .order("created_at", { ascending: false }),
  ]);

  if (worksheetsRes.error) throw worksheetsRes.error;
  if (entriesRes.error) throw entriesRes.error;
  if (connectionsRes.error) throw connectionsRes.error;

  const worksheets = worksheetsRes.data ?? [];
  const entries = (entriesRes.data ?? []) as WorldEntry[];
  const connections = (connectionsRes.data ?? []) as WorldConnection[];

  // Group worksheets by cascade layer
  const layerWorksheets: Record<CascadeLayer, WorldElement[]> = {
    environment: [],
    biology: [],
    psychology: [],
    culture: [],
    mythology: [],
    technology: [],
    narrative: [],
  };

  for (const ws of worksheets) {
    const layer = getLayerForTool(ws.tool_type);
    const data = (ws.data as Record<string, unknown>) ?? {};

    layerWorksheets[layer].push({
      id: ws.id,
      kind: "worksheet",
      title: ws.title || TOOL_DISPLAY_NAMES[ws.tool_type] || ws.tool_type,
      toolType: ws.tool_type,
      toolDisplayName: TOOL_DISPLAY_NAMES[ws.tool_type] || ws.tool_type,
      layerId: layer,
      completionStatus: determineCompletionStatus(data),
      data,
    });
  }

  // Build layer summaries
  const layers: WorldLayerData[] = LAYER_ORDER.map((layerId) => ({
    layerId,
    label: LAYER_LABELS[layerId],
    elements: layerWorksheets[layerId],
    completionStatus: layerCompletionFromElements(layerWorksheets[layerId]),
  }));

  // Calculate total completion
  const nonEmptyLayers = layers.filter((l) => l.elements.length > 0);
  const totalCompletion =
    layers.length === 0
      ? 0
      : Math.round(
          (nonEmptyLayers.filter((l) => l.completionStatus === "complete").length /
            layers.length) *
            100
        );

  return { layers, entries, connections, totalCompletion };
}
