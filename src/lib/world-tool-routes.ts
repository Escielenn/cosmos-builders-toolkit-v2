// ---------------------------------------------------------------------------
// world-tool-routes — where an instrument opens when it has a world.
//
// 13-THE-LIFT §1: instruments open ON an entity, inside the world. The
// in-world route is /worlds/:worldId/tools/:toolId; the standalone
// /tools/:toolId route is the fallback for tools WorldToolPage does not
// mount (simulators, cartographers) and for rows with no world.
//
// IN_WORLD_TOOL_IDS mirrors WORLD_TOOL_SLUGS in src/pages/WorldToolPage.tsx
// without importing the page (and its lazy tool chunks) into lib code. A
// test holds the two lists equal.
// ---------------------------------------------------------------------------

import { TOOL_ROUTES } from "@/lib/tools-config";

export const IN_WORLD_TOOL_IDS: readonly string[] = [
  "environmental-chain-reaction",
  "propulsion-consequences-map",
  "spacecraft-designer",
  "planetary-profile",
  "drake-equation-calculator",
  "xenomythology-framework-builder",
  "evolutionary-biology",
  "star-system-builder",
  "empire-designer",
  "technology-consequences",
  "species-interaction-matrix",
  "one-big-lie",
  "time-dilation",
  "space-expansion-modeler",
  "habitable-zone-calculator",
  "lexdrift",
  "surface-gravity-calculator",
  "timeline",
  "sensorium",
  "gravitas",
  "dossier",
  "kardashev-scale",
  "generation-ship",
];

const IN_WORLD = new Set(IN_WORLD_TOOL_IDS);

export function opensInWorld(toolId: string): boolean {
  return IN_WORLD.has(toolId);
}

export interface ToolLinkParams {
  entityId?: string | null;
  worksheetId?: string | null;
}

function query(params: Record<string, string | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * The URL that opens `toolId`, inside `worldId` when the tool supports it.
 * Returns null for an unknown tool.
 */
export function toolHref(
  toolId: string,
  worldId: string | null | undefined,
  params: ToolLinkParams = {},
): string | null {
  if (worldId && opensInWorld(toolId)) {
    return `/worlds/${worldId}/tools/${toolId}${query({
      entityId: params.entityId,
      worksheetId: params.worksheetId,
    })}`;
  }
  const route = TOOL_ROUTES[toolId];
  if (!route) return null;
  return `${route}${query({
    worldId: worldId ?? null,
    entityId: params.entityId,
    worksheetId: params.worksheetId,
  })}`;
}

/** Open a saved worksheet: in its world when it has one. */
export function worksheetHref(ws: {
  id: string;
  world_id: string | null;
  tool_type: string;
}): string | null {
  return toolHref(ws.tool_type, ws.world_id, { worksheetId: ws.id });
}
