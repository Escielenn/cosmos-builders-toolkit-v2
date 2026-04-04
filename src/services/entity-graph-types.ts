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
  environment: "#00D4FF",
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

export const ENTITY_TYPES = [
  "star",
  "planet",
  "moon",
  "species",
  "faction",
  "character",
  "location",
  "technology",
  "event",
  "concept",
  "language",
  "religion",
  "artifact",
  "custom",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  star: "Star",
  planet: "Planet",
  moon: "Moon",
  species: "Species",
  faction: "Faction",
  character: "Character",
  location: "Location",
  technology: "Technology",
  event: "Event",
  concept: "Concept",
  language: "Language",
  religion: "Religion",
  artifact: "Artifact",
  custom: "Custom",
};

/** Default cascade stage when creating an entity of a given type */
export const ENTITY_TYPE_CASCADE_DEFAULTS: Record<EntityType, CascadeStage> = {
  star: "physics",
  planet: "physics",
  moon: "physics",
  species: "biology",
  character: "psychology",
  faction: "culture",
  location: "environment",
  technology: "culture",
  event: "culture",
  concept: "psychology",
  language: "culture",
  religion: "mythology",
  artifact: "culture",
  custom: "culture",
};

/** Default color per entity type (used when entity.color is null) */
export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  star: "#FFB800",
  planet: "#4D9FFF",
  moon: "#9B5DE5",
  species: "#FF00AA",
  character: "#00FF88",
  faction: "#FFB800",
  location: "#4D9FFF",
  technology: "#00D4FF",
  event: "#FF3366",
  concept: "#9B5DE5",
  language: "#00FF88",
  religion: "#FF00AA",
  artifact: "#FFB800",
  custom: "#00D4FF",
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
  ],
};

/** Flat list of all relationship types */
export const ALL_RELATIONSHIP_TYPES = Object.values(
  RELATIONSHIP_TYPES_BY_STAGE
).flat();

/** Human-readable label from snake_case relationship type */
export function formatRelationshipType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
