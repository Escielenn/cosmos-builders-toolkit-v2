// ---------------------------------------------------------------------------
// Dossier relationships → world_connections.
//
// The world has one edge vocabulary (entity-graph-types RELATIONSHIP_TYPES_BY_
// STAGE, F3). A character's "rival" is not a new verb; it is `competes_with`
// labelled "Rival", so the Codex Web view, the graph filters and every other
// reader of world_connections draw it without special-casing Dossier.
//
// The worksheet keeps the relationship list as the writer's working copy
// (target name, note, the custom label) and mirrors each edge as a
// world_connections row whose id it records. This module is the pure half:
// the verb mapping and the diff between what is saved and what is on screen.
// ---------------------------------------------------------------------------

import type { DossierRelationship, RelationshipType } from "@/lib/dossier/types";

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  ally: "Ally",
  rival: "Rival",
  kin: "Kin",
  mentor: "Mentor",
  lover: "Lover",
  enemy: "Enemy",
  custom: "Custom",
};

/** Verb from the one vocabulary for each relationship type. */
export const RELATIONSHIP_VERBS: Record<RelationshipType, string> = {
  ally: "allied_with",
  rival: "competes_with",
  kin: "related_to",
  mentor: "mentors",
  lover: "bonded_to",
  enemy: "enemy_of",
  custom: "related_to",
};

/** Kin and lovers and allies go both ways; mentor and descent do not. */
export const RELATIONSHIP_BIDIRECTIONAL: Record<RelationshipType, boolean> = {
  ally: true,
  rival: true,
  kin: true,
  mentor: false,
  lover: true,
  enemy: true,
  custom: false,
};

/** The label a reader sees: the custom text for custom edges, else the type. */
export function relationshipLabel(r: Pick<DossierRelationship, "type" | "customLabel">): string {
  if (r.type === "custom") return r.customLabel.trim() || RELATIONSHIP_LABELS.custom;
  return RELATIONSHIP_LABELS[r.type];
}

export interface ConnectionPlan {
  /** Relationships that need a world_connections row. */
  create: DossierRelationship[];
  /** Relationships whose row exists but whose label or note changed. */
  update: DossierRelationship[];
  /** Row ids no longer backed by any relationship on screen. */
  remove: string[];
}

/**
 * Diff the relationships on screen against the ones last saved.
 *
 * `saved` is the list as it was when the worksheet loaded (or last saved);
 * any connection id it carried that the current list no longer carries is a
 * removal. A relationship whose target changed is a remove plus a create,
 * because world_connections endpoints are not edited in place.
 */
export function planConnectionSync(
  current: DossierRelationship[],
  saved: DossierRelationship[],
): ConnectionPlan {
  const savedById = new Map(
    saved.filter((r) => r.connectionId).map((r) => [r.connectionId as string, r]),
  );
  const create: DossierRelationship[] = [];
  const update: DossierRelationship[] = [];
  const kept = new Set<string>();

  for (const r of current) {
    if (!r.targetId) continue;
    const prev = r.connectionId ? savedById.get(r.connectionId) : undefined;
    if (!prev) {
      create.push({ ...r, connectionId: null });
      continue;
    }
    if (prev.targetId !== r.targetId || prev.targetKind !== r.targetKind) {
      create.push({ ...r, connectionId: null });
      continue;
    }
    kept.add(prev.connectionId as string);
    if (
      prev.type !== r.type ||
      prev.customLabel !== r.customLabel ||
      prev.note !== r.note
    ) {
      update.push(r);
    }
  }

  const remove = [...savedById.keys()].filter((id) => !kept.has(id));
  return { create, update, remove };
}
