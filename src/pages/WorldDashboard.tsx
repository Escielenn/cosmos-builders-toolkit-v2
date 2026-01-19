import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Globe, FileText, Rocket, Zap, Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorld } from "@/hooks/use-world";
import { useWorksheets } from "@/hooks/use-worksheets";
import { useWorlds } from "@/hooks/use-worlds";
import { useState } from "react";

const TOOLS = [
  {
    id: "environmental-chain-reaction",
    name: "Environmental Chain Reaction",
    description: "Explore how a single planetary parameter cascades through multiple levels",
    icon: Globe,
    path: "/tools/environmental-chain-reaction",
  },
  {
    id: "spacecraft-designer",
    name: "Spacecraft Designer",
    description: "Design lived-in spacecraft with rich history and culture",
    icon: Rocket,
    path: "/tools/spacecraft-designer",
  },
  {
    id: "propulsion-consequences-map",
    name: "Propulsion Consequences Map",
    description: "Map out the societal consequences of your propulsion technology",
    icon: Zap,
    path: "/tools/propulsion-consequences-map",
  },
];

const getToolName = (toolType: string): string => {
  const tool = TOOLS.find((t) => t.id === toolType);
  return tool?.name || toolType;
};

const getToolIcon = (toolType: string) => {
  const tool = TOOLS.find((t) => t.id === toolType);
  return tool?.icon || FileText;
};

const WorldDashboard = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { data: world, isLoading: worldLoading, error: worldError } = useWorld(worldId);
  const { worksheets, isLoading: worksheetsLoading, deleteWorksheet } = useWorksheets(worldId);
  const { deleteWorld } = useWorlds();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState<string | null>(null);

  const handleDeleteWorld = async () => {
    if (!worldId) return;
    await deleteWorld.mutateAsync(worldId);
    navigate("/");
  };

  const handleDeleteWorksheet = async () => {
    if (!worksheetToDelete) return;
    await deleteWorksheet.mutateAsync(worksheetToDelete);
    setWorksheetToDelete(null);
  };

  if (worldLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (worldError || !world) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <GlassPanel className="p-8 text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">World Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This world doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/">Return to Dashboard</Link>
            </Button>
          </GlassPanel>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* World Header */}
        <GlassPanel className="p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{world.name}</h1>
                {world.description && (
                  <p className="text-muted-foreground mt-1">{world.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Last updated {format(new Date(world.updated_at), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit World
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete World
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </GlassPanel>

        {/* Tools Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Worldbuilding Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <Link key={tool.id} to={`${tool.path}?worldId=${worldId}`}>
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        </section>

        {/* Saved Worksheets */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Saved Worksheets</h2>
          {worksheetsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : worksheets.length === 0 ? (
            <GlassPanel className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">No worksheets yet</h3>
              <p className="text-sm text-muted-foreground">
                Use the tools above to start building your world. Your progress will be saved here.
              </p>
            </GlassPanel>
          ) : (
            <div className="space-y-3">
              {worksheets.map((worksheet) => {
                const ToolIcon = getToolIcon(worksheet.tool_type);
                return (
                  <GlassPanel
                    key={worksheet.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <ToolIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {worksheet.title || getToolName(worksheet.tool_type)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Updated {format(new Date(worksheet.updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/tools/${worksheet.tool_type}?worldId=${worldId}&worksheetId=${worksheet.id}`}>
                          Open
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setWorksheetToDelete(worksheet.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Delete World Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete World</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{world.name}"? This will also delete all worksheets
              associated with this world. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorld}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Worksheet Dialog */}
      <AlertDialog open={!!worksheetToDelete} onOpenChange={() => setWorksheetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worksheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this worksheet? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorksheet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorldDashboard;
