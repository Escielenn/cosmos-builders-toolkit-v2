// ---------------------------------------------------------------------------
// AnalysisPanel, Slide-out right panel for all graph analytical tools.
// Renders the active analysis mode's content.
// ---------------------------------------------------------------------------

import { useMemo, useState, useCallback } from "react";
import { X, AlertTriangle, Target, Waypoints, Gauge, Boxes, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type Entity,
  type EntityConnection,
  type CascadeStage,
  type EntityType,
} from "@/services/entity-graph-types";
import {
  computeGravity,
  findAllPaths,
  detectTensions,
  detectClusters,
  analyzeRemoval,
  type GravityResult,
  type NarrativePath,
  type Tension,
  type ClusterResult,
  type WhatIfResult,
} from "./graph-algorithms";

// ---------------------------------------------------------------------------
// Analysis modes
// ---------------------------------------------------------------------------

export type AnalysisMode =
  | "gravity"
  | "paths"
  | "tensions"
  | "clusters"
  | "whatif"
  | null;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnalysisPanelProps {
  mode: AnalysisMode;
  onClose: () => void;
  entities: Entity[];
  connections: EntityConnection[];
  selectedEntityIds: string[];
  onSelectEntity: (entityId: string) => void;
  onHighlightEntities: (entityIds: string[]) => void;
  onHighlightConnections: (connectionIds: string[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalysisPanel({
  mode,
  onClose,
  entities,
  connections,
  selectedEntityIds,
  onSelectEntity,
  onHighlightEntities,
  onHighlightConnections,
}: AnalysisPanelProps) {
  if (!mode) return null;

  const title: Record<NonNullable<AnalysisMode>, string> = {
    gravity: "Gravity Analysis",
    paths: "Narrative Distance",
    tensions: "Tension Detection",
    clusters: "Cluster Discovery",
    whatif: "What-If Removal",
  };

  const Icon: Record<NonNullable<AnalysisMode>, typeof Gauge> = {
    gravity: Gauge,
    paths: Waypoints,
    tensions: AlertTriangle,
    clusters: Boxes,
    whatif: Trash2,
  };

  const ActiveIcon = Icon[mode];

  return (
    <div
      className="absolute top-0 right-0 z-20 h-full w-[320px] overflow-y-auto"
      style={{
        background: "rgba(15,15,16,0.95)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        animation: "slideInRight 300ms ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sf-border">
        <div className="flex items-center gap-2">
          <ActiveIcon className="w-3.5 h-3.5 text-teal" />
          <h3 className="font-heading text-[12px] uppercase tracking-[2px] text-teal">
            {title[mode]}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-t4 hover:text-t2 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {mode === "gravity" && (
          <GravityContent
            entities={entities}
            connections={connections}
            onSelectEntity={onSelectEntity}
          />
        )}
        {mode === "paths" && (
          <PathsContent
            entities={entities}
            connections={connections}
            selectedEntityIds={selectedEntityIds}
            onSelectEntity={onSelectEntity}
            onHighlightEntities={onHighlightEntities}
            onHighlightConnections={onHighlightConnections}
          />
        )}
        {mode === "tensions" && (
          <TensionsContent
            entities={entities}
            connections={connections}
            onHighlightEntities={onHighlightEntities}
            onHighlightConnections={onHighlightConnections}
          />
        )}
        {mode === "clusters" && (
          <ClustersContent
            entities={entities}
            connections={connections}
            onHighlightEntities={onHighlightEntities}
          />
        )}
        {mode === "whatif" && (
          <WhatIfContent
            entities={entities}
            connections={connections}
            selectedEntityIds={selectedEntityIds}
            onSelectEntity={onSelectEntity}
            onHighlightEntities={onHighlightEntities}
          />
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gravity Analysis (section 7.3)
// ---------------------------------------------------------------------------

function GravityContent({
  entities,
  connections,
  onSelectEntity,
}: {
  entities: Entity[];
  connections: EntityConnection[];
  onSelectEntity: (id: string) => void;
}) {
  const results = useMemo(
    () => computeGravity(entities, connections),
    [entities, connections]
  );

  const orphanCount = results.filter((r) => r.isOrphan).length;

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-t3 font-sans leading-relaxed">
        Node size and glow scale with weighted connection count. Orphans are
        entities with zero connections.
      </p>

      {orphanCount > 0 && (
        <div
          className="px-3 py-2 text-[12px] font-sans"
          style={{
            background: "rgba(255,184,0,0.06)",
            border: "1px solid rgba(255,184,0,0.15)",
          }}
        >
          <span className="text-sf-amber font-medium">{orphanCount} orphan{orphanCount !== 1 ? "s" : ""}</span>
          <span className="text-t4"> (unconnected entities)</span>
        </div>
      )}

      <div className="space-y-0.5">
        {results.map((r, i) => {
          const color = (ENTITY_TYPE_COLORS as Record<string, string>)[r.entityType] ?? "#15C17B";
          return (
            <button
              key={r.entityId}
              type="button"
              onClick={() => onSelectEntity(r.entityId)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.03] transition-colors text-left"
            >
              <span className="text-[12px] font-mono text-t5 w-4 text-right">
                {i + 1}.
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[12px] font-sans text-t2 flex-1 truncate">
                {r.name}
              </span>
              <span className="text-[12px] font-mono text-t4">
                {r.weightedConnections}
              </span>
              {r.isOrphan && (
                <span className="text-[12px] text-sf-amber uppercase tracking-[0.5px]">
                  orphan
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Narrative Distance / Story Paths (sections 7.1 & 8.2)
// ---------------------------------------------------------------------------

function PathsContent({
  entities,
  connections,
  selectedEntityIds,
  onSelectEntity,
  onHighlightEntities,
  onHighlightConnections,
}: {
  entities: Entity[];
  connections: EntityConnection[];
  selectedEntityIds: string[];
  onSelectEntity: (id: string) => void;
  onHighlightEntities: (ids: string[]) => void;
  onHighlightConnections: (ids: string[]) => void;
}) {
  const [expandedPath, setExpandedPath] = useState<number | null>(null);

  const sourceId = selectedEntityIds[0] ?? null;
  const targetId = selectedEntityIds[1] ?? null;

  const paths = useMemo(() => {
    if (!sourceId || !targetId) return [];
    return findAllPaths(entities, connections, sourceId, targetId);
  }, [entities, connections, sourceId, targetId]);

  const sourceName = entities.find((e) => e.id === sourceId)?.name;
  const targetName = entities.find((e) => e.id === targetId)?.name;

  const handlePathClick = useCallback(
    (path: NarrativePath, index: number) => {
      setExpandedPath(expandedPath === index ? null : index);
      onHighlightEntities(path.steps.map((s) => s.entityId));
      onHighlightConnections(
        path.steps.filter((s) => s.connectionId).map((s) => s.connectionId!)
      );
    },
    [expandedPath, onHighlightEntities, onHighlightConnections]
  );

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-t3 font-sans leading-relaxed">
        Click two entities in the graph to find all paths between them.
        Each path is a potential narrative thread.
      </p>

      {/* Selection indicators */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-teal" />
          <span className="text-[12px] font-sans text-t3">Source:</span>
          <span className="text-[12px] font-mono text-t1">
            {sourceName ?? "Click a node..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-sf-amber" />
          <span className="text-[12px] font-sans text-t3">Target:</span>
          <span className="text-[12px] font-mono text-t1">
            {targetName ?? "Click a second node..."}
          </span>
        </div>
      </div>

      {/* Paths */}
      {paths.length === 0 && sourceId && targetId && (
        <p className="text-[12px] text-t4 font-sans italic">
          No paths found between these entities.
        </p>
      )}

      {paths.map((path, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handlePathClick(path, i)}
          className="w-full text-left px-3 py-2 space-y-1 hover:bg-white/[0.03] transition-colors border border-sf-border"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-sans text-t2">
              Path {i + 1}
            </span>
            <span className="text-[12px] font-mono text-t4">
              {path.hopCount} hop{path.hopCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Cascade stages crossed */}
          <div className="flex gap-1">
            {path.cascadeStagesCrossed.map((s) => (
              <span
                key={s}
                className="text-[12px] uppercase tracking-[0.5px] px-1 py-0.5"
                style={{
                  color: CASCADE_STAGE_COLORS[s as CascadeStage] ?? "#FFB800",
                  background: `${CASCADE_STAGE_COLORS[s as CascadeStage] ?? "#FFB800"}10`,
                  border: `1px solid ${CASCADE_STAGE_COLORS[s as CascadeStage] ?? "#FFB800"}20`,
                }}
              >
                {s.slice(0, 4)}
              </span>
            ))}
          </div>

          {/* Story seed */}
          <p className="text-[12px] text-t4 font-sans italic leading-snug">
            {path.storySeed}
          </p>

          {/* Expanded: full path steps */}
          {expandedPath === i && (
            <div className="mt-1 space-y-0.5 pl-2 border-l border-teal/20">
              {path.steps.map((step, j) => (
                <div key={j} className="flex items-center gap-1">
                  {j > 0 && (
                    <span className="text-[12px] text-t5 mr-1">
                      [{step.relationshipLabel}]
                    </span>
                  )}
                  <span className="text-[12px] font-mono text-t2">
                    {step.entityName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tension Detection (section 7.2)
// ---------------------------------------------------------------------------

function TensionsContent({
  entities,
  connections,
  onHighlightEntities,
  onHighlightConnections,
}: {
  entities: Entity[];
  connections: EntityConnection[];
  onHighlightEntities: (ids: string[]) => void;
  onHighlightConnections: (ids: string[]) => void;
}) {
  const tensions = useMemo(
    () => detectTensions(entities, connections),
    [entities, connections]
  );

  const typeColors: Record<string, string> = {
    triangle_conflict: "#FFB800",
    cascade_contradiction: "#FF00AA",
    orphaned_downstream: "#4D9FFF",
    power_paradox: "#FF3366",
    severed_legacy: "#9B5DE5",
  };

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-t3 font-sans leading-relaxed">
        Structural contradictions that represent story opportunities. These are
        not errors to fix; they are where drama lives.
      </p>

      {tensions.length === 0 && (
        <p className="text-[12px] text-t4 font-sans italic">
          No tensions detected. Add more connections to reveal structural
          contradictions.
        </p>
      )}

      {tensions.map((t, i) => {
        const color = typeColors[t.type] ?? "#FFB800";
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              onHighlightEntities(t.entityIds);
              onHighlightConnections(t.connectionIds);
            }}
            className="w-full text-left px-3 py-2 space-y-1 hover:bg-white/[0.03] transition-colors"
            style={{
              border: `1px solid ${color}20`,
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" style={{ color }} />
              <span className="text-[12px] font-sans font-medium" style={{ color }}>
                {t.title}
              </span>
            </div>
            <p className="text-[12px] text-t3 font-sans leading-snug">
              {t.description}
            </p>
            <span
              className="inline-block text-[12px] uppercase tracking-[0.5px] px-1.5 py-0.5"
              style={{
                color,
                background: `${color}08`,
                border: `1px solid ${color}15`,
              }}
            >
              {t.type.replace(/_/g, " ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cluster Discovery (section 7.4)
// ---------------------------------------------------------------------------

function ClustersContent({
  entities,
  connections,
  onHighlightEntities,
}: {
  entities: Entity[];
  connections: EntityConnection[];
  onHighlightEntities: (ids: string[]) => void;
}) {
  const result = useMemo(
    () => detectClusters(entities, connections),
    [entities, connections]
  );

  const entityMap = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities]
  );

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-t3 font-sans leading-relaxed">
        Naturally emerging groups of tightly connected entities. Clusters often
        correspond to storylines.
      </p>

      {result.clusters.length === 0 && (
        <p className="text-[12px] text-t4 font-sans italic">
          No clusters detected. Add more connections between entities.
        </p>
      )}

      {result.clusters.map((cluster) => (
        <button
          key={cluster.id}
          type="button"
          onClick={() => onHighlightEntities(cluster.entityIds)}
          className="w-full text-left px-3 py-2 space-y-1 hover:bg-white/[0.03] transition-colors border border-sf-border"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-heading uppercase tracking-[1.5px] text-t1">
              {cluster.label}
            </span>
            <span className="text-[12px] font-mono text-t4">
              {cluster.entityIds.length} entities
            </span>
          </div>

          {/* Entity names */}
          <p className="text-[12px] text-t3 font-sans leading-snug">
            {cluster.entityIds
              .slice(0, 6)
              .map((id) => entityMap.get(id)?.name ?? "?")
              .join(", ")}
            {cluster.entityIds.length > 6 && ` +${cluster.entityIds.length - 6} more`}
          </p>

          <div className="flex gap-3 text-[12px] text-t4 font-mono">
            <span>Density: {cluster.internalDensity}</span>
            <span>External: {cluster.externalConnections}</span>
          </div>
        </button>
      ))}

      {/* Bridge entities */}
      {result.bridgeEntities.length > 0 && (
        <div className="mt-2">
          <h4 className="text-[12px] font-heading uppercase tracking-[2px] text-sf-amber mb-1.5">
            Bridge Entities
          </h4>
          <p className="text-[12px] text-t4 font-sans mb-1">
            These entities link multiple clusters: natural protagonist candidates.
          </p>
          {result.bridgeEntities.map((b) => (
            <div key={b.entityId} className="flex items-center gap-2 px-2 py-1">
              <Waypoints className="w-3 h-3 text-sf-amber" />
              <span className="text-[12px] font-sans text-t2">{b.name}</span>
              <span className="text-[12px] text-t5 font-mono">
                {b.clusterIds.length} clusters
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// What-If Removal (section 8.1)
// ---------------------------------------------------------------------------

function WhatIfContent({
  entities,
  connections,
  selectedEntityIds,
  onSelectEntity,
  onHighlightEntities,
}: {
  entities: Entity[];
  connections: EntityConnection[];
  selectedEntityIds: string[];
  onSelectEntity: (id: string) => void;
  onHighlightEntities: (ids: string[]) => void;
}) {
  const targetId = selectedEntityIds[0] ?? null;

  const result = useMemo<WhatIfResult | null>(() => {
    if (!targetId) return null;
    return analyzeRemoval(entities, connections, targetId);
  }, [entities, connections, targetId]);

  const impactColors = {
    low: "#00FF88",
    medium: "#FFB800",
    high: "#FF3366",
  };

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-t3 font-sans leading-relaxed">
        Right-click an entity or select one to see what happens if it didn't exist.
      </p>

      {!result && (
        <p className="text-[12px] text-t4 font-sans italic">
          Select an entity to analyze...
        </p>
      )}

      {result && (
        <>
          {/* Header */}
          <div
            className="px-3 py-2"
            style={{
              border: `1px solid ${impactColors[result.structuralImpact]}20`,
              background: `${impactColors[result.structuralImpact]}06`,
            }}
          >
            <div className="text-[12px] font-heading uppercase tracking-[1.5px] text-t1">
              What if "{result.removedEntityName}" were removed?
            </div>
            <div className="flex gap-3 mt-1 text-[12px] font-mono">
              <span style={{ color: impactColors[result.structuralImpact] }}>
                {result.structuralImpact.toUpperCase()} IMPACT
              </span>
            </div>
          </div>

          {/* Severed connections */}
          <div>
            <h4 className="text-[12px] font-heading uppercase tracking-[2px] text-t4 mb-1">
              Severed Connections: {result.severedConnections.length}
            </h4>
            <div className="space-y-0.5">
              {result.severedConnections.map((s) => (
                <div
                  key={s.connectionId}
                  className="flex items-center gap-2 px-2 py-1 text-[12px]"
                >
                  <span className="text-t5">&times;</span>
                  <span className="text-t3 font-sans">{s.otherEntityName}</span>
                  <span className="text-t5 font-sans italic">
                    ({s.relationshipType.replace(/_/g, " ")})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Newly orphaned */}
          {result.newlyOrphanedEntities.length > 0 && (
            <div>
              <h4 className="text-[12px] font-heading uppercase tracking-[2px] text-sf-amber mb-1">
                Newly Orphaned: {result.newlyOrphanedEntities.length}
              </h4>
              {result.newlyOrphanedEntities.map((o) => (
                <div
                  key={o.entityId}
                  className="flex items-center gap-2 px-2 py-1 text-[12px]"
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-sf-amber" />
                  <span className="text-t2 font-sans">{o.entityName}</span>
                </div>
              ))}
            </div>
          )}

          {/* Cascade breaks */}
          {result.cascadeBreaks.length > 0 && (
            <div>
              <h4 className="text-[12px] font-heading uppercase tracking-[2px] text-crimson mb-1">
                Cascade Breaks: {result.cascadeBreaks.length}
              </h4>
              {result.cascadeBreaks.map((cb, i) => (
                <div
                  key={i}
                  className="px-2 py-1 text-[12px] text-t3 font-sans"
                >
                  {cb.description}
                </div>
              ))}
            </div>
          )}

          {/* Action hint */}
          <p className="text-[12px] text-t5 font-sans italic">
            {result.structuralImpact === "high"
              ? `"${result.removedEntityName}" is a load-bearing entity. Removing it disconnects ${result.newlyOrphanedEntities.length} entities and breaks ${result.cascadeBreaks.length} cascade chains.`
              : result.structuralImpact === "low"
                ? `"${result.removedEntityName}" has minimal structural impact. It may not deserve narrative real estate.`
                : `"${result.removedEntityName}" has moderate structural importance.`}
          </p>
        </>
      )}
    </div>
  );
}
