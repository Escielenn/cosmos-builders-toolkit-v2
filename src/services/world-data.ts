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
  tool_source: string | null;
  tool_data_id: string | null;
  layer: string | null;
  cover_image_url: string | null;
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

// ---------------------------------------------------------------------------
// Codex data types
// ---------------------------------------------------------------------------

export interface CodexElement {
  id: string;
  title: string;
  kind: "worksheet" | "entry";
  type: string;
  layer: CascadeLayer;
  toolSource: string | null;
  toolDataId: string | null;
  entryId: string | null;
  status: CompletionStatus;
  isDraft: boolean;
  children: CodexElement[];
  tags: string[];
  updatedAt: string;
  sortOrder: number;
}

export interface CodexSection {
  key: CascadeLayer;
  label: string;
  order: number;
  elements: CodexElement[];
  isExpanded: boolean;
}

export interface CodexData {
  worldId: string;
  worldName: string;
  cascadeSections: CodexSection[];
  customEntries: CodexElement[];
  recentEdits: CodexElement[];
  totalElements: number;
  completionPercent: number;
}

// ---------------------------------------------------------------------------
// Tool → element type mapping
// ---------------------------------------------------------------------------

const TOOL_TYPE_MAP: Record<string, string> = {
  "planetary-profile": "planet",
  "star-system-builder": "star_system",
  "environmental-chain-reaction": "chain_reaction",
  "habitable-zone-calculator": "habitable_zone",
  "one-big-lie": "axiom",
  "surface-gravity-calculator": "gravity_profile",
  "evolutionary-biology": "species",
  "sensorium": "sensory_system",
  "species-interaction-matrix": "interaction_matrix",
  "empire-designer": "government",
  "lexdrift": "language",
  "space-expansion-modeler": "expansion_model",
  "xenomythology-framework-builder": "mythology",
  "technology-consequences": "technology",
  "propulsion-consequences-map": "propulsion",
  "spacecraft-designer": "vessel",
  "time-dilation": "time_dilation",
  "gravitas": "gravity_sim",
  "timeline": "timeline",
  "drake-equation-calculator": "signal_profile",
};

export function getTypeForTool(toolType: string): string {
  return TOOL_TYPE_MAP[toolType] ?? "note";
}

// ---------------------------------------------------------------------------
// Codex aggregator
// ---------------------------------------------------------------------------

export async function getCodexData(worldId: string): Promise<CodexData> {
  // Fetch world + worksheets + entries in parallel
  const [worldRes, worksheetsRes, entriesRes] = await Promise.all([
    supabase
      .from("worlds")
      .select("id, name")
      .eq("id", worldId)
      .single(),
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
  ]);

  if (worldRes.error) throw worldRes.error;
  if (worksheetsRes.error) throw worksheetsRes.error;
  if (entriesRes.error) throw entriesRes.error;

  const world = worldRes.data;
  const worksheets = worksheetsRes.data ?? [];
  const entries = (entriesRes.data ?? []) as WorldEntry[];

  // Build lookup: tool_data_id → entry (for linked entries)
  const linkedEntryMap = new Map<string, WorldEntry>();
  for (const entry of entries) {
    if (entry.tool_data_id) {
      linkedEntryMap.set(entry.tool_data_id, entry);
    }
  }

  // Build cascade sections
  const sectionElements: Record<CascadeLayer, CodexElement[]> = {
    environment: [],
    biology: [],
    psychology: [],
    culture: [],
    mythology: [],
    technology: [],
    narrative: [],
  };

  const allCodexElements: CodexElement[] = [];

  for (const ws of worksheets) {
    const layer = getLayerForTool(ws.tool_type);
    const data = (ws.data as Record<string, unknown>) ?? {};
    const linkedEntry = linkedEntryMap.get(ws.id);
    const tags = ws.tags as string[] ?? [];

    const el: CodexElement = {
      id: ws.id,
      title: ws.title || TOOL_DISPLAY_NAMES[ws.tool_type] || ws.tool_type,
      kind: "worksheet",
      type: getTypeForTool(ws.tool_type),
      layer,
      toolSource: ws.tool_type,
      toolDataId: ws.id,
      entryId: linkedEntry?.id ?? null,
      status: determineCompletionStatus(data),
      isDraft: linkedEntry ? !linkedEntry.content : true,
      children: [],
      tags,
      updatedAt: ws.updated_at,
      sortOrder: 0,
    };

    sectionElements[layer].push(el);
    allCodexElements.push(el);
  }

  // Add entries that are linked to a tool but not yet covered (orphan entries with layer)
  for (const entry of entries) {
    if (entry.tool_data_id && entry.layer) {
      const layer = entry.layer as CascadeLayer;
      // Only add if the worksheet wasn't already in that section
      const alreadyHas = sectionElements[layer]?.some(
        (e) => e.toolDataId === entry.tool_data_id
      );
      if (!alreadyHas && sectionElements[layer]) {
        const el: CodexElement = {
          id: entry.id,
          title: entry.title,
          kind: "entry",
          type: entry.entry_type,
          layer,
          toolSource: entry.tool_source,
          toolDataId: entry.tool_data_id,
          entryId: entry.id,
          status: entry.content ? "partial" : "empty",
          isDraft: !entry.content,
          children: [],
          tags: [],
          updatedAt: entry.updated_at,
          sortOrder: entry.sort_order,
        };
        sectionElements[layer].push(el);
        allCodexElements.push(el);
      }
    }
  }

  const cascadeSections: CodexSection[] = LAYER_ORDER.map((key, idx) => ({
    key,
    label: LAYER_LABELS[key],
    order: idx + 1,
    elements: sectionElements[key],
    isExpanded: sectionElements[key].length > 0,
  }));

  // Custom entries: entries with NO tool_source
  const customEntries: CodexElement[] = entries
    .filter((e) => !e.tool_source)
    .map((e) => ({
      id: e.id,
      title: e.title,
      kind: "entry" as const,
      type: e.entry_type,
      layer: "narrative" as CascadeLayer,
      toolSource: null,
      toolDataId: null,
      entryId: e.id,
      status: (e.content ? "partial" : "empty") as CompletionStatus,
      isDraft: !e.content,
      children: [],
      tags: [],
      updatedAt: e.updated_at,
      sortOrder: e.sort_order,
    }));

  // Recent edits: last 5 modified across worksheets + entries
  const recentEdits = [...allCodexElements, ...customEntries]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Completion: % of non-empty layers that are complete
  const totalElements = allCodexElements.length + customEntries.length;
  const nonEmptySections = cascadeSections.filter((s) => s.elements.length > 0);
  const completeSections = nonEmptySections.filter((s) =>
    s.elements.every((e) => e.status === "complete")
  );
  const completionPercent =
    cascadeSections.length === 0
      ? 0
      : Math.round((completeSections.length / cascadeSections.length) * 100);

  return {
    worldId,
    worldName: world.name,
    cascadeSections,
    customEntries,
    recentEdits,
    totalElements,
    completionPercent,
  };
}
