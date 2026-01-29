import { useMemo } from "react";
import { useWorksheets } from "./use-worksheets";
import { getToolDisplayName } from "@/lib/worksheet-links-config";

export interface GraphNode {
  id: string;
  toolType: string;
  title: string;
  speciesName?: string; // For EvoBio worksheets
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  linkType: string; // "planet", "species", "ecr"
}

export interface WorldGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Hook to build a relationship graph from worksheets in a world.
 *
 * This hook fetches all worksheets in a world and builds a graph
 * of nodes (worksheets) and edges (links between worksheets).
 */
export function useWorldGraph(worldId: string | undefined): WorldGraph & {
  isLoading: boolean;
} {
  const { worksheets, isLoading } = useWorksheets(worldId);

  const graph = useMemo(() => {
    if (!worksheets || worksheets.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Build nodes from worksheets
    const nodes: GraphNode[] = worksheets.map((w) => {
      const data = w.data as Record<string, unknown>;
      return {
        id: w.id,
        toolType: w.tool_type,
        title: w.title || getToolDisplayName(w.tool_type),
        speciesName: data?.speciesName as string | undefined,
      };
    });

    // Build edges from _linkedWorksheets references
    const edges: GraphEdge[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    for (const worksheet of worksheets) {
      const data = worksheet.data as Record<string, unknown>;
      const linkedWorksheets = data?._linkedWorksheets as Record<
        string,
        { worksheetId?: string } | undefined
      > | undefined;

      if (!linkedWorksheets) continue;

      // Handle different link types
      for (const [linkType, linkRef] of Object.entries(linkedWorksheets)) {
        if (!linkRef) continue;

        // Handle legacy ecrWorksheetId format
        if (linkType === "ecrWorksheetId" && typeof linkRef === "string") {
          if (nodeIds.has(linkRef)) {
            edges.push({
              source: linkRef,
              target: worksheet.id,
              linkType: "ecr",
            });
          }
          continue;
        }

        // Handle new format with worksheetId property
        const worksheetId = linkRef.worksheetId;
        if (worksheetId && nodeIds.has(worksheetId)) {
          edges.push({
            source: worksheetId,
            target: worksheet.id,
            linkType,
          });
        }
      }
    }

    return { nodes, edges };
  }, [worksheets]);

  return {
    ...graph,
    isLoading,
  };
}

/**
 * Get the color for a tool type (for graph visualization).
 * Colors match the StellarForge design system.
 */
export function getToolColor(toolType: string): string {
  const colors: Record<string, string> = {
    "planetary-profile": "190 100% 50%", // Cyan
    "evolutionary-biology": "153 100% 50%", // Emerald
    "xenomythology-framework-builder": "263 74% 63%", // Violet
    "environmental-chain-reaction": "328 100% 50%", // Magenta
    "spacecraft-designer": "215 100% 65%", // Azure
    "propulsion-consequences-map": "43 100% 50%", // Amber
    "drake-equation-calculator": "347 100% 60%", // Crimson
  };
  return colors[toolType] || "0 0% 60%"; // Default gray
}

/**
 * Get the icon name for a tool type.
 */
export function getToolIconName(toolType: string): string {
  const icons: Record<string, string> = {
    "planetary-profile": "Globe",
    "evolutionary-biology": "Dna",
    "xenomythology-framework-builder": "Sparkles",
    "environmental-chain-reaction": "GitBranch",
    "spacecraft-designer": "Rocket",
    "propulsion-consequences-map": "Zap",
    "drake-equation-calculator": "Calculator",
  };
  return icons[toolType] || "FileText";
}
