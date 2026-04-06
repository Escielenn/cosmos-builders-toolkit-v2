// ---------------------------------------------------------------------------
// WritingEntityPanel — Left sidebar for the Writing Space.
//
// Two modes:
//   List Mode:   Search input, entities grouped by cascade stage, click to
//                enter Detail Mode.
//   Detail Mode: Back button, entity detail with badges, connections, and
//                insert buttons for @mentions and [[wiki links]].
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  AtSign,
  Link2,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntities, useEntityConnections } from "@/hooks/use-entity-graph";
import {
  CASCADE_STAGES,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
} from "@/services/entity-graph-types";
import type {
  Entity,
  EntityConnection,
  CascadeStage,
} from "@/services/entity-graph-types";
import { EntityHistory } from "@/components/world/EntityHistory";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WritingEntityPanelProps {
  worldId: string;
  open: boolean;
  onToggle: () => void;
  onInsertMention: (name: string) => void;
  onInsertWikiLink: (name: string) => void;
  onPinEntity?: (entity: Entity) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 280;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WritingEntityPanel({
  worldId,
  open,
  onToggle,
  onInsertMention,
  onInsertWikiLink,
  onPinEntity,
}: WritingEntityPanelProps) {
  const { data: entities } = useEntities(worldId);
  const { data: connections } = useEntityConnections(worldId);

  // UI state
  const [filter, setFilter] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Derived
  const entityList = entities ?? [];
  const connectionList = connections ?? [];
  const entityMap = useMemo(
    () => new Map(entityList.map((e) => [e.id, e])),
    [entityList]
  );

  // Filter entities
  const filteredEntities = useMemo(
    () =>
      entityList.filter((e) =>
        filter
          ? e.name.toLowerCase().includes(filter.toLowerCase()) ||
            e.entity_type.toLowerCase().includes(filter.toLowerCase())
          : true
      ),
    [entityList, filter]
  );

  // Group by cascade stage (not entity type)
  const groupedByCascade = useMemo(() => {
    const groups: Record<string, Entity[]> = {};
    for (const entity of filteredEntities) {
      const stage = entity.cascade_stage || "culture";
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(entity);
    }
    return groups;
  }, [filteredEntities]);

  // Get connections for the selected entity
  const selectedEntity = selectedEntityId
    ? entityMap.get(selectedEntityId) ?? null
    : null;

  const entityConnections = useMemo(() => {
    if (!selectedEntityId) return [];
    return connectionList.filter(
      (c) =>
        c.source_entity_id === selectedEntityId ||
        c.target_entity_id === selectedEntityId
    );
  }, [connectionList, selectedEntityId]);

  // Handlers
  const handleSelectEntity = useCallback((entity: Entity) => {
    setSelectedEntityId(entity.id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEntityId(null);
  }, []);

  const formatRelType = (type: string) =>
    type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <aside
      className={cn(
        "h-full flex-shrink-0 border-r border-white/[0.06] bg-[#0E1320]/90 backdrop-blur-md transition-all duration-300 ease-out overflow-hidden"
      )}
      style={{ width: open ? PANEL_WIDTH : 0 }}
    >
      <div className="flex h-full flex-col" style={{ width: PANEL_WIDTH }}>
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
          {selectedEntity ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-tier-3 hover:text-tier-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="font-heading text-[11px] font-light uppercase tracking-[2px]">
                Back
              </span>
            </button>
          ) : (
            <span className="font-heading text-[11px] font-light uppercase tracking-[2px] text-tier-3">
              World Entities
            </span>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-tier-4 hover:text-tier-2 transition-colors"
            title="Collapse panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Detail Mode */}
        {/* --------------------------------------------------------------- */}
        {selectedEntity ? (
          <div className="flex-1 overflow-y-auto sf-custom-scrollbar px-3 py-3 space-y-4">
            {/* Name + type + stage badges */}
            <div>
              <h3 className="font-heading text-sm font-light tracking-wide text-tier-1 mb-1.5">
                {selectedEntity.name}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {/* Entity type badge */}
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border"
                  style={{
                    color:
                      ENTITY_TYPE_COLORS[selectedEntity.entity_type] ??
                      "#15C17B",
                    borderColor: `${
                      ENTITY_TYPE_COLORS[selectedEntity.entity_type] ??
                      "#15C17B"
                    }26`,
                    backgroundColor: `${
                      ENTITY_TYPE_COLORS[selectedEntity.entity_type] ??
                      "#15C17B"
                    }0F`,
                  }}
                >
                  {ENTITY_TYPE_LABELS[selectedEntity.entity_type] ??
                    selectedEntity.entity_type}
                </span>
                {/* Cascade stage badge */}
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border"
                  style={{
                    color:
                      CASCADE_STAGE_COLORS[
                        selectedEntity.cascade_stage as CascadeStage
                      ] ?? "#15C17B",
                    borderColor: `${
                      CASCADE_STAGE_COLORS[
                        selectedEntity.cascade_stage as CascadeStage
                      ] ?? "#15C17B"
                    }26`,
                    backgroundColor: `${
                      CASCADE_STAGE_COLORS[
                        selectedEntity.cascade_stage as CascadeStage
                      ] ?? "#15C17B"
                    }0F`,
                  }}
                >
                  {CASCADE_STAGE_LABELS[
                    selectedEntity.cascade_stage as CascadeStage
                  ] ?? selectedEntity.cascade_stage}
                </span>
              </div>
            </div>

            {/* Summary */}
            {selectedEntity.summary && (
              <div>
                <span className="text-[9px] font-medium uppercase tracking-[1.5px] text-tier-4 block mb-1">
                  Summary
                </span>
                <p className="text-xs text-tier-2 leading-relaxed">
                  {selectedEntity.summary}
                </p>
              </div>
            )}

            {/* Description (rendered HTML) */}
            {selectedEntity.description && (
              <div>
                <span className="text-[9px] font-medium uppercase tracking-[1.5px] text-tier-4 block mb-1">
                  Description
                </span>
                <div
                  className="text-xs text-tier-2 leading-relaxed prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs"
                  dangerouslySetInnerHTML={{
                    __html: selectedEntity.description,
                  }}
                />
              </div>
            )}

            {/* Connections */}
            {entityConnections.length > 0 && (
              <div>
                <span className="text-[9px] font-medium uppercase tracking-[1.5px] text-tier-4 block mb-1.5">
                  Connections ({entityConnections.length})
                </span>
                <div className="space-y-1">
                  {entityConnections.map((conn) => {
                    const isSource =
                      conn.source_entity_id === selectedEntity.id;
                    const otherEntityId = isSource
                      ? conn.target_entity_id
                      : conn.source_entity_id;
                    const otherEntity = entityMap.get(otherEntityId);
                    if (!otherEntity) return null;

                    return (
                      <button
                        key={conn.id}
                        onClick={() => handleSelectEntity(otherEntity)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-sm hover:bg-white/[0.04] transition-colors group"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              otherEntity.color ||
                              ENTITY_TYPE_COLORS[otherEntity.entity_type] ||
                              "#15C17B",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-mono uppercase tracking-[1px] text-tier-4 block">
                            {formatRelType(conn.relationship_type)}
                          </span>
                          <span className="text-xs text-tier-2 truncate block group-hover:text-tier-1 transition-colors">
                            {otherEntity.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History */}
            <EntityHistory
              createdAt={selectedEntity.created_at}
              updatedAt={selectedEntity.updated_at}
              className="pt-2"
            />

            {/* Insert buttons */}
            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => onInsertMention(selectedEntity.name)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-sans font-medium uppercase tracking-[1px] text-[#15C17B] bg-[#15C17B]/[0.06] border border-[#15C17B]/[0.15] rounded-sm hover:bg-[#15C17B]/[0.12] transition-colors"
              >
                <AtSign className="w-3 h-3" />
                Mention
              </button>
              <button
                onClick={() => onInsertWikiLink(selectedEntity.name)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-sans font-medium uppercase tracking-[1px] text-[#5B8DEF] bg-[#5B8DEF]/[0.06] border border-[#5B8DEF]/[0.15] rounded-sm hover:bg-[#5B8DEF]/[0.12] transition-colors"
              >
                <Link2 className="w-3 h-3" />
                Wiki Link
              </button>
            </div>

            {/* Pin to references */}
            {onPinEntity && (
              <div className="pt-1">
                <button
                  onClick={() => onPinEntity(selectedEntity)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-sans font-medium uppercase tracking-[1px] text-[#FFB800] bg-[#FFB800]/[0.06] border border-[#FFB800]/[0.15] rounded-sm hover:bg-[#FFB800]/[0.12] transition-colors"
                >
                  <Pin className="w-3 h-3" />
                  Pin to References
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------- */}
            {/* List Mode */}
            {/* ------------------------------------------------------------- */}

            {/* Search input */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tier-5" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search entities..."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xs pl-7 pr-2.5 py-1.5 text-xs text-tier-2 placeholder:text-tier-5 focus:border-[#15C17B]/35 focus:outline-none"
                />
              </div>
            </div>

            {/* Entity list grouped by cascade stage */}
            <div className="flex-1 overflow-y-auto px-1 pb-4 sf-custom-scrollbar">
              {CASCADE_STAGES.map((stage) => {
                const stageEntities = groupedByCascade[stage];
                if (!stageEntities || stageEntities.length === 0) return null;

                return (
                  <div key={stage} className="mb-3">
                    <div className="px-2 py-1 flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: CASCADE_STAGE_COLORS[stage],
                        }}
                      />
                      <span
                        className="text-[9px] font-medium uppercase tracking-[1.5px]"
                        style={{ color: CASCADE_STAGE_COLORS[stage] }}
                      >
                        {CASCADE_STAGE_LABELS[stage]}
                      </span>
                      <span className="text-[8px] font-mono text-tier-5 ml-auto">
                        {stageEntities.length}
                      </span>
                    </div>
                    {stageEntities.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleSelectEntity(entity)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-sm hover:bg-white/[0.04] transition-colors group"
                        title={`View ${entity.name}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              entity.color ||
                              ENTITY_TYPE_COLORS[entity.entity_type] ||
                              "#15C17B",
                          }}
                        />
                        <span className="text-xs text-tier-2 truncate group-hover:text-tier-1 transition-colors flex-1">
                          {entity.name}
                        </span>
                        <span className="text-[8px] font-mono text-tier-5 uppercase tracking-wider flex-shrink-0">
                          {ENTITY_TYPE_LABELS[entity.entity_type] ??
                            entity.entity_type}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}

              {filteredEntities.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <span className="text-[10px] uppercase tracking-[1.5px] text-tier-5">
                    {filter ? "No matches" : "No entities yet"}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
