import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Network, ExternalLink, LayoutGrid, List, ChevronDown, ChevronRight, Globe, Dna, Sparkles, GitBranch, Rocket, Zap, Calculator, FileText, Filter, Crown, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorlds } from "@/hooks/use-worlds";
import { useWorldGraph } from "@/hooks/use-world-graph";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import {
  WorldConnectionsGraph,
  ConnectionLegend,
  DrakeContextCard,
} from "@/components/connections";
import { cn } from "@/lib/utils";

// Tool icon mapping
const TOOL_ICONS: Record<string, React.ElementType> = {
  "planetary-profile": Globe,
  "evolutionary-biology": Dna,
  "xenomythology-framework-builder": Sparkles,
  "environmental-chain-reaction": GitBranch,
  "spacecraft-designer": Rocket,
  "propulsion-consequences-map": Zap,
  "drake-equation-calculator": Calculator,
  "star-system-builder": Sparkles,
  "empire-designer": Crown,
  "technology-consequences": Zap,
  "species-interaction-matrix": Users,
};

// Filter options for filtering by entity type
const FILTER_OPTIONS = [
  { value: "all", label: "All Types", icon: null },
  { value: "planetary-profile", label: "Planets", icon: Globe },
  { value: "evolutionary-biology", label: "Species", icon: Dna },
  { value: "star-system-builder", label: "Stars", icon: Sparkles },
  { value: "xenomythology-framework-builder", label: "Mythologies", icon: Sparkles },
  { value: "environmental-chain-reaction", label: "Environments", icon: GitBranch },
  { value: "spacecraft-designer", label: "Spacecraft", icon: Rocket },
  { value: "empire-designer", label: "Empires", icon: Crown },
  { value: "species-interaction-matrix", label: "Species Matrix", icon: Users },
];

type ViewMode = "mindmap" | "outline";
type SortBy = "toolType" | "title" | "connections";
type FilterBy = "all" | string;

// Tool routes for navigation
const TOOL_ROUTES: Record<string, string> = {
  "planetary-profile": "/tools/planetary-profile",
  "evolutionary-biology": "/tools/evolutionary-biology",
  "xenomythology-framework-builder": "/tools/xenomythology-framework-builder",
  "environmental-chain-reaction": "/tools/environmental-chain-reaction",
  "spacecraft-designer": "/tools/spacecraft-designer",
  "propulsion-consequences-map": "/tools/propulsion-consequences-map",
  "drake-equation-calculator": "/tools/drake-equation-calculator",
  "star-system-builder": "/tools/star-system-builder",
  "empire-designer": "/tools/empire-designer",
  "technology-consequences": "/tools/technology-consequences",
  "species-interaction-matrix": "/tools/species-interaction-matrix",
};

