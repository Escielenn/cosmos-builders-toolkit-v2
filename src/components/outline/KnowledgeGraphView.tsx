import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GraphNodeComponent, { type GraphNodeData } from "./GraphNode";
import GraphEdgeComponent from "./GraphEdge";
import {
  CONNECTION_TYPES,
  CONNECTION_TYPE_LABELS,
  type ConnectionType,
} from "@/services/world-connections-crud";
import type {
  WorldElement,
  WorldEntry,
  WorldConnection,
  CascadeLayer,
} from "@/services/world-data";
import { getLayerForTool } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Custom node/edge types registration
// ---------------------------------------------------------------------------

const nodeTypes = { graphNode: GraphNodeComponent };
const edgeTypes = { graphEdge: GraphEdgeComponent };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KnowledgeGraphViewProps {
  elements: WorldElement[];
  entries: WorldEntry[];
  connections: WorldConnection[];
  worldId: string;
  onElementClick: (element: WorldElement) => void;
  onCreateConnection: (input: {
    sourceId: string;
    sourceType: "worksheet" | "entry";
    targetId: string;
    targetType: "worksheet" | "entry";
    connectionType: string;
  }) => void;
  onDeleteConnection: (connectionId: string) => void;
  onCreateEntry: (input: { title: string; entryType: string }) => void;
}

// ---------------------------------------------------------------------------
// Position persistence (localStorage)
// ---------------------------------------------------------------------------

function loadPositions(worldId: string): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(`graph-layout-${worldId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePositions(worldId: string, positions: Record<string, { x: number; y: number }>) {
  localStorage.setItem(`graph-layout-${worldId}`, JSON.stringify(positions));
}

// ---------------------------------------------------------------------------
// Build nodes/edges from data
// ---------------------------------------------------------------------------

function buildGraphNodes(
  elements: WorldElement[],
  entries: WorldEntry[],
  savedPositions: Record<string, { x: number; y: number }>
): Node[] {
  const nodes: Node[] = [];
  let row = 0;

  // Worksheets
  for (const el of elements) {
    const pos = savedPositions[el.id] ?? { x: 100 + (row % 5) * 180, y: 80 + Math.floor(row / 5) * 90 };
    nodes.push({
      id: el.id,
      type: "graphNode",
      position: pos,
      data: {
        label: el.title,
        kind: "worksheet",
        layerId: el.layerId,
        completionStatus: el.completionStatus,
        toolDisplayName: el.toolDisplayName,
      } satisfies GraphNodeData,
    });
    row++;
  }

  // Entries
  for (const entry of entries) {
    const pos = savedPositions[entry.id] ?? { x: 100 + (row % 5) * 180, y: 80 + Math.floor(row / 5) * 90 };
    nodes.push({
      id: entry.id,
      type: "graphNode",
      position: pos,
      data: {
        label: entry.title,
        kind: "entry",
        layerId: "narrative" as CascadeLayer,
        completionStatus: entry.content ? "partial" : "empty",
        entryType: entry.entry_type,
      } satisfies GraphNodeData,
    });
    row++;
  }

  return nodes;
}

function buildGraphEdges(connections: WorldConnection[]): Edge[] {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.source_worksheet_id ?? conn.source_entry_id ?? "",
    target: conn.target_worksheet_id ?? conn.target_entry_id ?? "",
    type: "graphEdge",
    data: {
      connectionType: conn.connection_type,
      description: conn.description,
    },
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
  }));
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

const KnowledgeGraphView = ({
  elements,
  entries,
  connections,
  worldId,
  onElementClick,
  onCreateConnection,
  onDeleteConnection,
  onCreateEntry,
}: KnowledgeGraphViewProps) => {
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [selectedConnType, setSelectedConnType] = useState<ConnectionType>("related_to");

  const savedPositions = useMemo(() => loadPositions(worldId), [worldId]);

  const initialNodes = useMemo(
    () => buildGraphNodes(elements, entries, savedPositions),
    [elements, entries, savedPositions]
  );

  const initialEdges = useMemo(
    () => buildGraphEdges(connections),
    [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Save positions when nodes are dragged
  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const positions = loadPositions(worldId);
      positions[node.id] = node.position;
      savePositions(worldId, positions);
    },
    [worldId]
  );

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection) => {
      setPendingConnection(connection);
    },
    []
  );

  const confirmConnection = useCallback(() => {
    if (!pendingConnection) return;

    const sourceNode = nodes.find((n) => n.id === pendingConnection.source);
    const targetNode = nodes.find((n) => n.id === pendingConnection.target);
    if (!sourceNode || !targetNode) return;

    const sourceData = sourceNode.data as unknown as GraphNodeData;
    const targetData = targetNode.data as unknown as GraphNodeData;

    onCreateConnection({
      sourceId: pendingConnection.source!,
      sourceType: sourceData.kind,
      targetId: pendingConnection.target!,
      targetType: targetData.kind,
      connectionType: selectedConnType,
    });

    setPendingConnection(null);
  }, [pendingConnection, nodes, onCreateConnection, selectedConnType]);

  const cancelConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  // Double-click on node → navigate
  const handleNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as unknown as GraphNodeData;
      if (data.kind === "worksheet") {
        const el = elements.find((e) => e.id === node.id);
        if (el) onElementClick(el);
      }
    },
    [elements, onElementClick]
  );

  // Double-click on canvas → create entry
  const handlePaneDoubleClick = useCallback(
    () => {
      onCreateEntry({ title: "New Element", entryType: "note" });
    },
    [onCreateEntry]
  );

  // Delete key → delete selected edges
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedEdges = edges.filter((edge) => edge.selected);
        selectedEdges.forEach((edge) => onDeleteConnection(edge.id));
      }
    },
    [edges, onDeleteConnection]
  );

  return (
    <div className="relative h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Connection type picker dialog */}
      {pendingConnection && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-sf-void border border-sf-border p-3 flex items-center gap-2 shadow-xl">
          <span className="text-[10px] uppercase tracking-wider text-t3 font-heading">
            Relationship:
          </span>
          <Select
            value={selectedConnType}
            onValueChange={(v) => setSelectedConnType(v as ConnectionType)}
          >
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONNECTION_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {CONNECTION_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-7 text-xs" onClick={confirmConnection}>
            Connect
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelConnection}>
            Cancel
          </Button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={cancelConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-sf-void"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.04)" />
        <Controls
          showInteractive={false}
          className="!bg-sf-void !border-sf-border !shadow-none [&>button]:!bg-transparent [&>button]:!border-sf-border [&>button]:!text-t3 [&>button:hover]:!bg-accent/10"
        />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-sf-void !border-sf-border"
          maskColor="rgba(0,0,0,0.7)"
        />

        {/* SVG arrow marker */}
        <svg>
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
};

export default KnowledgeGraphView;
