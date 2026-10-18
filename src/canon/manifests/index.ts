// ---------------------------------------------------------------------------
// canon/manifests, the registry of wired tools.
//
// A tool is "on the graph" when its manifest is listed here. Two today: the
// Charter's gravity demo (Genesis produces mass and radius; Atlas derives
// gravity from them). Add the rest one tool per session with /sf-wire.
// ---------------------------------------------------------------------------

import type { ToolManifest } from "@/canon/manifest";
import { manifest as genesis } from "@/tools/genesis/manifest";
import { manifest as atlas } from "@/tools/atlas/manifest";

export const MANIFESTS: readonly ToolManifest[] = [genesis, atlas];

const BY_ID = new Map(MANIFESTS.map((m) => [m.id, m]));
const BY_TOOL = new Map(MANIFESTS.map((m) => [m.tool, m]));

export function manifestById(id: string): ToolManifest | undefined {
  return BY_ID.get(id);
}

/** By tools-config slug, what worksheets.tool_type stores. */
export function manifestForTool(slug: string): ToolManifest | undefined {
  return BY_TOOL.get(slug);
}

/** The manifest that produces `predicate`, if any wired tool does. */
export function producerOf(predicate: string): ToolManifest | undefined {
  return MANIFESTS.find((m) => m.produces.some((p) => p.predicate === predicate));
}
