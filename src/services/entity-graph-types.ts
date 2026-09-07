// ---------------------------------------------------------------------------
// Entity Graph Types
// Types for the World Graph entity layer and cascade-aware connections.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cascade Stages
// ---------------------------------------------------------------------------

export const CASCADE_STAGES = [
  "physics",
  "environment",
  "biology",
  "psychology",
  "mythology",
  "culture",
] as const;

export type CascadeStage = (typeof CASCADE_STAGES)[number];

export type ConnectionCascadeStage = CascadeStage | "cross_cascade";

export const CASCADE_STAGE_COLORS: Record<CascadeStage, string> = {
  physics: "#4D9FFF",
  environment: "#15C17B",
  biology: "#00FF88",
  psychology: "#9B5DE5",
  mythology: "#FF00AA",
  culture: "#FFB800",
};

export const CASCADE_STAGE_LABELS: Record<CascadeStage, string> = {
  physics: "Physics",
  environment: "Environment",
  biology: "Biology",
  psychology: "Psychology",
  mythology: "Mythology",
  culture: "Culture",
};

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

/**
 * The node vocabulary of the one graph (F3). Every value is a valid
 * `world_entries.entry_type`; the five that only `entities` carried
 * (star, moon, event, concept, religion) were added to the CHECK
 * constraint by supabase/migrations/20260906_f3_one_graph.sql, and
 * `star_system` / `mythology` came the other way, from world_entries.
 *
 * Everything NOT in this list — worksheets, documents, notes, milestones —
 * is a property of a node, never a node (F3-ONE-GRAPH-PROPOSAL.md §1).
 */
export const ENTITY_TYPES = [
  "star",
  "star_system",
  "planet",
  "moon",
  "species",
  "faction",
  "character",
  "location",
  "technology",
  "vessel",
  "event",
  "concept",
  "language",
  "religion",
  "mythology",
  "artifact",
  "custom",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  star: "Star",
  star_system: "Star System",
  planet: "Planet",
  moon: "Moon",
  species: "Species",
  faction: "Faction",
  character: "Character",
  location: "Location",
  technology: "Technology",
  vessel: "Vessel",
  event: "Event",
  concept: "Concept",
  language: "Language",
  religion: "Religion",
  mythology: "Mythology",
  artifact: "Artifact",
  custom: "Custom",
};

/** Default cascade stage when creating an entity of a given type */
export const ENTITY_TYPE_CASCADE_DEFAULTS: Record<EntityType, CascadeStage> = {
  star: "physics",
  star_system: "physics",
  planet: "physics",
  moon: "physics",
  species: "biology",
  character: "psychology",
  faction: "culture",
  location: "environment",
  technology: "culture",
  vessel: "culture",
  event: "culture",
  concept: "psychology",
  language: "culture",
  religion: "mythology",
  mythology: "mythology",
  artifact: "culture",
  custom: "culture",
};

/**
 * Default color per entity type (used when entity.color is null).
 *
 * KNOWN DEBT: these are literal hex, and so are CASCADE_STAGE_COLORS above.
 * Eight surfaces concatenate hex alpha onto them (`${color}40`), so
 * converting them to `var(--sf-*)` is a change across those call sites, not
 * a change here — it belongs to a legibility pass, not to F3. Every colour
 * value below is an exact match for an existing token:
 * #FFB800 sf-amber · #4D9FFF sf-azure · #9B5DE5 sf-violet · #FF00AA
 * sf-magenta · #00FF88 sf-emerald · #15C17B sf-teal · #5B8DEF sf-stellar ·
 * #FF3366 sf-crimson.
 */
export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  star: "#FFB800",
  star_system: "#FFB800",
  planet: "#4D9FFF",
  moon: "#9B5DE5",
  species: "#FF00AA",
  character: "#00FF88",
  faction: "#FFB800",
  location: "#4D9FFF",
  technology: "#15C17B",
  vessel: "#5B8DEF",
  event: "#FF3366",
  concept: "#9B5DE5",
  language: "#00FF88",
  religion: "#FF00AA",
  mythology: "#FF00AA",
  artifact: "#FFB800",
  custom: "#15C17B",
};

// ---------------------------------------------------------------------------
// Entity Row
// ---------------------------------------------------------------------------

