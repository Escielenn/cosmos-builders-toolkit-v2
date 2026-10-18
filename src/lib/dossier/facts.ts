// ---------------------------------------------------------------------------
// Dossier facts — provenance for the writing surface.
//
// The path mapping in ./fields.ts finds a character's values; this says who
// asserted each one (Law II). A continuity note can then read "Phylo,
// inherited by Kael's dossier" instead of "Your world", and the writer knows
// which worksheet to open if they disagree.
//
// Kept deliberately light: worksheet-facts imports this, and worksheet-facts
// is on the writing surface's hot path, so nothing here may pull in the
// upstream tool catalogues that ./inheritance.ts needs.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";
import { getToolDisplayName } from "@/lib/tools-config";
import { DOSSIER_RESOLVED_KEY } from "@/lib/dossier/fields";

function brand(tool: string): string {
  const full = getToolDisplayName(tool);
  const i = full.indexOf(":");
  return i > 0 ? full.slice(0, i) : full;
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

/** Stamp each dossier fact with where its value came from. */
export function annotateDossierFacts(facts: WorksheetFact[], data: unknown): WorksheetFact[] {
  const d = obj(data);
  const rawName = obj(d.identity).name;
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : "This character";
  const provenance = obj(d.provenance);
  const owner = `${name}'s dossier`;

  return facts.map((fact) => {
    const resolvedKey = DOSSIER_RESOLVED_KEY[fact.key];
    const src = resolvedKey ? provenance[resolvedKey] : undefined;
    let source = owner;
    if (typeof src === "string" && src && src !== "dossier") {
      source = src === "override" ? `${owner} (writer override)` : `${brand(src)}, inherited by ${owner}`;
    }
    return { ...fact, source };
  });
}
