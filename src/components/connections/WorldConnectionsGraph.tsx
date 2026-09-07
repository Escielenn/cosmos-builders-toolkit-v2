// ---------------------------------------------------------------------------
// WorldConnectionsGraph — the Web view's renderer (F3, decided 2026-09-06).
//
// The one graph. `/graph` and `/connections` were three views of two graphs on
// two routes; this is what they collapsed into. It draws ENTITIES as nodes and
// TYPED RELATIONS as edges, both from world_entries / world_connections.
//
// Layout: d3-force, with a saved position (metadata.graph_x/y) pinning any
// node the writer has dragged. Dragging is committed by the caller.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
  type Simulation,
} from "d3-force";
import ConnectionNode from "./ConnectionNode";
import ConnectionEdge from "./ConnectionEdge";
import type {
  CascadeStage,
  ConnectionCascadeStage,
  EntityType,
} from "@/services/entity-graph-types";

export interface WebNode {
  id: string;
  name: string;
  entityType: EntityType;
  cascadeStage: CascadeStage;
  color: string | null;
  summary: string | null;
  typeLabel: string | null;
  /** Saved layout position, when the writer pinned this node. */
  x: number | null;
  y: number | null;
  pinned: boolean;
}

export interface WebEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  relationshipLabel: string | null;
  cascadeStage: ConnectionCascadeStage;
  bidirectional: boolean;
  /** Outside the scrubber's epoch: drawn dashed and dim, never hidden. */
  historical: boolean;
}

interface WorldConnectionsGraphProps {
  nodes: WebNode[];
  edges: WebEdge[];
  onNodeClick: (nodeId: string) => void;
  /** Fired once when a drag ends, so the caller can persist the position. */
  onNodeMoved?: (nodeId: string, x: number, y: number) => void;
  selectedNodeId?: string | null;
  highlightNodeId?: string | null;
  width?: number;
  height?: number;
  emptyMessage?: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
}

const PADDING = 60;

