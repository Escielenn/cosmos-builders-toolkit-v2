// ---------------------------------------------------------------------------
// entity-graph-mapping — one graph (F3).
//
// `world_entries` + `world_connections` are the only entity model. These pure
// functions carry rows of those two tables into the `Entity` and
// `EntityConnection` shapes every surface already speaks, so the sidebar, the
// Studio panel, the Showcase and the Web view all read the same rows.
//
// No Supabase import lives here on purpose: this file is where the fold is
// tested (src/services/__tests__/entity-graph-mapping.test.ts).
//
// AMENDMENTS 2026-09-03 recorded the two-model finding; this is its other half.
// ---------------------------------------------------------------------------

import {
  ENTITY_TYPES,
  ENTITY_TYPE_CASCADE_DEFAULTS,
  LEGACY_CONNECTION_TYPE_MAP,
  RELATIONSHIP_STAGE_OF,
  isCascadeStage,
  isConnectionCascadeStage,
  isEntityType,
  type CascadeStage,
  type ConnectionCascadeStage,
  type ConnectionStatus,
  type CreateConnectionInput,
  type CreateEntityInput,
  type Entity,
  type EntityConnection,
  type EntityType,
  type UpdateConnectionInput,
  type UpdateEntityInput,
} from "./entity-graph-types";

// ---------------------------------------------------------------------------
// Row shapes
//
// Declared structurally rather than imported from the generated Supabase
// types: the F3 columns on world_connections do not exist until
// 20260906_f3_one_graph.sql is applied, and every one of them is optional
// here so a pre-migration row still maps.
// ---------------------------------------------------------------------------

