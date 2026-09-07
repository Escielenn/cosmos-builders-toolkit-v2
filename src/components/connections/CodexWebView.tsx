// ---------------------------------------------------------------------------
// CodexWebView — the Codex's Web view (Brief F3, 13-THE-LIFT.md §1).
//
// One graph. It absorbed `/graph` (Knowledge Graph) and `/connections`
// (Mind Map / Worksheet Graph / Outline), which were three views of two
// graphs on two routes. Nodes are entities; edges are typed relations; a
// click lands on the entity's Codex page, which is the one URL for that
// thing.
//
// Law VII: this view replaces two routes and three modes. It adds none.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import WorldConnectionsGraph, {
  type WebEdge,
  type WebNode,
} from "./WorldConnectionsGraph";
import ConnectionLegend from "./ConnectionLegend";
import { TimelineScrubber } from "./TimelineScrubber";
import { WebGraphToolbar, ALL_FILTER } from "./WebGraphToolbar";
import { CreateEntityModal, type CreateEntityFormData } from "./CreateEntityModal";
import {
  extractTimelineBounds,
  filterConnectionsByTime,
} from "./web-graph-time";
import {
  useCreateEntity,
  useEntities,
  useEntityConnections,
  useUpdateEntity,
} from "@/hooks/use-entity-graph";
import {
  CASCADE_STAGES,
  type CascadeStage,
  type EntityType,
} from "@/services/entity-graph-types";

interface CodexWebViewProps {
  worldId: string;
  /** Deep link: selects and centres attention on one entity (`?focus=`). */
  focusEntityId?: string | null;
  /** Deep link: opens the create dialog on mount (`?create=true`). */
  openCreate?: boolean;
}