const WorldConnectionsGraph = ({
  nodes,
  edges,
  onNodeClick,
  onNodeMoved,
  selectedNodeId = null,
  highlightNodeId = null,
  width = 900,
  height = 600,
  emptyMessage = "NO ENTITIES ON FILE.",
}: WorldConnectionsGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);

  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  // A node the writer placed keeps its place; everything else is laid out.
  // The dependency is the id/pin signature, not the array identity, so a
  // filter change does not restart the simulation for unrelated reasons.
  const layoutKey = useMemo(
    () =>
      nodes
        .map((n) => `${n.id}:${n.pinned ? `${n.x ?? ""},${n.y ?? ""}` : ""}`)
        .join("|"),
    [nodes]
  );
  const edgeKey = useMemo(() => edges.map((e) => e.id).join("|"), [edges]);

  useEffect(() => {
    if (nodes.length === 0) {
      setPositions(new Map());
      return;
    }

    const simNodes: SimNode[] = nodes.map((node) => ({
      id: node.id,
      x: node.x ?? width / 2 + (Math.random() - 0.5) * 200,
      y: node.y ?? height / 2 + (Math.random() - 0.5) * 200,
      fx: node.pinned && node.x !== null ? node.x : null,
      fy: node.pinned && node.y !== null ? node.y : null,
    }));
    simNodesRef.current = simNodes;

    const simLinks: SimLink[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    const simulation = forceSimulation<SimNode>(simNodes)
      .force("charge", forceManyBody<SimNode>().strength(-400))
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(150)
      )
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide<SimNode>().radius(50))
      .alphaDecay(0.02);

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      const next = new Map<string, { x: number; y: number }>();
      for (const node of simNodes) {
        next.set(node.id, {
          x: Math.max(PADDING, Math.min(width - PADDING, node.x ?? 0)),
          y: Math.max(PADDING, Math.min(height - PADDING, node.y ?? 0)),
        });
      }
      setPositions(next);
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey, edgeKey, width, height]);

  const handleDragStart = useCallback(
    (nodeId: string, event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      setDraggingNode(nodeId);
      const node = simNodesRef.current.find((n) => n.id === nodeId);
      if (node && simulationRef.current) {
        node.fx = node.x;
        node.fy = node.y;
        simulationRef.current.alphaTarget(0.3).restart();
      }
    },
    []
  );

  const handleDrag = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!draggingNode || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const point =
        "touches" in event ? event.touches[0] : (event as React.MouseEvent);
      if (!point) return;

      const x = (point.clientX - rect.left) * (width / rect.width);
      const y = (point.clientY - rect.top) * (height / rect.height);

      const node = simNodesRef.current.find((n) => n.id === draggingNode);
      if (node) {
        node.fx = Math.max(PADDING, Math.min(width - PADDING, x));
        node.fy = Math.max(PADDING, Math.min(height - PADDING, y));
      }
    },
    [draggingNode, width, height]
  );

  const handleDragEnd = useCallback(() => {
    if (!draggingNode) return;
    const node = simNodesRef.current.find((n) => n.id === draggingNode);
    if (node && simulationRef.current) {
      // The node stays where it was put — that is the whole point of dragging
      // it — and the caller writes the position back to the graph.
      simulationRef.current.alphaTarget(0);
      if (onNodeMoved && node.fx != null && node.fy != null) {
        onNodeMoved(draggingNode, node.fx, node.fy);
      }
    }
    setDraggingNode(null);
  }, [draggingNode, onNodeMoved]);

  const activeNode = hoveredNode ?? highlightNodeId ?? selectedNodeId;

  const connectedNodes = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const connected = new Set<string>([activeNode]);
    for (const edge of edges) {
      if (edge.source === activeNode) connected.add(edge.target);
      if (edge.target === activeNode) connected.add(edge.source);
    }
    return connected;
  }, [activeNode, edges]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center">
        <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-t3">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Relationship web: ${nodes.length} entities, ${edges.length} relations`}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDrag}
      onTouchEnd={handleDragEnd}
      style={{ cursor: draggingNode ? "grabbing" : "default" }}
    >
      <defs>
        <pattern id="sf-web-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" style={{ fill: "var(--sf-line-hairline)" }} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#sf-web-grid)" />

      <g className="edges">
        {edges.map((edge) => {
          const a = positions.get(edge.source);
          const b = positions.get(edge.target);
          if (!a || !b) return null;

          const touchesActive =
            activeNode !== null &&
            (edge.source === activeNode || edge.target === activeNode);

          return (
            <ConnectionEdge
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              cascadeStage={edge.cascadeStage}
              relationshipType={edge.relationshipType}
              relationshipLabel={edge.relationshipLabel}
              bidirectional={edge.bidirectional}
              highlighted={touchesActive}
              historical={edge.historical}
              showLabel={touchesActive}
            />
          );
        })}
      </g>

      <g className="nodes">
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const data = nodeById.get(node.id);
          if (!data) return null;

          const dimmed =
            activeNode !== null && !connectedNodes.has(node.id);

          return (
            <g
              key={node.id}
              // Dimmed, not hidden, and not so dim the label stops reading.
              opacity={dimmed ? 0.5 : 1}
              style={{ cursor: draggingNode === node.id ? "grabbing" : "grab" }}
              onMouseDown={(e) => handleDragStart(node.id, e)}
              onTouchStart={(e) => handleDragStart(node.id, e)}
            >
              <ConnectionNode
                x={pos.x}
                y={pos.y}
                entityType={data.entityType}
                cascadeStage={data.cascadeStage}
                color={data.color}
                title={data.name}
                summary={data.summary}
                typeLabel={data.typeLabel}
                isHovered={hoveredNode === node.id}
                isSelected={selectedNodeId === node.id || highlightNodeId === node.id}
                isDragging={draggingNode === node.id}
                onHover={() => !draggingNode && setHoveredNode(node.id)}
                onLeave={() => !draggingNode && setHoveredNode(null)}
                onClick={() => !draggingNode && onNodeClick(node.id)}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default WorldConnectionsGraph;