export interface Entity {
  id: string;
  world_id: string;
  user_id: string;
  name: string;
  entity_type: EntityType;
  custom_type_label: string | null;
  cascade_stage: CascadeStage;
  color: string | null;
  icon: string | null;
  summary: string | null;
  image_url: string | null;
  description: string | null;
  notes: string | null;
  parent_entity_id: string | null;
  sort_order: number;
  tags: string[];
  graph_x: number | null;
  graph_y: number | null;
  pinned: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Connection Status
// ---------------------------------------------------------------------------

export const CONNECTION_STATUSES = [
  "active",
  "historical",
  "potential",
  "severed",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

// ---------------------------------------------------------------------------
// Entity Connection Row
// ---------------------------------------------------------------------------

export interface EntityConnection {
  id: string;
  world_id: string;
  user_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  relationship_label: string | null;
  cascade_stage: ConnectionCascadeStage;
  bidirectional: boolean;
  strength: number;
  status: ConnectionStatus;
  time_start: string | null;
  time_end: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CRUD Input Types
// ---------------------------------------------------------------------------

export interface CreateEntityInput {
  world_id: string;
  name: string;
  entity_type: EntityType;
  custom_type_label?: string | null;
  cascade_stage?: CascadeStage;
  color?: string | null;
  icon?: string | null;
  summary?: string | null;
  description?: string | null;
  notes?: string | null;
  parent_entity_id?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateEntityInput {
  id: string;
  name?: string;
  entity_type?: EntityType;
  custom_type_label?: string | null;
  cascade_stage?: CascadeStage;
  color?: string | null;
  icon?: string | null;
  summary?: string | null;
  image_url?: string | null;
  description?: string | null;
  notes?: string | null;
  parent_entity_id?: string | null;
  sort_order?: number;
  tags?: string[];
  graph_x?: number | null;
  graph_y?: number | null;
  pinned?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateConnectionInput {
  world_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  relationship_label?: string | null;
  cascade_stage: ConnectionCascadeStage;
  bidirectional?: boolean;
  strength?: number;
  status?: ConnectionStatus;
  time_start?: string | null;
  time_end?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateConnectionInput {
  id: string;
  relationship_type?: string;
  relationship_label?: string | null;
  cascade_stage?: ConnectionCascadeStage;
  bidirectional?: boolean;
  strength?: number;
  status?: ConnectionStatus;
  time_start?: string | null;
  time_end?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Relationship Type Taxonomy (Appendix A)
// ---------------------------------------------------------------------------

export const RELATIONSHIP_TYPES_BY_STAGE: Record<
  ConnectionCascadeStage,
  string[]
> = {
  physics: [
    "orbits",
    "orbited_by",
    "gravitationally_bound_to",
    "binary_companion_of",
    "illuminates",
    "illuminated_by",
    "tidally_locked_to",
    "in_lagrange_point_of",
  ],
  environment: [
    "located_on",
    "located_in",
    "contains",
    "adjacent_to",
    "feeds_into",
    "climate_influenced_by",
    "terrain_of",
    "resource_source_for",
    "geologically_linked_to",
  ],
  biology: [
    "evolved_from",
    "evolved_on",
    "native_to",
    "inhabits",
    "preys_on",
    "symbiotic_with",
    "parasitic_on",
    "genetic_ancestor_of",
    "diverged_from",
    "adapted_to",
    "hosts",
    "pollinated_by",
    "domesticated_by",
  ],
  psychology: [
    "fears",
    "desires",
    "perceives",
    "bonded_to",
    "psychologically_shaped_by",
    "traumatized_by",
    "inspired_by",
    "cognitively_linked_to",
    "dreaming_of",
    "memory_of",
  ],
  mythology: [
    "worships",
    "sacred_to",
    "taboo_for",
    "mythologizes",
    "prophesied_by",
    "cursed_by",
    "blessed_by",
    "origin_myth_of",
    "guardian_of",
    "trickster_of",
    "named_after",
    "ritually_bound_to",
  ],
  culture: [
    "allied_with",
    "enemy_of",
    "trades_with",
    "rules",
    "serves",
    "member_of",
    "founded_by",
    "colonized_by",
    "descended_from",
    "speaks",
    "practices",
    "invented",
    "forbids",
    "celebrates",
    "educates",
    "governs",
    "competes_with",
    "mentors",
    "employs",
    "exiled_from",
    // F3: the last of the ten legacy world_connections verbs to need a home.
    "travels_via",
  ],
  cross_cascade: [
    "caused_by",
    "led_to",
    "enabled_by",
    "prevented_by",
    "preceded",
    "followed",
    "concurrent_with",
    "created_by",
    "destroyed_by",
    "transformed_by",
    "references",
    "contradicts",
    "depends_on",
    // The untyped fallback, named on purpose: an edge the writer has not
    // characterised yet still has to have a stage to be drawn and filtered.
    "related_to",
  ],
};

/** Flat list of all relationship types */
export const ALL_RELATIONSHIP_TYPES = Object.values(
  RELATIONSHIP_TYPES_BY_STAGE
).flat();

/**
 * Relationship type → the cascade stage that owns it. Lets an edge colour
 * itself when the row predates F3 and carries no `cascade_stage`. Where a
 * verb appears under two stages the first one listed wins, which is stable
 * because RELATIONSHIP_TYPES_BY_STAGE is a literal.
 */
export const RELATIONSHIP_STAGE_OF: Record<string, ConnectionCascadeStage> =
  Object.entries(RELATIONSHIP_TYPES_BY_STAGE).reduce(
    (acc, [stage, types]) => {
      for (const t of types) {
        if (!(t in acc)) acc[t] = stage as ConnectionCascadeStage;
      }
      return acc;
    },
    {} as Record<string, ConnectionCascadeStage>
  );

/**
 * The ten free-text verbs `world_connections` carried before F3, mapped onto
 * the one vocabulary. The migration rewrites stored rows; this is the same
 * table for anything the app reads that the migration has not reached (a
 * fork made from an older snapshot, say). `created` and `parent_of` are
 * absent on purpose: both need the endpoints' types to resolve, which the
 * migration has and a display path does not.
 */
export const LEGACY_CONNECTION_TYPE_MAP: Record<string, string> = {
  lives_on: "inhabits",
  evolved_from: "evolved_from",
  governs: "governs",
  worships: "worships",
  speaks: "speaks",
  travels_via: "travels_via",
  fights: "enemy_of",
  related_to: "related_to",
  references: "references",
};

/** True when a `world_entries.entry_type` is a node in the Web view. */
export function isEntityType(entryType: string): entryType is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(entryType);
}

/** True when a value is one of the six cascade stages. */
export function isCascadeStage(value: unknown): value is CascadeStage {
  return (
    typeof value === "string" &&
    (CASCADE_STAGES as readonly string[]).includes(value)
  );
}

/** True when a value is a cascade stage or `cross_cascade`. */
export function isConnectionCascadeStage(
  value: unknown
): value is ConnectionCascadeStage {
  return isCascadeStage(value) || value === "cross_cascade";
}

/** Human-readable label from snake_case relationship type */
export function formatRelationshipType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
