// ---------------------------------------------------------------------------
// canon/manifests, the registry of wired tools.
//
// A tool is "on the graph" when its manifest is listed here: the Charter's
// gravity demo (Genesis, Atlas) and the 1.5 item 10 dedupe set. Add the rest
// one tool per session with /sf-wire.
// ---------------------------------------------------------------------------

import type { ToolManifest } from "@/canon/manifest";
import { manifest as genesis } from "@/tools/genesis/manifest";
import { manifest as atlas } from "@/tools/atlas/manifest";
import { manifest as orrery } from "@/tools/orrery/manifest";
import { manifest as goldilocks } from "@/tools/goldilocks/manifest";
import { manifest as impulse } from "@/tools/impulse/manifest";
import { manifest as vessel } from "@/tools/vessel/manifest";
import { manifest as paradox } from "@/tools/paradox/manifest";
import { manifest as axiom } from "@/tools/axiom/manifest";
import { manifest as exodus } from "@/tools/exodus/manifest";

export const MANIFESTS: readonly ToolManifest[] = [
  genesis,
  atlas,
  // 1.5 item 10, one home for each duplicated value: every tool that held a
  // copy of starType, mass/radius, propulsionType, crewSize or theOneBigLie,
  // and the owner each copy now reads from (canon/ownership SINGLE_HOME).
  orrery,
  goldilocks,
  impulse,
  vessel,
  paradox,
  axiom,
  exodus,
];

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
