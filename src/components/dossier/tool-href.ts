import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";

/** "Phylo: Evolutionary Biology" → "Phylo". */
export function brandOf(tool: string): string {
  const full = getToolDisplayName(tool);
  const i = full.indexOf(":");
  return i > 0 ? full.slice(0, i) : full;
}

/**
 * Where to send the writer to see or change an upstream value: the tool's
 * route, inside the current world, opened on the worksheet when there is one.
 * With no worksheet it opens the tool fresh, which is the "fill it in" path
 * for a trait that is NOT ON FILE.
 */
export function toolHref(tool: string, worldId: string | null, worksheetId: string | null): string {
  const base = getToolRoute(tool) ?? `/tools/${tool}`;
  const params = new URLSearchParams();
  if (worldId) params.set("worldId", worldId);
  if (worksheetId) params.set("worksheetId", worksheetId);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
