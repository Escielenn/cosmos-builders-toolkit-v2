// ---------------------------------------------------------------------------
// EntityListView, Structured relationship browser (section 5).
// Accordion-style list of entities with their connections.
// ---------------------------------------------------------------------------

import { useState, useMemo, useCallback } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CASCADE_STAGES,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  CONNECTION_STATUSES,
  formatRelationshipType,
  type Entity,
  type EntityConnection,
  type CascadeStage,
  type ConnectionStatus,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EntityListViewProps {
  entities: Entity[];
  connections: EntityConnection[];
  onDeleteConnection: (connectionId: string) => void;
  onCreateConnection: (sourceId: string) => void;
  onEntityClick: (entityId: string) => void;
}

// ---------------------------------------------------------------------------
// Sidebar Filter State
// ---------------------------------------------------------------------------

interface FilterState {
  cascadeStages: Set<CascadeStage>;
  entityTypes: Set<string>;
  minStrength: number;
  statuses: Set<ConnectionStatus>;
}

const DEFAULT_FILTERS: FilterState = {
  cascadeStages: new Set(CASCADE_STAGES),
  entityTypes: new Set(),
  minStrength: 1,
  statuses: new Set(["active", "historical"]),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityListView({
  entities,
  connections,
  onDeleteConnection,
  onCreateConnection,
  onEntityClick,
}: EntityListViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Build a map of entityId → connections (both directions)
  const connectionsByEntity = useMemo(() => {
    const map = new Map<string, Array<EntityConnection & { direction: "outgoing" | "incoming" }>>();

    for (const c of connections) {
      // Filter by status and strength
      if (!filters.statuses.has(c.status)) continue;
      if (c.strength < filters.minStrength) continue;

      // Outgoing
      const outList = map.get(c.source_entity_id) ?? [];
      outList.push({ ...c, direction: "outgoing" });
      map.set(c.source_entity_id, outList);

      // Incoming (or bidirectional)
      const inList = map.get(c.target_entity_id) ?? [];
      inList.push({ ...c, direction: "incoming" });
      map.set(c.target_entity_id, inList);
    }

    return map;
  }, [connections, filters.statuses, filters.minStrength]);

  // Entity name lookup
  const entityById = useMemo(() => {
    return new Map(entities.map((e) => [e.id, e]));
  }, [entities]);

  // Filtered entities
  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      if (filters.cascadeStages.size > 0 && !filters.cascadeStages.has(e.cascade_stage)) {
        return false;
      }
      if (filters.entityTypes.size > 0 && !filters.entityTypes.has(e.entity_type)) {
        return false;
      }
      return true;
    });
  }, [entities, filters]);

  // Unique entity types present
  const presentTypes = useMemo(() => {
    const types = new Set<string>();
    entities.forEach((e) => types.add(e.entity_type));
    return Array.from(types).sort();
  }, [entities]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCascadeFilter = useCallback((stage: CascadeStage) => {
    setFilters((prev) => {
      const next = new Set(prev.cascadeStages);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      if (next.size === 0) return prev; // prevent empty
      return { ...prev, cascadeStages: next };
    });
  }, []);

  const toggleTypeFilter = useCallback((type: string) => {
    setFilters((prev) => {
      const next = new Set(prev.entityTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { ...prev, entityTypes: next };
    });
  }, []);

  const toggleStatusFilter = useCallback((status: ConnectionStatus) => {
    setFilters((prev) => {
      const next = new Set(prev.statuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      if (next.size === 0) return prev;
      return { ...prev, statuses: next };
    });
  }, []);

  return (
    <div className="h-full flex" style={{ background: "#0A0E17" }}>
      {/* Left sidebar: filters */}
      <div
        className="w-[180px] shrink-0 overflow-y-auto border-r border-sf-border p-3 space-y-5"
        style={{ background: "rgba(14,19,32,0.9)" }}
      >
        {/* Cascade filter */}
        <div>
          <h4 className="text-[11px] font-heading uppercase tracking-[2px] text-t4 mb-2">
            Cascade
          </h4>
          <div className="space-y-1">
            {CASCADE_STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => toggleCascadeFilter(stage)}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1 text-[12px] font-sans transition-colors text-left",
                  filters.cascadeStages.has(stage)
                    ? "text-t2"
                    : "text-t5"
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: filters.cascadeStages.has(stage)
                      ? CASCADE_STAGE_COLORS[stage]
                      : "rgba(255,255,255,0.15)",
                  }}
                />
                {CASCADE_STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <h4 className="text-[11px] font-heading uppercase tracking-[2px] text-t4 mb-2">
            Type
          </h4>
          <div className="space-y-1">
            {presentTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleTypeFilter(type)}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1 text-[12px] font-sans transition-colors text-left",
                  filters.entityTypes.size === 0 || filters.entityTypes.has(type)
                    ? "text-t2"
                    : "text-t5"
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      filters.entityTypes.size === 0 || filters.entityTypes.has(type)
                        ? (ENTITY_TYPE_COLORS as Record<string, string>)[type] ?? "#15C17B"
                        : "rgba(255,255,255,0.15)",
                  }}
                />
                {(ENTITY_TYPE_LABELS as Record<string, string>)[type] ?? type}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div>
          <h4 className="text-[11px] font-heading uppercase tracking-[2px] text-t4 mb-2">
            Status
          </h4>
          <div className="space-y-1">
            {CONNECTION_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatusFilter(status)}
                className={cn(
                  "w-full px-2 py-1 text-[12px] font-sans transition-colors text-left capitalize",
                  filters.statuses.has(status) ? "text-t2" : "text-t5"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Strength filter */}
        <div>
          <h4 className="text-[11px] font-heading uppercase tracking-[2px] text-t4 mb-2">
            Min Strength
          </h4>
          <input
            type="range"
            min={1}
            max={10}
            value={filters.minStrength}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minStrength: Number(e.target.value),
              }))
            }
            className="w-full accent-teal"
          />
          <span className="text-[11px] font-mono text-t4">
            {filters.minStrength}
          </span>
        </div>
      </div>

      {/* Main content: entity accordion */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredEntities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[12px] text-t4 font-sans">
              No entities match the current filters.
            </p>
          </div>
        )}

        {filteredEntities.map((entity) => {
          const color =
            entity.color ?? (ENTITY_TYPE_COLORS as Record<string, string>)[entity.entity_type] ?? "#15C17B";
          const entityConns = connectionsByEntity.get(entity.id) ?? [];
          const isExpanded = expandedIds.has(entity.id);

          return (
            <div key={entity.id}>
              {/* Entity header row */}
              <button
                type="button"
                onClick={() => toggleExpanded(entity.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors text-left group"
              >
                <ChevronRight
                  className={cn(
                    "w-3 h-3 text-t4 transition-transform duration-150",
                    isExpanded && "rotate-90"
                  )}
                />
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[13px] font-heading font-light text-t1 flex-1 truncate">
                  {entity.name}
                </span>
                <span className="text-[11px] text-t4 uppercase tracking-[1px] font-sans">
                  {(ENTITY_TYPE_LABELS as Record<string, string>)[entity.entity_type]}
                </span>
                <span className="text-[11px] font-mono text-t5">
                  {entityConns.length}
                </span>
              </button>

              {/* Expanded connections */}
              {isExpanded && (
                <div className="ml-7 border-l border-sf-border pl-3 pb-2 space-y-0.5">
                  {entityConns.length === 0 && (
                    <p className="text-[12px] text-t5 font-sans py-1 italic">
                      No connections yet.
                    </p>
                  )}

                  {entityConns.map((conn) => {
                    const otherId =
                      conn.direction === "outgoing"
                        ? conn.target_entity_id
                        : conn.source_entity_id;
                    const otherEntity = entityById.get(otherId);
                    if (!otherEntity) return null;

                    const stageColor =
                      CASCADE_STAGE_COLORS[conn.cascade_stage as CascadeStage] ??
                      "#FFB800";
                    const arrow = conn.direction === "outgoing" ? "\u2192" : "\u2190";

                    return (
                      <div
                        key={`${conn.id}-${conn.direction}`}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-white/[0.03] transition-colors group/conn"
                      >
                        <span className="text-[12px] text-t4">{arrow}</span>
                        <span className="text-[12px] font-sans text-t3">
                          {conn.relationship_label ??
                            formatRelationshipType(conn.relationship_type)}
                        </span>
                        <span className="text-[12px] text-t4">{arrow}</span>
                        <button
                          type="button"
                          onClick={() => onEntityClick(otherEntity.id)}
                          className="text-[12px] font-sans text-t2 hover:text-t1 transition-colors truncate"
                        >
                          {otherEntity.name}
                        </button>
                        <span
                          className="text-[10px] uppercase tracking-[0.5px] px-1 py-0.5 shrink-0"
                          style={{
                            color: stageColor,
                            background: `${stageColor}10`,
                            border: `1px solid ${stageColor}20`,
                          }}
                        >
                          {(conn.cascade_stage as string).slice(0, 4)}
                        </span>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onDeleteConnection(conn.id)}
                          className="ml-auto opacity-0 group-hover/conn:opacity-100 text-t5 hover:text-crimson transition-all"
                          title="Delete connection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add connection button */}
                  <button
                    type="button"
                    onClick={() => onCreateConnection(entity.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-t4 hover:text-teal uppercase tracking-[1px] font-sans transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Add Connection
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