export function CodexWebView({
  worldId,
  focusEntityId = null,
  openCreate = false,
}: CodexWebViewProps) {
  const navigate = useNavigate();
  const { data: entities, isLoading: entitiesLoading } = useEntities(worldId);
  const { data: connections, isLoading: connectionsLoading } =
    useEntityConnections(worldId);

  const createEntity = useCreateEntity(worldId);
  const updateEntity = useUpdateEntity(worldId);

  const [activeStages, setActiveStages] = useState<Set<CascadeStage>>(
    () => new Set(CASCADE_STAGES)
  );
  const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER);
  const [edgeFilter, setEdgeFilter] = useState<string>(ALL_FILTER);
  const [highlightId, setHighlightId] = useState<string | null>(focusEntityId);
  const [selectedId, setSelectedId] = useState<string | null>(focusEntityId);
  const [epochOpen, setEpochOpen] = useState(false);
  const [epochIndex, setEpochIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(openCreate);

  useEffect(() => {
    if (focusEntityId) {
      setHighlightId(focusEntityId);
      setSelectedId(focusEntityId);
    }
  }, [focusEntityId]);

  const allEntities = useMemo(() => entities ?? [], [entities]);
  const allConnections = useMemo(() => connections ?? [], [connections]);

  const availableTypes = useMemo(() => {
    const seen = new Set<EntityType>();
    for (const e of allEntities) seen.add(e.entity_type);
    return Array.from(seen).sort();
  }, [allEntities]);

  const availableEdgeTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const c of allConnections) seen.add(c.relationship_type);
    return Array.from(seen).sort();
  }, [allConnections]);

  const { timePoints, events } = useMemo(
    () => extractTimelineBounds(allEntities, allConnections),
    [allEntities, allConnections]
  );

  // Clamp the scrubber when the data behind it changes.
  useEffect(() => {
    if (epochIndex > Math.max(0, timePoints.length - 1)) setEpochIndex(0);
  }, [timePoints.length, epochIndex]);

  const { nodes, edges, stageCounts } = useMemo(() => {
    const visibleEntities = allEntities.filter(
      (e) =>
        activeStages.has(e.cascade_stage) &&
        (typeFilter === ALL_FILTER || e.entity_type === typeFilter)
    );
    const visibleIds = new Set(visibleEntities.map((e) => e.id));

    const epoch = epochOpen
      ? filterConnectionsByTime(allConnections, timePoints, epochIndex)
      : null;

    const visibleEdges: WebEdge[] = [];
    for (const c of allConnections) {
      if (!visibleIds.has(c.source_entity_id)) continue;
      if (!visibleIds.has(c.target_entity_id)) continue;
      if (edgeFilter !== ALL_FILTER && c.relationship_type !== edgeFilter) continue;
      // Outside the epoch entirely: not started yet.
      if (epoch && !epoch.visible.has(c.id) && !epoch.historical.has(c.id)) continue;

      visibleEdges.push({
        id: c.id,
        source: c.source_entity_id,
        target: c.target_entity_id,
        relationshipType: c.relationship_type,
        relationshipLabel: c.relationship_label,
        cascadeStage: c.cascade_stage,
        bidirectional: c.bidirectional,
        historical: epoch ? epoch.historical.has(c.id) : c.status === "historical",
      });
    }

    const counts: Record<string, number> = {};
    for (const stage of CASCADE_STAGES) counts[stage] = 0;
    for (const e of visibleEntities) counts[e.cascade_stage] += 1;

    const webNodes: WebNode[] = visibleEntities.map((e) => ({
      id: e.id,
      name: e.name,
      entityType: e.entity_type,
      cascadeStage: e.cascade_stage,
      color: e.color,
      summary: e.summary,
      typeLabel: e.custom_type_label,
      x: e.graph_x,
      y: e.graph_y,
      pinned: e.pinned,
    }));

    return { nodes: webNodes, edges: visibleEdges, stageCounts: counts };
  }, [
    allEntities,
    allConnections,
    activeStages,
    typeFilter,
    edgeFilter,
    epochOpen,
    epochIndex,
    timePoints,
  ]);

  // Brief F3 item 4: a node click lands on that entity's Codex page.
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      navigate(`/worlds/${worldId}/codex/${nodeId}`);
    },
    [navigate, worldId]
  );

  // Dragging a node pins it there. Debounced so a drag is one write.
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNodeMoved = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => {
        updateEntity.mutate({ id: nodeId, graph_x: x, graph_y: y, pinned: true });
      }, 400);
    },
    [updateEntity]
  );

  useEffect(
    () => () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
    },
    []
  );

  const handleCreateEntity = useCallback(
    (form: CreateEntityFormData) => {
      createEntity.mutate({
        name: form.name,
        entity_type: form.entity_type,
        custom_type_label: form.custom_type_label,
        cascade_stage: form.cascade_stage,
        summary: form.summary,
      });
      setShowCreate(false);
    },
    [createEntity]
  );

  const isLoading = entitiesLoading || connectionsLoading;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="xl:col-span-3">
        <WebGraphToolbar
          entities={allEntities}
          activeStages={activeStages}
          onStagesChange={setActiveStages}
          availableTypes={availableTypes}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          availableEdgeTypes={availableEdgeTypes}
          edgeFilter={edgeFilter}
          onEdgeFilterChange={setEdgeFilter}
          onHighlight={setHighlightId}
          onFocusEntity={(id) => {
            setHighlightId(id);
            setSelectedId(id);
          }}
          epochOpen={epochOpen}
          onToggleEpoch={() => setEpochOpen((v) => !v)}
          onCreateEntity={() => setShowCreate(true)}
        />

        <div className="relative min-h-[600px] border border-sf-line bg-sf-surface p-2">
          {isLoading ? (
            <div className="flex h-[600px] items-center justify-center">
              <Loader size="sm" />
            </div>
          ) : (
            <>
              {nodes.length > 0 && edges.length === 0 && (
                <p className="mb-2 border border-sf-line-interactive bg-sf-surface-elevated px-3 py-2 text-[13px] text-t2">
                  {nodes.length} {nodes.length === 1 ? "entity" : "entities"} on
                  file, none related yet. Add a relation from an entity's Codex
                  page and the line appears here.
                </p>
              )}
              <WorldConnectionsGraph
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                onNodeMoved={handleNodeMoved}
                selectedNodeId={selectedId}
                highlightNodeId={highlightId}
                width={900}
                height={600}
                emptyMessage={
                  allEntities.length === 0
                    ? "NO ENTITIES ON FILE. CREATE ONE TO BEGIN."
                    : "NO ENTITIES MATCH THESE FILTERS."
                }
              />
              {epochOpen && (
                <TimelineScrubber
                  timePoints={timePoints}
                  events={events}
                  currentIndex={epochIndex}
                  onChange={(i) =>
                    setEpochIndex(Math.max(0, Math.min(timePoints.length - 1, i)))
                  }
                  onClose={() => setEpochOpen(false)}
                />
              )}
            </>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <ConnectionLegend counts={stageCounts} />
      </aside>

      <CreateEntityModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateEntity}
        worldId={worldId}
      />
    </div>
  );
}

export default CodexWebView;
