import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Network, ExternalLink } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorlds } from "@/hooks/use-worlds";
import { useWorldGraph } from "@/hooks/use-world-graph";
import {
  WorldConnectionsGraph,
  ConnectionLegend,
  DrakeContextCard,
} from "@/components/connections";
// Tool routes for navigation
const TOOL_ROUTES: Record<string, string> = {
  "planetary-profile": "/tools/planetary-profile",
  "evolutionary-biology": "/tools/evolutionary-biology",
  "xenomythology-framework-builder": "/tools/xenomythology-framework-builder",
  "environmental-chain-reaction": "/tools/environmental-chain-reaction",
  "spacecraft-designer": "/tools/spacecraft-designer",
  "propulsion-consequences-map": "/tools/propulsion-consequences-map",
  "drake-equation-calculator": "/tools/drake-equation-calculator",
};

const WorldConnections = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { worlds } = useWorlds();
  const { nodes, edges, isLoading } = useWorldGraph(worldId);

  const world = worlds.find((w) => w.id === worldId);

  const handleNodeClick = (nodeId: string, toolType: string) => {
    const route = TOOL_ROUTES[toolType];
    if (route) {
      navigate(`${route}?worldId=${worldId}&worksheetId=${nodeId}`);
    }
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
                {nodes.length} worksheets
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {edges.length} connections
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Graph */}
          <GlassPanel className="xl:col-span-3 p-4 md:p-6 min-h-[600px]">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Loading connections...</p>
                </div>
              </div>
            ) : (
              <WorldConnectionsGraph
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                width={900}
                height={600}
              />
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