const WorldConnections = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { worlds } = useWorlds();
  const { nodes, edges, isLoading } = useWorldGraph(worldId);
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [sortBy, setSortBy] = useState<SortBy>("toolType");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["all"]));

  const world = worlds.find((w) => w.id === worldId);

  // Filter nodes and edges based on selected filter
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (filterBy === "all") {
      return { filteredNodes: nodes, filteredEdges: edges };
    }

    const filtered = nodes.filter((n) => n.toolType === filterBy);
    const filteredIds = new Set(filtered.map((n) => n.id));

    // Only show edges where both nodes are in the filtered set
    const filteredE = edges.filter(
      (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
    );

    return { filteredNodes: filtered, filteredEdges: filteredE };
  }, [nodes, edges, filterBy]);

  const handleNodeClick = (nodeId: string, toolType: string) => {
    const route = TOOL_ROUTES[toolType];
    if (route) {
      navigate(`${route}?worldId=${worldId}&worksheetId=${nodeId}`);
    }
  };

  // Get connection count for each node (using filtered data)
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredNodes.forEach((n) => counts.set(n.id, 0));
    filteredEdges.forEach((e) => {
      counts.set(e.source, (counts.get(e.source) || 0) + 1);
      counts.set(e.target, (counts.get(e.target) || 0) + 1);
    });
    return counts;
  }, [filteredNodes, filteredEdges]);

  // Get connected worksheets for a node (using filtered data)
  const getConnectedWorksheets = (nodeId: string) => {
    return filteredEdges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => {
        const connectedId = e.source === nodeId ? e.target : e.source;
        return filteredNodes.find((n) => n.id === connectedId);
      })
      .filter(Boolean);
  };

  // Group and sort nodes for outline view (using filtered data)
  const groupedNodes = useMemo(() => {
    const sorted = [...filteredNodes].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.speciesName || a.title).localeCompare(b.speciesName || b.title);
        case "connections":
          return (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0);
        case "toolType":
        default:
          return a.toolType.localeCompare(b.toolType);
      }
    });

    // Group by tool type
    const groups = new Map<string, typeof nodes>();
    sorted.forEach((node) => {
      const groupKey = node.toolType;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(node);
    });

    return groups;
  }, [filteredNodes, sortBy, connectionCounts]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            to={worldId ? `/worlds/${worldId}` : "/"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {world?.name || "World"}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-8 h-8 text-primary" />
                <h1 className="font-display text-3xl md:text-4xl font-light uppercase tracking-wider">
                  World Connections
                </h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Visualize how your worksheets are connected. Planets link to
                species, species link to mythologies, and everything flows from
                environmental pressures.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredNodes.length}{filterBy !== "all" ? ` of ${nodes.length}` : ""} worksheets
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {filteredEdges.length}{filterBy !== "all" ? ` of ${edges.length}` : ""} connections
              </Badge>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="bg-background/50 rounded-lg p-1"
            >
              <ToggleGroupItem
                value="mindmap"
                className="px-3 py-1.5 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <LayoutGrid className="w-4 h-4 mr-1.5" />
                Mind Map
              </ToggleGroupItem>
              <ToggleGroupItem
                value="outline"
                className="px-3 py-1.5 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <List className="w-4 h-4 mr-1.5" />
                Outline
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterBy)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {viewMode === "outline" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toolType">Tool Type</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                  <SelectItem value="connections">Most Connected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Graph or Outline */}
          <GlassPanel className="xl:col-span-3 p-4 md:p-6 min-h-[600px]">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Loading connections...</p>
                </div>
              </div>
            ) : viewMode === "mindmap" ? (
              <WorldConnectionsGraph
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodeClick={handleNodeClick}
                width={900}
                height={600}
              />
            ) : (
              /* Outline View */
              <div className="space-y-4 max-h-[560px] overflow-y-auto">
                {filteredNodes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {filterBy !== "all" ? (
                      <>
                        <p className="text-lg mb-2">No worksheets match this filter</p>
                        <p className="text-sm">Try selecting a different type or "All Types"</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg mb-2">No worksheets in this world yet</p>
                        <p className="text-sm">Create some worksheets to see connections</p>
                      </>
                    )}
                  </div>
                ) : (
                  Array.from(groupedNodes.entries()).map(([toolType, groupNodes]) => {
                    const IconComponent = TOOL_ICONS[toolType] || FileText;
                    const isExpanded = expandedGroups.has(toolType) || expandedGroups.has("all");

                    return (
                      <div key={toolType} className="border border-border/50 rounded-lg overflow-hidden">
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(toolType)}
                          className="w-full flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <IconComponent className="w-5 h-5 text-primary" />
                          <span className="font-medium">{getToolDisplayName(toolType)}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {groupNodes.length}
                          </Badge>
                        </button>

                        {/* Group Items */}
                        {isExpanded && (
                          <div className="divide-y divide-border/30">
                            {groupNodes.map((node) => {
                              const connected = getConnectedWorksheets(node.id);
                              const NodeIcon = TOOL_ICONS[node.toolType] || FileText;

                              return (
                                <div key={node.id} className="p-3 pl-10 hover:bg-muted/20 transition-colors">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <button
                                        onClick={() => handleNodeClick(node.id, node.toolType)}
                                        className="font-medium text-left hover:text-primary transition-colors truncate block w-full"
                                      >
                                        {node.speciesName || node.title}
                                      </button>
                                      {connected.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {connected.map((conn) => {
                                            if (!conn) return null;
                                            const ConnIcon = TOOL_ICONS[conn.toolType] || FileText;
                                            return (
                                              <button
                                                key={conn.id}
                                                onClick={() => handleNodeClick(conn.id, conn.toolType)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                                              >
                                                <ConnIcon className="w-3 h-3" />
                                                {conn.speciesName || conn.title}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {connectionCounts.get(node.id) || 0} links
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </GlassPanel>

          {/* Sidebar */}
          <div className="space-y-4">
            <ConnectionLegend />
            {worldId && <DrakeContextCard worldId={worldId} />}

            {/* Quick Actions */}
            <GlassPanel className="p-4">
              <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={`/tools/planetary-profile?worldId=${worldId}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    New Planet
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={`/tools/evolutionary-biology?worldId=${worldId}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    New Species
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={`/tools/xenomythology-framework-builder?worldId=${worldId}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    New Mythology
                  </Link>
                </Button>
              </div>
            </GlassPanel>

            {/* Help Text */}
            <GlassPanel className="p-4">
              <h3 className="font-medium text-sm mb-2">How It Works</h3>
              <p className="text-xs text-muted-foreground">
                Click any node to open that worksheet. Hover to highlight
                connected items. Connections are created when you link
                worksheets together using the "Link" buttons in each tool.
              </p>
            </GlassPanel>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorldConnections;
