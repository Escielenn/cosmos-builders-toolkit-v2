// ---------------------------------------------------------------------------
// WorldEntityGraph — Main graph canvas for the entity layer.
// Phase 1: Nodes, edges, force layout, pinning, connection creation.
// Phase 2: Cascade filter, search, list view, cascade flow layout,
//          cascade path highlighting.
// Phase 3: Analytical tools — gravity, paths, tensions, clusters, what-if.
// ---------------------------------------------------------------------------

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { Plus, LayoutGrid, Zap, List, Network, Columns3, Route, Gauge, Waypoints, AlertTriangle, Boxes, Trash2, ScanSearch, Clock, Download, Undo2, Redo2, TreePine, Pin, PinOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

import EntityNode, { type EntityNodeData } from "./EntityNode";
import CascadeEdge, { type CascadeEdgeData } from "./CascadeEdge";
import { ConnectionModal, type ConnectionFormData } from "./ConnectionModal";
import { CreateEntityModal, type CreateEntityFormData } from "./CreateEntityModal";
import { CascadeFilterBar } from "./CascadeFilterBar";
import { GraphSearch } from "./GraphSearch";
import { EntityListView } from "./EntityListView";
import { EntityTreeView } from "./EntityTreeView";
import { cascadeFlowLayout, traceCascadePath, type CascadePath } from "./graph-algorithms";
import { AnalysisPanel, type AnalysisMode } from "./AnalysisPanel";
import { CascadeAuditPanel } from "./CascadeAuditPanel";
import { TimelineScrubber } from "./TimelineScrubber";
import { GraphOnboarding } from "./GraphOnboarding";
import { useGraphHistory } from "./useGraphHistory";
import { exportGraphAsPNG, exportGraphAsJSON } from "./graph-export";
import { extractTimelineBounds, filterConnectionsByTime } from "./graph-algorithms";

import {
  useEntities,
  useEntityConnections,
  useCreateEntity,
  useDeleteEntity,
  useUpdateEntity,
  useCreateEntityConnection,
  useDeleteEntityConnection,
  useBatchUpdatePositions,
} from "@/hooks/use-entity-graph";

import {
  CASCADE_STAGES,
  CASCADE_STAGE_COLORS,
  ENTITY_TYPE_COLORS,
  type Entity,
  type EntityConnection,
  type CascadeStage,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Custom node/edge types
// ---------------------------------------------------------------------------

const nodeTypes = { entityNode: EntityNode };
const edgeTypes = { cascadeEdge: CascadeEdge };

// ---------------------------------------------------------------------------
// Force simulation types
// ---------------------------------------------------------------------------

interface SimNode extends SimulationNodeDatum {
  id: string;
  cascadeStage: CascadeStage;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  strength: number;
}

// ---------------------------------------------------------------------------
// Build React Flow nodes/edges from data
// ---------------------------------------------------------------------------

function buildNodes(
  entities: Entity[],
  connectionCounts: Map<string, number>,
  activeStages: Set<CascadeStage>,
  highlightedEntityId: string | null,
  cascadePath: CascadePath | null,
  analysisHighlightedEntities: string[]
): Node[] {
  const allActive = activeStages.size === CASCADE_STAGES.length;
  const hasCascadePath = cascadePath && cascadePath.entityIds.size > 0;
  const hasAnalysisHighlight = analysisHighlightedEntities.length > 0;
  const analysisSet = hasAnalysisHighlight ? new Set(analysisHighlightedEntities) : null;

  return entities.map((e) => {
    // Opacity logic
    let opacity = 1;
    if (hasAnalysisHighlight) {
      opacity = analysisSet!.has(e.id) ? 1 : 0.12;
    } else if (hasCascadePath) {
      opacity = cascadePath.entityIds.has(e.id) ? 1 : 0.1;
    } else if (!allActive) {
      const hasActiveConnections = activeStages.has(e.cascade_stage);
      opacity = hasActiveConnections ? 1 : 0.15;
    }
    if (highlightedEntityId && highlightedEntityId !== e.id) {
      opacity = Math.min(opacity, 0.4);
    }

    return {
      id: e.id,
      type: "entityNode",
      position: {
        x: e.graph_x ?? 0,
        y: e.graph_y ?? 0,
      },
      style: { opacity, transition: "opacity 200ms ease" },
      data: {
        entityId: e.id,
        label: e.name,
        entityType: e.entity_type,
        cascadeStage: e.cascade_stage,
        color: e.color,
        summary: e.summary,
        pinned: e.pinned,
        connectionCount: connectionCounts.get(e.id) ?? 0,
      } satisfies EntityNodeData,
    };
  });
}

function buildEdges(
  connections: EntityConnection[],
  activeStages: Set<CascadeStage>,
  cascadePath: CascadePath | null,
  analysisHighlightedConnections: string[],
  timelineFilter?: { visible: Set<string>; historical: Set<string> }
): Edge[] {
  const allActive = activeStages.size === CASCADE_STAGES.length;
  const hasCascadePath = cascadePath && cascadePath.entityIds.size > 0;
  const hasAnalysisHighlight = analysisHighlightedConnections.length > 0;
  const analysisSet = hasAnalysisHighlight ? new Set(analysisHighlightedConnections) : null;

  return connections.map((c) => {
    // Timeline filtering: hide edges not in the visible or historical sets
    if (timelineFilter) {
      const isVisible = timelineFilter.visible.has(c.id);
      const isHistorical = timelineFilter.historical.has(c.id);
      if (!isVisible && !isHistorical) {
        return {
          id: c.id,
          source: c.source_entity_id,
          target: c.target_entity_id,
          type: "cascadeEdge",
          hidden: true,
          style: { opacity: 0, transition: "opacity 200ms ease" },
          data: {
            connectionId: c.id,
            relationshipType: c.relationship_type,
            relationshipLabel: c.relationship_label,
            cascadeStage: c.cascade_stage,
            bidirectional: c.bidirectional,
            strength: c.strength,
            status: c.status,
          } satisfies CascadeEdgeData,
          markerEnd: c.bidirectional
            ? undefined
            : { type: MarkerType.ArrowClosed, width: 10, height: 10 },
        };
      }

      // Historical edges get dashed style and reduced opacity
      if (isHistorical) {
        let opacity = 0.35;
        // Still apply cascade/analysis dimming
        if (hasAnalysisHighlight) {
          opacity = analysisSet!.has(c.id) ? 0.35 : 0.05;
        } else if (hasCascadePath) {
          opacity = cascadePath.connectionIds.has(c.id) ? 0.35 : 0.05;
        } else if (!allActive) {
          const stage = c.cascade_stage as CascadeStage;
          opacity = activeStages.has(stage) ? 0.35 : 0.05;
        }

        return {
          id: c.id,
          source: c.source_entity_id,
          target: c.target_entity_id,
          type: "cascadeEdge",
          style: { opacity, strokeDasharray: "6 3", transition: "opacity 200ms ease" },
          data: {
            connectionId: c.id,
            relationshipType: c.relationship_type,
            relationshipLabel: c.relationship_label,
            cascadeStage: c.cascade_stage,
            bidirectional: c.bidirectional,
            strength: c.strength,
            status: c.status,
          } satisfies CascadeEdgeData,
          markerEnd: c.bidirectional
            ? undefined
            : { type: MarkerType.ArrowClosed, width: 10, height: 10 },
        };
      }
    }

    let opacity = 1;
    if (hasAnalysisHighlight) {
      opacity = analysisSet!.has(c.id) ? 1 : 0.05;
    } else if (hasCascadePath) {
      opacity = cascadePath.connectionIds.has(c.id) ? 1 : 0.05;
    } else if (!allActive) {
      const stage = c.cascade_stage as CascadeStage;
      opacity = activeStages.has(stage) ? 1 : 0.05;
    }

    return {
      id: c.id,
      source: c.source_entity_id,
      target: c.target_entity_id,
      type: "cascadeEdge",
      style: { opacity, transition: "opacity 200ms ease" },
      data: {
        connectionId: c.id,
        relationshipType: c.relationship_type,
        relationshipLabel: c.relationship_label,
        cascadeStage: c.cascade_stage,
        bidirectional: c.bidirectional,
        strength: c.strength,
        status: c.status,
      } satisfies CascadeEdgeData,
      markerEnd: c.bidirectional
        ? undefined
        : { type: MarkerType.ArrowClosed, width: 10, height: 10 },
    };
  });
}

// ---------------------------------------------------------------------------
// Cascade gravity bands (spec section 4.5)
// ---------------------------------------------------------------------------

const STAGE_BANDS: Record<CascadeStage, number> = {
  physics: 0.1,
  environment: 0.25,
  biology: 0.4,
  psychology: 0.55,
  mythology: 0.7,
  culture: 0.85,
};

// ---------------------------------------------------------------------------
// Run d3-force layout on unpinned nodes
// ---------------------------------------------------------------------------

function runForceLayout(
  entities: Entity[],
  connections: EntityConnection[],
  canvasWidth: number,
  canvasHeight: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  const simNodes: SimNode[] = entities.map((e) => ({
    id: e.id,
    cascadeStage: e.cascade_stage,
    x: e.graph_x ?? STAGE_BANDS[e.cascade_stage] * canvasWidth + (Math.random() - 0.5) * 100,
    y: e.graph_y ?? canvasHeight / 2 + (Math.random() - 0.5) * 200,
    fx: e.pinned && e.graph_x != null ? e.graph_x : undefined,
    fy: e.pinned && e.graph_y != null ? e.graph_y : undefined,
  }));

  const nodeById = new Map(simNodes.map((n) => [n.id, n]));

  const simLinks: SimLink[] = connections
    .filter((c) => nodeById.has(c.source_entity_id) && nodeById.has(c.target_entity_id))
    .map((c) => ({
      source: c.source_entity_id,
      target: c.target_entity_id,
      strength: c.strength,
    }));

  const simulation = forceSimulation<SimNode>(simNodes)
    .force("charge", forceManyBody<SimNode>().strength(-300))
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((d) => 200 - d.strength * 15)
    )
    .force("center", forceCenter(canvasWidth / 2, canvasHeight / 2))
    .force("collision", forceCollide<SimNode>().radius(100))
    .force(
      "cascade",
      forceX<SimNode>((d) => STAGE_BANDS[d.cascadeStage] * canvasWidth).strength(0.05)
    )
    .alphaDecay(0.02)
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  simNodes.forEach((n) => {
    positions.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
  });

  return positions;
}

// ---------------------------------------------------------------------------
// Connection count helper
// ---------------------------------------------------------------------------

function countConnections(connections: EntityConnection[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of connections) {
    counts.set(c.source_entity_id, (counts.get(c.source_entity_id) ?? 0) + 1);
    counts.set(c.target_entity_id, (counts.get(c.target_entity_id) ?? 0) + 1);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// View modes
// ---------------------------------------------------------------------------

type ViewMode = "graph" | "list" | "tree";

// ---------------------------------------------------------------------------
// Inner graph (needs ReactFlowProvider to be above it)
// ---------------------------------------------------------------------------

interface InnerGraphProps {
  worldId: string;
  entities: Entity[];
  connections: EntityConnection[];
}

function InnerGraph({ worldId, entities, connections }: InnerGraphProps) {
  const reactFlow = useReactFlow();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const history = useGraphHistory();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // Cascade filter
  const [activeStages, setActiveStages] = useState<Set<CascadeStage>>(
    new Set(CASCADE_STAGES)
  );

  // Search highlight
  const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);

  // Analysis panel
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(null);
  const [analysisSelectedEntities, setAnalysisSelectedEntities] = useState<string[]>([]);
  const [analysisHighlightedEntities, setAnalysisHighlightedEntities] = useState<string[]>([]);
  const [analysisHighlightedConnections, setAnalysisHighlightedConnections] = useState<string[]>([]);

  // Cascade Audit (section 9)
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);

  // Timeline (section 8.3)
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const timelineBounds = useMemo(
    () => extractTimelineBounds(entities, connections),
    [entities, connections]
  );

  // Cascade path highlighting
  const [cascadePathEntityId, setCascadePathEntityId] = useState<string | null>(null);
  const cascadePath = useMemo<CascadePath | null>(() => {
    if (!cascadePathEntityId) return null;
    return traceCascadePath(entities, connections, cascadePathEntityId);
  }, [cascadePathEntityId, entities, connections]);

  // Context menu (right-click on node)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entityId: string;
  } | null>(null);

  // Modals
  const [showCreateEntity, setShowCreateEntity] = useState(false);
  const [connectionModalState, setConnectionModalState] = useState<{
    open: boolean;
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
  }>({ open: false, sourceId: "", targetId: "", sourceName: "", targetName: "" });

  // Mutations
  const createEntity = useCreateEntity(worldId);
  const deleteEntity = useDeleteEntity(worldId);
  const updateEntity = useUpdateEntity(worldId);
  const createConnection = useCreateEntityConnection(worldId);
  const deleteConnection = useDeleteEntityConnection(worldId);
  const batchUpdatePositions = useBatchUpdatePositions(worldId);

  // Debounce ref for position saves
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPositionUpdates = useRef<
    Map<string, { id: string; graph_x: number; graph_y: number; pinned: boolean }>
  >(new Map());

  // Connection counts
  const connectionCounts = useMemo(() => countConnections(connections), [connections]);

  // Force layout — run once when entities have no positions
  const needsLayout = useMemo(
    () => entities.some((e) => e.graph_x == null && e.graph_y == null),
    [entities]
  );

  const layoutPositions = useMemo(() => {
    if (!needsLayout || entities.length === 0) return null;
    return runForceLayout(entities, connections, 1200, 800);
  }, [needsLayout, entities, connections]);

  // Build nodes with layout positions applied
  const entitiesWithPositions = useMemo(() => {
    if (!layoutPositions) return entities;
    return entities.map((e) => {
      if (e.graph_x != null && e.graph_y != null) return e;
      const pos = layoutPositions.get(e.id);
      if (!pos) return e;
      return { ...e, graph_x: pos.x, graph_y: pos.y };
    });
  }, [entities, layoutPositions]);

  const initialNodes = useMemo(
    () => buildNodes(entitiesWithPositions, connectionCounts, activeStages, highlightedEntityId, cascadePath, analysisHighlightedEntities),
    [entitiesWithPositions, connectionCounts, activeStages, highlightedEntityId, cascadePath, analysisHighlightedEntities]
  );
  // Compute timeline filter when scrubber is active
  const timelineFilter = useMemo(() => {
    if (!showTimeline || timelineBounds.timePoints.length === 0) return undefined;
    return filterConnectionsByTime(connections, timelineBounds.timePoints, timelineIndex);
  }, [showTimeline, timelineBounds.timePoints, connections, timelineIndex]);

  const initialEdges = useMemo(
    () => buildEdges(connections, activeStages, cascadePath, analysisHighlightedConnections, timelineFilter),
    [connections, activeStages, cascadePath, analysisHighlightedConnections, timelineFilter]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes/edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Debounced position persistence
  const flushPositions = useCallback(() => {
    const updates = Array.from(pendingPositionUpdates.current.values());
    if (updates.length > 0) {
      batchUpdatePositions.mutate(updates);
      pendingPositionUpdates.current.clear();
    }
  }, [batchUpdatePositions]);

  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      pendingPositionUpdates.current.set(node.id, {
        id: node.id,
        graph_x: node.position.x,
        graph_y: node.position.y,
        pinned: true,
      });

      if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
      positionSaveTimer.current = setTimeout(flushPositions, 2000);
    },
    [flushPositions]
  );

  // Connection creation flow
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const sourceEntity = entities.find((e) => e.id === connection.source);
      const targetEntity = entities.find((e) => e.id === connection.target);
      if (!sourceEntity || !targetEntity) return;

      setConnectionModalState({
        open: true,
        sourceId: connection.source,
        targetId: connection.target,
        sourceName: sourceEntity.name,
        targetName: targetEntity.name,
      });
    },
    [entities]
  );

  const handleCreateConnection = useCallback(
    (formData: ConnectionFormData) => {
      createConnection.mutate({
        source_entity_id: connectionModalState.sourceId,
        target_entity_id: connectionModalState.targetId,
        relationship_type: formData.relationship_type,
        relationship_label: formData.relationship_label || null,
        cascade_stage: formData.cascade_stage,
        bidirectional: formData.bidirectional,
        strength: formData.strength,
        status: formData.status,
        time_start: formData.time_start || null,
        time_end: formData.time_end || null,
        notes: formData.notes || null,
      });
    },
    [createConnection, connectionModalState]
  );

  const handleCreateEntity = useCallback(
    (formData: CreateEntityFormData) => {
      createEntity.mutate({
        name: formData.name,
        entity_type: formData.entity_type,
        custom_type_label: formData.custom_type_label,
        cascade_stage: formData.cascade_stage,
        summary: formData.summary,
      });
    },
    [createEntity]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
        return;
      }
      // Ctrl+Y / Cmd+Shift+Z = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        history.redo();
        return;
      }

      // Delete/Backspace = delete selected elements
      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedEdges = edges.filter((edge) => edge.selected);
        selectedEdges.forEach((edge) => deleteConnection.mutate(edge.id));

        const selectedNodes = nodes.filter((node) => node.selected);
        if (selectedNodes.length === 1) {
          const entity = entities.find((en) => en.id === selectedNodes[0].id);
          if (entity && window.confirm(`Delete entity "${entity.name}"?`)) {
            deleteEntity.mutate(entity.id);
          }
        }
      }

      // Escape clears analysis/audit/cascade path/context menu
      if (e.key === "Escape") {
        setContextMenu(null);
        setCascadePathEntityId(null);
        setHighlightedEntityId(null);
        setAuditEntityId(null);
        closeAnalysis();
      }
    },
    [edges, nodes, entities, deleteConnection, deleteEntity, history, closeAnalysis]
  );

  // Auto-layout button
  const handleAutoLayout = useCallback(() => {
    if (entities.length === 0) return;
    const positions = runForceLayout(
      entities.map((e) => ({ ...e, pinned: false, graph_x: null, graph_y: null })),
      connections,
      1200,
      800
    );

    setNodes((nds) =>
      nds.map((n) => {
        const pos = positions.get(n.id);
        return pos ? { ...n, position: { x: pos.x, y: pos.y } } : n;
      })
    );

    const updates = Array.from(positions.entries()).map(([id, pos]) => ({
      id,
      graph_x: pos.x,
      graph_y: pos.y,
      pinned: false,
    }));
    batchUpdatePositions.mutate(updates);

    setTimeout(() => reactFlow.fitView({ padding: 0.15 }), 100);
  }, [entities, connections, setNodes, batchUpdatePositions, reactFlow]);

  // Cascade flow layout (section 6.2)
  const handleCascadeFlowLayout = useCallback(() => {
    if (entities.length === 0) return;
    const positions = cascadeFlowLayout(entities, 1200, 800);

    setNodes((nds) =>
      nds.map((n) => {
        const pos = positions.get(n.id);
        return pos ? { ...n, position: { x: pos.x, y: pos.y } } : n;
      })
    );

    const updates = Array.from(positions.entries()).map(([id, pos]) => ({
      id,
      graph_x: pos.x,
      graph_y: pos.y,
      pinned: false,
    }));
    batchUpdatePositions.mutate(updates);

    setTimeout(() => reactFlow.fitView({ padding: 0.15 }), 100);
  }, [entities, setNodes, batchUpdatePositions, reactFlow]);

  // Search: focus on entity
  const handleFocusEntity = useCallback(
    (entityId: string) => {
      const node = nodes.find((n) => n.id === entityId);
      if (node) {
        reactFlow.setCenter(
          node.position.x + 80,
          node.position.y + 45,
          { zoom: 1.2, duration: 400 }
        );
      }
    },
    [nodes, reactFlow]
  );

  // Node click — feeds into analysis modes (paths, what-if)
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (analysisMode === "paths") {
        setAnalysisSelectedEntities((prev) => {
          if (prev.length === 0) return [node.id];
          if (prev.length === 1 && prev[0] !== node.id) return [prev[0], node.id];
          return [node.id]; // restart selection
        });
        // Clear connection highlights when selecting new entities
        setAnalysisHighlightedEntities([]);
        setAnalysisHighlightedConnections([]);
      } else if (analysisMode === "whatif") {
        setAnalysisSelectedEntities([node.id]);
      }
    },
    [analysisMode]
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, entityId: node.id });
    },
    []
  );

  // Close context menu on click anywhere
  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Context menu actions
  const handleContextCascadeAudit = useCallback(() => {
    if (!contextMenu) return;
    setAuditEntityId(contextMenu.entityId);
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextUnpin = useCallback(() => {
    if (!contextMenu) return;
    const entity = entities.find((e) => e.id === contextMenu.entityId);
    batchUpdatePositions.mutate([
      {
        id: contextMenu.entityId,
        graph_x: entity?.graph_x ?? 0,
        graph_y: entity?.graph_y ?? 0,
        pinned: false,
      },
    ]);
    setContextMenu(null);
  }, [contextMenu, batchUpdatePositions, entities]);

  const handleContextDelete = useCallback(() => {
    if (!contextMenu) return;
    const entity = entities.find((e) => e.id === contextMenu.entityId);
    if (entity && window.confirm(`Delete entity "${entity.name}"? This will also remove all its connections.`)) {
      deleteEntity.mutate(entity.id);
    }
    setContextMenu(null);
  }, [contextMenu, entities, deleteEntity]);

  // Toggle analysis mode
  const toggleAnalysis = useCallback((mode: AnalysisMode) => {
    setAnalysisMode((prev) => {
      if (prev === mode) {
        // Closing — clear all analysis state
        setAnalysisSelectedEntities([]);
        setAnalysisHighlightedEntities([]);
        setAnalysisHighlightedConnections([]);
        return null;
      }
      // Opening new mode — clear previous state
      setAnalysisSelectedEntities([]);
      setAnalysisHighlightedEntities([]);
      setAnalysisHighlightedConnections([]);
      return mode;
    });
  }, []);

  const closeAnalysis = useCallback(() => {
    setAnalysisMode(null);
    setAnalysisSelectedEntities([]);
    setAnalysisHighlightedEntities([]);
    setAnalysisHighlightedConnections([]);
  }, []);

  // List view: entity click scrolls to expanded
  const handleListEntityClick = useCallback(
    (entityId: string) => {
      // Switch to graph view and focus
      setViewMode("graph");
      setTimeout(() => handleFocusEntity(entityId), 100);
    },
    [handleFocusEntity]
  );

  // List view: create connection from entity
  const handleListCreateConnection = useCallback(
    (sourceId: string) => {
      const entity = entities.find((e) => e.id === sourceId);
      if (!entity) return;
      // Open modal with just source set, user picks target from graph
      setConnectionModalState({
        open: true,
        sourceId,
        targetId: "",
        sourceName: entity.name,
        targetName: "Select target...",
      });
    },
    [entities]
  );

  // Tree view: create child opens create modal (parent_entity_id set externally)
  const handleTreeCreateChild = useCallback(
    (parentId: string) => {
      // For now, just open the create entity modal.
      // The parent_entity_id will need to be set after creation.
      setShowCreateEntity(true);
    },
    []
  );

  // Tree view: delete entity with confirmation
  const handleTreeDeleteEntity = useCallback(
    (entityId: string) => {
      const entity = entities.find((e) => e.id === entityId);
      if (entity && window.confirm(`Delete entity "${entity.name}"?`)) {
        deleteEntity.mutate(entityId);
      }
    },
    [entities, deleteEntity]
  );

  // Tree view: reparent entity
  const handleTreeReparent = useCallback(
    (entityId: string, newParentId: string | null) => {
      updateEntity.mutate({ id: entityId, parent_entity_id: newParentId });
    },
    [updateEntity]
  );

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (entities.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: "#0A0E17" }}>
        <div className="text-center max-w-xs">
          <div className="flex justify-center gap-4 mb-4 text-tier-4">
            <span className="inline-block w-3 h-3 border border-tier-4/40" />
            <span className="inline-block w-3 h-3 border border-tier-4/40 mt-3" />
          </div>
          <h2 className="font-heading text-sm font-light uppercase tracking-[2px] text-tier-1 mb-2">
            Your World Graph
          </h2>
          <p className="text-[11px] font-sans text-tier-3 leading-relaxed mb-4">
            Create your first entity to begin mapping the connections between
            your world's elements.
          </p>
          <Button
            onClick={() => setShowCreateEntity(true)}
            className="text-xs font-sans"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Entity
          </Button>
          <p className="text-[9px] text-tier-5 mt-3">
            Start with a planet or star. The Environmental Cascade flows from
            physics through culture.
          </p>
        </div>

        <CreateEntityModal
          open={showCreateEntity}
          onClose={() => setShowCreateEntity(false)}
          onSubmit={handleCreateEntity}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tree view
  // ---------------------------------------------------------------------------

  if (viewMode === "tree") {
    return (
      <div className="relative h-full w-full">
        {/* Toolbar */}
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5"
          style={{
            background: "rgba(15,15,16,0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "6px 10px",
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateEntity(true)}
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          >
            <Plus className="w-3 h-3 mr-1" />
            Entity
          </Button>
          <div className="w-px h-4 bg-border/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode("graph")}
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          >
            <Network className="w-3 h-3 mr-1" />
            Graph
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-1 bg-white/5"
          >
            <TreePine className="w-3 h-3 mr-1" />
            Tree
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode("list")}
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          >
            <List className="w-3 h-3 mr-1" />
            List
          </Button>
        </div>

        <div className="pt-14 h-full">
          <EntityTreeView
            entities={entities}
            onCreateChild={handleTreeCreateChild}
            onDeleteEntity={handleTreeDeleteEntity}
            onReparent={handleTreeReparent}
            onFocusEntity={handleListEntityClick}
          />
        </div>

        <CreateEntityModal
          open={showCreateEntity}
          onClose={() => setShowCreateEntity(false)}
          onSubmit={handleCreateEntity}
        />

        <ConnectionModal
          open={connectionModalState.open}
          onClose={() => setConnectionModalState((s) => ({ ...s, open: false }))}
          onSubmit={handleCreateConnection}
          sourceName={connectionModalState.sourceName}
          targetName={connectionModalState.targetName}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // List view
  // ---------------------------------------------------------------------------

  if (viewMode === "list") {
    return (
      <div className="relative h-full w-full">
        {/* Toolbar */}
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5"
          style={{
            background: "rgba(15,15,16,0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "6px 10px",
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateEntity(true)}
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          >
            <Plus className="w-3 h-3 mr-1" />
            Entity
          </Button>
          <div className="w-px h-4 bg-border/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode("graph")}
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          >
            <Network className="w-3 h-3 mr-1" />
            Graph
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode("tree")}
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          >
            <TreePine className="w-3 h-3 mr-1" />
            Tree
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-1 bg-white/5"
          >
            <List className="w-3 h-3 mr-1" />
            List
          </Button>
        </div>

        <div className="pt-14 h-full">
          <EntityListView
            entities={entities}
            connections={connections}
            onDeleteConnection={(id) => deleteConnection.mutate(id)}
            onCreateConnection={handleListCreateConnection}
            onEntityClick={handleListEntityClick}
          />
        </div>

        <CreateEntityModal
          open={showCreateEntity}
          onClose={() => setShowCreateEntity(false)}
          onSubmit={handleCreateEntity}
        />

        <ConnectionModal
          open={connectionModalState.open}
          onClose={() => setConnectionModalState((s) => ({ ...s, open: false }))}
          onSubmit={handleCreateConnection}
          sourceName={connectionModalState.sourceName}
          targetName={connectionModalState.targetName}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Graph render
  // ---------------------------------------------------------------------------

  return (
    <div ref={graphContainerRef} className="relative h-full w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Onboarding */}
      <GraphOnboarding />

      {/* Top toolbar */}
      <div
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5"
        style={{
          background: "rgba(15,15,16,0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "6px 10px",
        }}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCreateEntity(true)}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
        >
          <Plus className="w-3 h-3 mr-1" />
          Entity
        </Button>
        <div className="w-px h-4 bg-border/20" />
        <GraphSearch
          entities={entities}
          onHighlight={setHighlightedEntityId}
          onFocusEntity={handleFocusEntity}
        />
        <div className="w-px h-4 bg-border/20" />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAutoLayout}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
        >
          <LayoutGrid className="w-3 h-3 mr-1" />
          Auto
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCascadeFlowLayout}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          title="Cascade Flow Layout — arrange by cascade stage"
        >
          <Columns3 className="w-3 h-3 mr-1" />
          Flow
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => reactFlow.fitView({ padding: 0.15 })}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
        >
          <Zap className="w-3 h-3 mr-1" />
          Fit
        </Button>
        <div className="w-px h-4 bg-border/20" />
        {/* Undo / Redo */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => history.undo()}
          disabled={!history.canUndo}
          className="h-7 w-7 p-0 text-tier-3 hover:text-tier-1 disabled:opacity-20"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => history.redo()}
          disabled={!history.canRedo}
          className="h-7 w-7 p-0 text-tier-3 hover:text-tier-1 disabled:opacity-20"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3 h-3" />
        </Button>
        <div className="w-px h-4 bg-border/20" />
        {/* Export */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (graphContainerRef.current) {
              exportGraphAsPNG(graphContainerRef.current);
            }
          }}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          title="Export as PNG"
        >
          <Download className="w-3 h-3 mr-1" />
          PNG
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => exportGraphAsJSON(entities, connections)}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
          title="Export as JSON"
        >
          <Download className="w-3 h-3 mr-1" />
          JSON
        </Button>
        <div className="w-px h-4 bg-border/20" />
        {/* View toggle */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-1 bg-white/5"
        >
          <Network className="w-3 h-3 mr-1" />
          Graph
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setViewMode("tree")}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
        >
          <TreePine className="w-3 h-3 mr-1" />
          Tree
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setViewMode("list")}
          className="h-7 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1"
        >
          <List className="w-3 h-3 mr-1" />
          List
        </Button>
      </div>

      {/* Analysis toolbar — second row */}
      <div
        className="absolute top-14 right-3 z-10 flex items-center gap-0.5"
        style={{
          background: "rgba(15,15,16,0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "4px 6px",
        }}
      >
        {([
          { mode: "gravity" as AnalysisMode, icon: Gauge, label: "Gravity" },
          { mode: "tensions" as AnalysisMode, icon: AlertTriangle, label: "Tensions" },
          { mode: "paths" as AnalysisMode, icon: Waypoints, label: "Paths" },
          { mode: "clusters" as AnalysisMode, icon: Boxes, label: "Clusters" },
          { mode: "whatif" as AnalysisMode, icon: Trash2, label: "What-If" },
        ] as const).map(({ mode, icon: ModeIcon, label }) => (
          <Button
            key={mode}
            size="sm"
            variant="ghost"
            onClick={() => toggleAnalysis(mode)}
            className={`h-6 text-[9px] uppercase tracking-[1px] font-sans ${
              analysisMode === mode
                ? "text-teal bg-teal/10"
                : "text-tier-4 hover:text-tier-2"
            }`}
          >
            <ModeIcon className="w-3 h-3 mr-0.5" />
            {label}
          </Button>
        ))}
        <div className="w-px h-4 bg-border/20" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAuditEntityId((prev) => prev ? null : (analysisSelectedEntities[0] ?? null))}
          className={`h-6 text-[9px] uppercase tracking-[1px] font-sans ${
            auditEntityId ? "text-teal bg-teal/10" : "text-tier-4 hover:text-tier-2"
          }`}
          title="Select a node, then click Audit to trace its cascade"
        >
          <ScanSearch className="w-3 h-3 mr-0.5" />
          Audit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setShowTimeline((p) => !p);
            setTimelineIndex(0);
          }}
          className={`h-6 text-[9px] uppercase tracking-[1px] font-sans ${
            showTimeline ? "text-teal bg-teal/10" : "text-tier-4 hover:text-tier-2"
          }`}
        >
          <Clock className="w-3 h-3 mr-0.5" />
          Timeline
        </Button>
      </div>

      {/* Cascade filter bar — third row */}
      <div className="absolute top-[88px] left-3 z-10">
        <CascadeFilterBar
          activeStages={activeStages}
          onChange={setActiveStages}
        />
      </div>

      {/* Cascade path indicator */}
      {cascadePathEntityId && (
        <div
          className="absolute top-3 right-3 z-10 flex items-center gap-2"
          style={{
            background: "rgba(15,15,16,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(61,255,205,0.15)",
            padding: "6px 12px",
          }}
        >
          <Route className="w-3 h-3 text-teal" />
          <span className="text-[10px] font-sans text-teal uppercase tracking-[1px]">
            Cascade Path
          </span>
          <span className="text-[10px] font-mono text-tier-2">
            {entities.find((e) => e.id === cascadePathEntityId)?.name}
          </span>
          {cascadePath && (
            <span className="text-[9px] font-mono text-tier-4">
              {cascadePath.entityIds.size} entities
            </span>
          )}
          <button
            type="button"
            onClick={() => setCascadePathEntityId(null)}
            className="text-tier-4 hover:text-tier-2 text-[9px] uppercase tracking-[1px] font-sans ml-1"
          >
            Clear
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-[#0A0E17]"
        defaultEdgeOptions={{
          type: "cascadeEdge",
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.02)"
        />
        <Controls
          showInteractive={false}
          className="!bg-[#0D1117] !border-border/30 !shadow-none [&>button]:!bg-transparent [&>button]:!border-border/20 [&>button]:!text-muted-foreground [&>button:hover]:!bg-accent/10"
        />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-[#0D1117] !border-border/30"
          maskColor="rgba(0,0,0,0.7)"
          nodeColor={(node) => {
            const d = node.data as unknown as EntityNodeData;
            return d.color ?? ENTITY_TYPE_COLORS[d.entityType] ?? "#00D4FF";
          }}
          style={{ width: 180, height: 120 }}
        />

        {/* SVG arrow markers per cascade stage */}
        <svg>
          <defs>
            {Object.entries(CASCADE_STAGE_COLORS).map(([stage, color]) => (
              <marker
                key={stage}
                id={`arrow-${stage}`}
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d={`M 0 0 L 10 5 L 0 10 z`} fill={`${color}88`} />
              </marker>
            ))}
          </defs>
        </svg>
      </ReactFlow>

      {/* Node context menu */}
      {contextMenu && (() => {
        const ctxEntity = entities.find((e) => e.id === contextMenu.entityId);
        if (!ctxEntity) return null;
        return (
          <div
            className="fixed z-50"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              background: "rgba(14,19,32,0.96)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              minWidth: 160,
            }}
          >
            <div className="px-3 py-1.5 border-b border-white/[0.06]">
              <span className="text-[10px] font-mono text-tier-3 uppercase tracking-[1px] truncate block max-w-[180px]">
                {ctxEntity.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleContextCascadeAudit}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-sans text-tier-2 hover:bg-white/[0.04] hover:text-tier-1 transition-colors text-left"
            >
              <ScanSearch className="w-3 h-3 text-tier-4" />
              Cascade Audit
            </button>
            {ctxEntity.pinned && (
              <button
                type="button"
                onClick={handleContextUnpin}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-sans text-tier-2 hover:bg-white/[0.04] hover:text-tier-1 transition-colors text-left"
              >
                <PinOff className="w-3 h-3 text-tier-4" />
                Unpin
              </button>
            )}
            <div className="border-t border-white/[0.06]" />
            <button
              type="button"
              onClick={handleContextDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-sans text-red-400 hover:bg-red-500/[0.06] hover:text-red-300 transition-colors text-left"
            >
              <Trash2 className="w-3 h-3" />
              Delete Entity
            </button>
          </div>
        );
      })()}

      {/* Cascade Audit Panel */}
      {auditEntityId && (
        <CascadeAuditPanel
          entityId={auditEntityId}
          entities={entities}
          connections={connections}
          onClose={() => setAuditEntityId(null)}
          onHighlightEntities={setAnalysisHighlightedEntities}
          onHighlightConnections={setAnalysisHighlightedConnections}
          onFocusEntity={handleFocusEntity}
        />
      )}

      {/* Timeline Scrubber */}
      {showTimeline && (
        <TimelineScrubber
          timePoints={timelineBounds.timePoints}
          events={timelineBounds.events}
          currentIndex={timelineIndex}
          onChange={setTimelineIndex}
          onClose={() => {
            setShowTimeline(false);
            setTimelineIndex(0);
          }}
        />
      )}

      {/* Analysis Panel */}
      <AnalysisPanel
        mode={analysisMode}
        onClose={closeAnalysis}
        entities={entities}
        connections={connections}
        selectedEntityIds={analysisSelectedEntities}
        onSelectEntity={(id) => {
          handleFocusEntity(id);
          if (analysisMode === "paths" || analysisMode === "whatif") {
            setAnalysisSelectedEntities((prev) => {
              if (analysisMode === "paths") {
                if (prev.length === 0) return [id];
                if (prev.length === 1 && prev[0] !== id) return [prev[0], id];
                return [id];
              }
              return [id];
            });
          }
        }}
        onHighlightEntities={setAnalysisHighlightedEntities}
        onHighlightConnections={setAnalysisHighlightedConnections}
      />

      {/* Modals */}
      <CreateEntityModal
        open={showCreateEntity}
        onClose={() => setShowCreateEntity(false)}
        onSubmit={handleCreateEntity}
      />

      <ConnectionModal
        open={connectionModalState.open}
        onClose={() =>
          setConnectionModalState((s) => ({ ...s, open: false }))
        }
        onSubmit={handleCreateConnection}
        sourceName={connectionModalState.sourceName}
        targetName={connectionModalState.targetName}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported wrapper with ReactFlowProvider
// ---------------------------------------------------------------------------

interface WorldEntityGraphProps {
  worldId: string;
}

export default function WorldEntityGraph({ worldId }: WorldEntityGraphProps) {
  const { data: entities, isLoading: entitiesLoading } = useEntities(worldId);
  const { data: connections, isLoading: connectionsLoading } =
    useEntityConnections(worldId);

  if (entitiesLoading || connectionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="sm" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <InnerGraph
        worldId={worldId}
        entities={entities ?? []}
        connections={connections ?? []}
      />
    </ReactFlowProvider>
  );
}
