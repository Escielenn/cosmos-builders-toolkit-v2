import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Network, ExternalLink, LayoutGrid, List, ChevronDown, ChevronRight, Globe, Dna, Sparkles, GitBranch, Rocket, Zap, Calculator, FileText, Filter, Crown, Users, TreePine, Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
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
import { getToolRoute } from "@/lib/tools-config";
import {
  WorldConnectionsGraph,
  ConnectionLegend,
  DrakeContextCard,
} from "@/components/connections";
import { cn } from "@/lib/utils";
import { useIsWorldLayout, useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { PageBursts } from "@/components/ui/data-burst";
import { WORLD_CONNECTIONS_BURSTS } from "@/lib/data-bursts";
import { useEntities, useDeleteEntity, useUpdateEntity, useCreateEntity } from "@/hooks/use-entity-graph";
import { EntityTreeView } from "@/components/graph/EntityTreeView";
import { CreateEntityModal, type CreateEntityFormData } from "@/components/graph/CreateEntityModal";
import { useToast } from "@/hooks/use-toast";
import { useMetaTags } from "@/hooks/use-meta-tags";

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

type ViewMode = "mindmap" | "worksheet" | "outline";
type SortBy = "toolType" | "title" | "connections";
type FilterBy = "all" | string;

const WorldConnections = () => {
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();
  const layoutContext = useWorldLayoutContext();
  const resolvedWorldId = layoutContext?.worldId ?? worldId ?? "";
  const isInWorldLayout = useIsWorldLayout();
  const { worlds } = useWorlds();
  const { nodes, edges, isLoading } = useWorldGraph(worldId);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusEntityId = searchParams.get("focus");
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [sortBy, setSortBy] = useState<SortBy>("toolType");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["all"]));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showCreateEntity, setShowCreateEntity] = useState(false);
  const [createEntityParentId, setCreateEntityParentId] = useState<string | null>(null);
  const { toast } = useToast();

  useMetaTags({ title: "World Connections" });

  // Entity data for the mind map (tree) view
  const { data: entities } = useEntities(resolvedWorldId || undefined);
  const deleteEntity = useDeleteEntity(resolvedWorldId || undefined);
  const updateEntity = useUpdateEntity(resolvedWorldId || undefined);
  const createEntity = useCreateEntity(resolvedWorldId || undefined);

  // Deep links from EntityHoverCard, CreateElementDialog, and the world sidebar
  // (`?focus=<id>` selects an entity; `?create=true` opens the create dialog).
  // Consume once, then strip so the params don't stick around after navigation.
  useEffect(() => {
    const hasCreate = searchParams.get("create") === "true";
    const hasFocus = searchParams.has("focus");
    if (!hasCreate && !hasFocus) return;
    if (hasCreate) {
      setCreateEntityParentId(null);
      setShowCreateEntity(true);
    }
    // Strip after EntityTreeView has had a render to pick up initialFocusId.
    const id = window.setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("create");
        next.delete("focus");
        return next;
      }, { replace: true });
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTreeCreateChild = useCallback((parentId: string) => {
    setCreateEntityParentId(parentId);
    setShowCreateEntity(true);
  }, []);

  const handleTreeDeleteEntity = useCallback((entityId: string) => {
    if (window.confirm("Delete this entity? This cannot be undone.")) {
      deleteEntity.mutate(entityId);
    }
  }, [deleteEntity]);

  const handleTreeReparent = useCallback((entityId: string, newParentId: string | null) => {
    updateEntity.mutate({ id: entityId, parent_entity_id: newParentId });
  }, [updateEntity]);

  const handleCreateEntity = useCallback((formData: CreateEntityFormData) => {
    createEntity.mutate({
      name: formData.name,
      entity_type: formData.entity_type,
      custom_type_label: formData.custom_type_label,
      cascade_stage: formData.cascade_stage,
      summary: formData.summary,
      parent_entity_id: createEntityParentId,
    });
    setCreateEntityParentId(null);
  }, [createEntity, createEntityParentId]);

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

  // Opens the worksheet a node represents, matching the sidebar's own "Click
  // any node to open that worksheet" claim — which used to be false: this
  // only ever toggled `selectedNodeId` for highlighting. Hovering already
  // highlights a node independently (WorldConnectionsGraph's own
  // `hoveredNode` state), so repurposing click to navigate loses nothing —
  // it makes the graph do the one thing a node click should do.
  const handleNodeClick = (nodeId: string, toolType: string) => {
    const route = getToolRoute(toolType);
    if (!route || !resolvedWorldId) return;
    navigate(`${route}?worldId=${resolvedWorldId}&worksheetId=${nodeId}`);
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

  const connectionsContent = (
    <>
      <PageBursts bursts={WORLD_CONNECTIONS_BURSTS} />
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            to={worldId ? `/worlds/${worldId}` : "/"}
            className="inline-flex items-center gap-2 text-sm text-t3 hover:text-t1 transition-colors mb-4"
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
              <p className="text-t3 max-w-2xl">
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
            <span className="text-sm text-t3">View:</span>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="bg-background/50 rounded-none p-1"
            >
              <ToggleGroupItem
                value="mindmap"
                className="px-3 py-1.5 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <TreePine className="w-4 h-4 mr-1.5" />
                Mind Map
              </ToggleGroupItem>
              <ToggleGroupItem
                value="worksheet"
                className="px-3 py-1.5 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <LayoutGrid className="w-4 h-4 mr-1.5" />
                Worksheet Graph
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
            <Filter className="w-4 h-4 text-t3" />
            <span className="text-sm text-t3">Filter:</span>
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
              <span className="text-sm text-t3">Sort by:</span>
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
              <div className="w-full h-full flex items-center justify-center text-t3">
                <div className="text-center">
                  <Loader className="mb-4" />
                  <p>Loading connections...</p>
                </div>
              </div>
            ) : viewMode === "mindmap" ? (
              <div className="min-h-[600px]">
                {entities && entities.length > 0 ? (
                  <EntityTreeView
                    entities={entities}
                    onCreateChild={handleTreeCreateChild}
                    onDeleteEntity={handleTreeDeleteEntity}
                    onReparent={handleTreeReparent}
                    onFocusEntity={(id) => setSelectedNodeId(id)}
                    initialFocusId={focusEntityId}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <TreePine className="w-8 h-8 text-t4 mb-3" />
                    <h3 className="font-heading text-sm font-light uppercase tracking-[2px] text-t1 mb-2">
                      Your World Map
                    </h3>
                    <p className="text-[12px] font-sans text-t3 leading-relaxed mb-4 max-w-xs">
                      No entities yet. Create a star or planet and watch your world's hierarchy grow.
                    </p>
                    <Button onClick={() => { setCreateEntityParentId(null); setShowCreateEntity(true); }} className="text-xs font-sans">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Create First Entity
                    </Button>
                  </div>
                )}
              </div>
            ) : viewMode === "worksheet" ? (
              <div>
                {/* Nodes with zero edges render as an unexplained scatter of
                    dots — this is the common case, since linking is opt-in
                    per tool. Without this, a graph that's "working as
                    designed" looks identical to a broken one. */}
                {filteredNodes.length > 0 && filteredEdges.length === 0 && (
                  <p className="mb-3 border border-sf-line-interactive bg-sf-surface/60 px-3 py-2 text-[13px] text-t2">
                    {filteredNodes.length} worksheet{filteredNodes.length === 1 ? "" : "s"} on file,
                    none linked yet. Nothing draws a line between them until you use a "Link"
                    button inside a tool — click a node to open it.
                  </p>
                )}
                <WorldConnectionsGraph
                  nodes={filteredNodes}
                  edges={filteredEdges}
                  onNodeClick={handleNodeClick}
                  selectedNodeId={selectedNodeId}
                  width={900}
                  height={600}
                />
              </div>
            ) : (
              /* Outline View */
              <div className="space-y-4 max-h-[560px] overflow-y-auto">
                {filteredNodes.length === 0 ? (
                  <div className="text-center py-12 text-t3">
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
                      <div key={toolType} className="border border-sf-line-interactive rounded-none overflow-hidden">
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(toolType)}
                          className="w-full flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-t3" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-t3" />
                          )}
                          <IconComponent className="w-5 h-5 text-primary" />
                          <span className="font-medium">{getToolDisplayName(toolType)}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {groupNodes.length}
                          </Badge>
                        </button>

                        {/* Group Items */}
                        {isExpanded && (
                          <div className="divide-y divide-border">
                            {groupNodes.map((node) => {
                              const connected = getConnectedWorksheets(node.id);
                              const NodeIcon = TOOL_ICONS[node.toolType] || FileText;

                              return (
                                <div key={node.id} className={cn("p-3 pl-10 hover:bg-muted/20 transition-colors", selectedNodeId === node.id && "bg-primary/10 border-l-2 border-l-primary")}>
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <button
                                        onClick={() => handleNodeClick(node.id, node.toolType)}
                                        className={cn("font-medium text-left hover:text-primary transition-colors truncate block w-full", selectedNodeId === node.id && "text-primary")}
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
                                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors"
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
              <p className="text-xs text-t3">
                Click any node to open that worksheet. Hover to highlight
                connected items. Connections are created when you link
                worksheets together using the "Link" buttons in each tool.
              </p>
            </GlassPanel>
          </div>
        </div>

        {/* Create Entity Modal (for mind map) */}
        <CreateEntityModal
          open={showCreateEntity}
          onClose={() => { setShowCreateEntity(false); setCreateEntityParentId(null); }}
          onSubmit={handleCreateEntity}
          worldId={resolvedWorldId}
        />
    </>
  );

  if (isInWorldLayout) {
    return <div className="sf-tool-content">{connectionsContent}</div>;
  }

  return (
    <div className="relative min-h-screen bg-background sf-atmosphere">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {connectionsContent}
      </main>
    </div>
  );
};

export default WorldConnections;