export interface WorldEntryRow {
  id: string;
  world_id: string;
  entry_type: string;
  title: string;
  content?: string | null;
  metadata?: unknown;
  tags?: string[] | null;
  icon?: string | null;
  color?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WorldConnectionRow {
  id: string;
  world_id: string;
  source_entry_id?: string | null;
  target_entry_id?: string | null;
  connection_type: string;
  description?: string | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
  // Added by 20260906_f3_one_graph.sql.
  relationship_label?: string | null;
  cascade_stage?: string | null;
  bidirectional?: boolean | null;
  strength?: number | null;
  status?: string | null;
  time_start?: string | null;
  time_end?: string | null;
  notes?: string | null;
}

/** `world_entries.entry_type` values that are nodes in the Web view. */
export const ENTITY_ENTRY_TYPES: readonly string[] = ENTITY_TYPES;

// ---------------------------------------------------------------------------
// Entity metadata
//
// world_entries has no column for summary, notes, image, graph position or
// cascade stage, so those live under `metadata`. Every write MERGES: a
// caller that sets graph_x must not erase summary.
// ---------------------------------------------------------------------------

const ENTITY_META_KEYS = [
  "summary",
  "notes",
  "image_url",
  "custom_type_label",
  "cascade_stage",
  "graph_x",
  "graph_y",
  "pinned",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// ---------------------------------------------------------------------------
// world_entries row → Entity
// ---------------------------------------------------------------------------

/**
 * An entry whose type is not an entity kind still maps, as `custom` carrying
 * its original type as the label. Nothing is silently relabelled as a planet.
 */
export function rowToEntity(row: WorldEntryRow): Entity {
  const meta = asRecord(row.metadata);
  const entryType = row.entry_type;
  const known = isEntityType(entryType);
  const entityType: EntityType = isEntityType(entryType) ? entryType : "custom";

  const cascadeStage: CascadeStage = isCascadeStage(meta.cascade_stage)
    ? meta.cascade_stage
    : ENTITY_TYPE_CASCADE_DEFAULTS[entityType];

  return {
    id: row.id,
    world_id: row.world_id,
    user_id: row.created_by,
    name: row.title,
    entity_type: entityType,
    custom_type_label:
      str(meta.custom_type_label) ?? (known ? null : entryType),
    cascade_stage: cascadeStage,
    color: row.color ?? null,
    icon: row.icon ?? null,
    summary: str(meta.summary),
    image_url: str(meta.image_url),
    description: row.content ?? null,
    notes: str(meta.notes),
    parent_entity_id: row.parent_id ?? null,
    sort_order: row.sort_order ?? 0,
    tags: row.tags ?? [],
    graph_x: num(meta.graph_x),
    graph_y: num(meta.graph_y),
    pinned: meta.pinned === true,
    metadata: meta,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  };
}

// ---------------------------------------------------------------------------
// Entity input → world_entries row
// ---------------------------------------------------------------------------

export interface WorldEntryInsert {
  world_id: string;
  entry_type: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  created_by: string;
}

export function entityCreateToRow(
  input: CreateEntityInput,
  userId: string
): WorldEntryInsert {
  const entityType = input.entity_type;
  return {
    world_id: input.world_id,
    entry_type: entityType,
    title: input.name,
    content: input.description ?? "",
    metadata: {
      ...asRecord(input.metadata),
      cascade_stage:
        input.cascade_stage ?? ENTITY_TYPE_CASCADE_DEFAULTS[entityType],
      ...(input.summary ? { summary: input.summary } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.custom_type_label
        ? { custom_type_label: input.custom_type_label }
        : {}),
    },
    tags: input.tags ?? [],
    icon: input.icon ?? null,
    color: input.color ?? null,
    parent_id: input.parent_entity_id ?? null,
    created_by: userId,
  };
}

/**
 * Column updates and the merged metadata, computed against the row's CURRENT
 * metadata. Returns `metadata: null` when no metadata key was touched, so the
 * caller can skip the read-modify-write entirely.
 */
export function entityUpdateToRow(
  input: UpdateEntityInput,
  currentMetadata: unknown
): { columns: Record<string, unknown>; metadata: Record<string, unknown> | null } {
  const columns: Record<string, unknown> = {};
  if (input.name !== undefined) columns.title = input.name;
  if (input.entity_type !== undefined) columns.entry_type = input.entity_type;
  if (input.description !== undefined) columns.content = input.description;
  if (input.color !== undefined) columns.color = input.color;
  if (input.icon !== undefined) columns.icon = input.icon;
  if (input.tags !== undefined) columns.tags = input.tags;
  if (input.sort_order !== undefined) columns.sort_order = input.sort_order;
  if (input.parent_entity_id !== undefined) {
    columns.parent_id = input.parent_entity_id;
  }

  const patch: Record<string, unknown> = {};
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.image_url !== undefined) patch.image_url = input.image_url;
  if (input.custom_type_label !== undefined) {
    patch.custom_type_label = input.custom_type_label;
  }
  if (input.cascade_stage !== undefined) patch.cascade_stage = input.cascade_stage;
  if (input.graph_x !== undefined) patch.graph_x = input.graph_x;
  if (input.graph_y !== undefined) patch.graph_y = input.graph_y;
  if (input.pinned !== undefined) patch.pinned = input.pinned;
  if (input.metadata !== undefined) Object.assign(patch, input.metadata);

  const touched =
    Object.keys(patch).length > 0 ||
    // Changing the type has to move the default stage with it, or a planet
    // renamed to a species keeps a physics stage nothing set.
    (input.entity_type !== undefined && input.cascade_stage === undefined);

  if (!touched) return { columns, metadata: null };

  const merged = { ...asRecord(currentMetadata), ...patch };
  if (input.entity_type !== undefined && input.cascade_stage === undefined) {
    merged.cascade_stage = ENTITY_TYPE_CASCADE_DEFAULTS[input.entity_type];
  }
  for (const key of ENTITY_META_KEYS) {
    if (merged[key] === null || merged[key] === undefined) delete merged[key];
  }
  return { columns, metadata: merged };
}

// ---------------------------------------------------------------------------
// world_connections row → EntityConnection
// ---------------------------------------------------------------------------

/**
 * Null for anything that is not an edge between two entities: the legacy
 * worksheet-to-worksheet rows are a property of their worksheets, not a line
 * on the Web (F3-ONE-GRAPH-PROPOSAL.md §1).
 */
export function rowToConnection(
  row: WorldConnectionRow
): EntityConnection | null {
  if (!row.source_entry_id || !row.target_entry_id) return null;

  const type =
    LEGACY_CONNECTION_TYPE_MAP[row.connection_type] ?? row.connection_type;

  const stage: ConnectionCascadeStage = isConnectionCascadeStage(
    row.cascade_stage
  )
    ? row.cascade_stage
    : (RELATIONSHIP_STAGE_OF[type] ?? "cross_cascade");

  const status = row.status;
  const connectionStatus: ConnectionStatus =
    status === "historical" || status === "potential" || status === "severed"
      ? status
      : "active";

  return {
    id: row.id,
    world_id: row.world_id,
    user_id: row.created_by,
    source_entity_id: row.source_entry_id,
    target_entity_id: row.target_entry_id,
    relationship_type: type,
    relationship_label: row.relationship_label ?? null,
    cascade_stage: stage,
    bidirectional: row.bidirectional === true,
    strength: num(row.strength) ?? 5,
    status: connectionStatus,
    time_start: str(row.time_start),
    time_end: str(row.time_end),
    notes: row.notes ?? row.description ?? null,
    metadata: {},
    sort_order: 0,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  };
}

// ---------------------------------------------------------------------------
// Connection input → world_connections row
//
// Split in two so the writer can drop the F3 half if the migration has not
// been applied yet (see entity-graph-crud.ts).
// ---------------------------------------------------------------------------

export function connectionCreateToRow(
  input: CreateConnectionInput,
  userId: string
): { base: Record<string, unknown>; f3: Record<string, unknown> } {
  return {
    base: {
      world_id: input.world_id,
      source_entry_id: input.source_entity_id,
      target_entry_id: input.target_entity_id,
      connection_type: input.relationship_type,
      description: input.notes ?? null,
      created_by: userId,
    },
    f3: {
      relationship_label: input.relationship_label ?? null,
      cascade_stage:
        input.cascade_stage ??
        RELATIONSHIP_STAGE_OF[input.relationship_type] ??
        "cross_cascade",
      bidirectional: input.bidirectional ?? false,
      strength: input.strength ?? 5,
      status: input.status ?? "active",
      time_start: input.time_start ?? null,
      time_end: input.time_end ?? null,
      notes: input.notes ?? null,
    },
  };
}

export function connectionUpdateToRow(input: UpdateConnectionInput): {
  base: Record<string, unknown>;
  f3: Record<string, unknown>;
} {
  const base: Record<string, unknown> = {};
  const f3: Record<string, unknown> = {};

  if (input.relationship_type !== undefined) {
    base.connection_type = input.relationship_type;
  }
  if (input.notes !== undefined) {
    base.description = input.notes;
    f3.notes = input.notes;
  }
  if (input.relationship_label !== undefined) {
    f3.relationship_label = input.relationship_label;
  }
  if (input.cascade_stage !== undefined) f3.cascade_stage = input.cascade_stage;
  if (input.bidirectional !== undefined) f3.bidirectional = input.bidirectional;
  if (input.strength !== undefined) f3.strength = input.strength;
  if (input.status !== undefined) f3.status = input.status;
  if (input.time_start !== undefined) f3.time_start = input.time_start;
  if (input.time_end !== undefined) f3.time_end = input.time_end;

  return { base, f3 };
}
