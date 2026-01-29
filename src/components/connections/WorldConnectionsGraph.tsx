import { useState, useEffect, useRef, useCallback } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import ConnectionNode from "./ConnectionNode";
import ConnectionEdge from "./ConnectionEdge";
import type { GraphNode, GraphEdge } from "@/hooks/use-world-graph";

interface WorldConnectionsGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (nodeId: string, toolType: string) => void;
  width?: number;
  height?: number;
}

interface SimNode extends SimulationNodeDatum, GraphNode {}

interface SimLink extends SimulationLinkDatum<SimNode> {
  linkType: string;
}

const WorldConnectionsGraph = ({
  nodes,
  edges,
  onNodeClick,
  width = 800,
  height = 600,
}: WorldConnectionsGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Run d3-force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    // Create simulation nodes with initial random positions
    const simNodes: SimNode[] = nodes.map((node) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    // Create simulation links
    const simLinks: SimLink[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      linkType: edge.linkType,
    }));

    // Create force simulation
    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "charge",
        forceManyBody<SimNode>().strength(-400)
      )
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(150)
      )
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide<SimNode>().radius(50))
      .alphaDecay(0.02);

    // Update positions on each tick
    simulation.on("tick", () => {
      const newPositions = new Map<string, { x: number; y: number }>();

      simNodes.forEach((node) => {
        // Constrain to bounds with padding
        const padding = 60;
        const x = Math.max(padding, Math.min(width - padding, node.x || 0));
        const y = Math.max(padding, Math.min(height - padding, node.y || 0));
        newPositions.set(node.id, { x, y });
      });

      setPositions(newPositions);
    });

    // Stop simulation after it stabilizes
    simulation.on("end", () => {
      console.log("Simulation stabilized");
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
  }, []);

  // Get connected nodes for highlighting
  const getConnectedNodes = (nodeId: string): Set<string> => {
    const connected = new Set<string>();
    connected.add(nodeId);

    edges.forEach((edge) => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      }
      if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });

    return connected;
  };

  const connectedNodes = hoveredNode ? getConnectedNodes(hoveredNode) : new Set<string>();

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No worksheets in this world yet</p>
          <p className="text-sm">Create some worksheets to see connections</p>
        </div>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background pattern */}
      <defs>
        <pattern
          id="grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1" fill="hsl(var(--border) / 0.3)" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />

      {/* Edges */}
      <g className="edges">
        {edges.map((edge) => {
          const sourcePos = positions.get(edge.source);
          const targetPos = positions.get(edge.target);

          if (!sourcePos || !targetPos) return null;

          const isHighlighted =
            hoveredNode !== null &&
            (edge.source === hoveredNode ||
              edge.target === hoveredNode);

          return (
            <ConnectionEdge
              key={`${edge.source}-${edge.target}`}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              linkType={edge.linkType}
              highlighted={isHighlighted}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g className="nodes">
        {nodes.map((node) => {
          const pos = positions.get(node.id);

          if (!pos) return null;

          const isHovered = hoveredNode === node.id;
          const isConnected =
            hoveredNode !== null && connectedNodes.has(node.id);
          const opacity =
            hoveredNode === null || isConnected ? 1 : 0.3;

          return (
            <g key={node.id} style={{ opacity }}>
              <ConnectionNode
                x={pos.x}
                y={pos.y}
                toolType={node.toolType}
                title={node.speciesName || node.title}
                isHovered={isHovered}
                onHover={() => handleNodeHover(node.id)}
                onLeave={() => handleNodeHover(null)}
                onClick={() => onNodeClick(node.id, node.toolType)}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default WorldConnectionsGraph;
