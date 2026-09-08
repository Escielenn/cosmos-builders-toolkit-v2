// ---------------------------------------------------------------------------
// Entity → WorldEntry, for the bind layer.
//
// The Atlas holds `Entity` (the shape every surface speaks since F3); bind/
// reads `WorldEntry` because that is the row facts actually live on. Since
// F3 folded the two tables these are the same row under two names, so this is
// a rename, not a conversion — and keeping it in one place stops the rename
// being re-derived slightly differently at each call site.
// ---------------------------------------------------------------------------

import type { Entity } from "@/services/entity-graph-types";
import type { WorldEntry } from "@/services/world-data";

export function entityToWorldEntry(entity: Entity): WorldEntry {
  return {
    id: entity.id,
    world_id: entity.world_id,
    entry_type: entity.entity_type,
    title: entity.name,
    content: entity.description,
    metadata: entity.metadata as WorldEntry["metadata"],
    sort_order: entity.sort_order,
    parent_id: entity.parent_entity_id,
    icon: entity.icon,
    color: entity.color,
    tool_source: null,
    tool_data_id: null,
    layer: null,
    cover_image_url: null,
    tags: entity.tags,
    created_by: entity.user_id,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  } as WorldEntry;
}
