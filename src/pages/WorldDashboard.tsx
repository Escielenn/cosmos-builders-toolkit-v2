import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Globe, FileText, Rocket, Zap, Trash2, MoreVertical, Calculator, Plus, Sparkles, Pencil, ChevronRight, Dna, Network, Sun, Crown, Cpu, Users, Download, Layers, BookOpen, Atom, Clock, Archive, Tag, Orbit, Languages, Weight, Eye, Camera } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { CosmicTelemetry } from "@/components/layout/CosmicVelocityTicker";
import { EPOCH_DATA } from "@/lib/cosmic-telemetry";
import TagBadge from "@/components/tags/TagBadge";
import TagInput from "@/components/tags/TagInput";
import { getTagColor } from "@/hooks/use-tags";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorld } from "@/hooks/use-world";
import { useWorksheets, useRenameWorksheet } from "@/hooks/use-worksheets";
import { Badge } from "@/components/ui/badge";
import { useWorlds } from "@/hooks/use-worlds";
import { getToolIcon as getToolSvgIcon } from "@/components/icons/tool-icons";
import { useMyWorldRole } from "@/hooks/use-collaborators";
import { useState, useEffect } from "react";
import WorldHeader from "@/components/world/WorldHeader";
import WorldNotes from "@/components/world/WorldNotes";
import IconPicker from "@/components/world/IconPicker";
import HeaderImageUpload from "@/components/world/HeaderImageUpload";
import WorldExportDialog from "@/components/world/WorldExportDialog";
import HierarchicalExportDialog from "@/components/world/HierarchicalExportDialog";
import WorldBibleDialog from "@/components/world/WorldBibleDialog";
import WorldSnapshotDialog from "@/components/world/WorldSnapshotDialog";
import VersionHistory from "@/components/world/VersionHistory";
import WorldOutline from "@/components/outline/WorldOutline";
import { useIsWorldLayout } from "@/contexts/WorldLayoutContext";
import { PageBursts } from "@/components/ui/data-burst";
import { WORLD_DASHBOARD_BURSTS } from "@/lib/data-bursts";
const TOOLS = [
  {
    id: "environmental-chain-reaction",
    name: "Cascade: Environmental Chain Reaction",
    description: "Explore how a single planetary parameter cascades through multiple levels",
    icon: Globe,
    path: "/tools/environmental-chain-reaction",
  },
  {
    id: "spacecraft-designer",
    name: "Vessel: Lived-In Spacecraft Designer",
    description: "Design lived-in spacecraft with rich history and culture",
    icon: Rocket,
    path: "/tools/spacecraft-designer",
  },
  {
    id: "propulsion-consequences-map",
    name: "Impulse: Propulsion Consequences",
    description: "Map out the societal consequences of your propulsion technology",
    icon: Zap,
    path: "/tools/propulsion-consequences-map",
  },
  {
    id: "planetary-profile",
    name: "Genesis: Planetary Profile",
    description: "Define your world's stellar environment, physical characteristics, and habitability",
    icon: Globe,
    path: "/tools/planetary-profile",
  },
  {
    id: "space-expansion-modeler",
    name: "Exodus: Space Expansion Modeler",
    description: "Model how competing forces shape expansion beyond Earth",
    icon: Orbit,
    path: "/tools/space-expansion-modeler",
  },
  {
    id: "drake-equation-calculator",
    name: "Signal: Drake Equation Calculator",
    description: "Calculate the number of civilizations in your galaxy",
    icon: Calculator,
    path: "/tools/drake-equation-calculator",
  },
  {
    id: "xenomythology-framework-builder",
    name: "Mythos: Xenomythology Framework",
    description: "Create alien mythological systems derived from species biology",
    icon: Sparkles,
    path: "/tools/xenomythology-framework-builder",
  },
  {
    id: "evolutionary-biology",
    name: "Phylo: Evolutionary Biology",
    description: "Design biologically plausible alien species from evolutionary pressures",
    icon: Dna,
    path: "/tools/evolutionary-biology",
  },
  {
    id: "star-system-builder",
    name: "Orrery: Star System Builder",
    description: "Design multi-planet systems with stellar relationships and orbital mechanics",
    icon: Sun,
    path: "/tools/star-system-builder",
  },
  {
    id: "empire-designer",
    name: "Dominion: Empire Designer",
    description: "Create political structures, governance systems, and internal factions",
    icon: Crown,
    path: "/tools/empire-designer",
  },
  {
    id: "technology-consequences",
    name: "Paradigm: Technology Consequences",
    description: "Map how any technology cascades through society, economy, and culture",
    icon: Cpu,
    path: "/tools/technology-consequences",
  },
  {
    id: "species-interaction-matrix",
    name: "Symbiosis: Species Interaction Matrix",
    description: "Define complex relationships between multiple alien species",
    icon: Users,
    path: "/tools/species-interaction-matrix",
  },
  {
    id: "one-big-lie",
    name: "Axiom: The One Big Lie",
    description: "Declare your single physics violation and trace its consequences",
    icon: Atom,
    path: "/tools/one-big-lie",
  },
  {
    id: "time-dilation",
    name: "Paradox: Time Dilation Calculator",
    description: "Calculate relativistic time dilation for interstellar journeys",
    icon: Clock,
    path: "/tools/time-dilation",
  },
  {
    id: "habitable-zone-calculator",
    name: "Goldilocks: Habitable Zone Calculator",
    description: "Calculate habitable zone boundaries for any star",
    icon: Sun,
    path: "/tools/habitable-zone-calculator",
  },
  {
    id: "lexdrift",
    name: "Lexdrift: Language Evolution",
    description: "Model how languages evolve during interstellar travel",
    icon: Languages,
    path: "/tools/lexdrift",
  },
  {
    id: "surface-gravity-calculator",
    name: "Atlas: Surface Gravity Calculator",
    description: "Calculate surface gravity and trace how weight shapes your world",
    icon: Weight,
    path: "/tools/surface-gravity-calculator",
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Plot events across deep time with multi-track timelines",
    icon: Clock,
    path: "/tools/timeline",
  },
  {
    id: "sensorium",
    name: "Sensorium: Alien Sensory Systems",
    description: "Design evolutionarily plausible sensory systems for alien species",
    icon: Eye,
    path: "/tools/sensorium",
  },
  {
    id: "gravitas",
    name: "Gravitas: Gravity Simulator",
    description: "Calculate gravity conditions on spacecraft, habitats, and planetary surfaces",
    icon: Weight,
    path: "/tools/gravitas",
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
  const isInWorldLayout = useIsWorldLayout();
  const { data: world, isLoading: worldLoading, error: worldError } = useWorld(worldId);
  const { worksheets, isLoading: worksheetsLoading, deleteWorksheet } = useWorksheets(worldId);
  const { deleteWorld, updateWorld, archiveWorld } = useWorlds();
  const renameWorksheet = useRenameWorksheet();
  const { data: role } = useMyWorldRole(worldId);
  const isOwner = role === "owner";
  const canEdit = role === "owner" || role === "editor";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState<string | null>(null);
  const [worksheetToRename, setWorksheetToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [viewExportDialogOpen, setViewExportDialogOpen] = useState(false);
  const [worldBibleDialogOpen, setWorldBibleDialogOpen] = useState(false);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("globe");
  const [editHeaderImageUrl, setEditHeaderImageUrl] = useState<string | null>(null);
  const [editHeaderImageFocusY, setEditHeaderImageFocusY] = useState<number>(50);

  // Group worksheets by tool type
  const worksheetsByType = worksheets.reduce((acc, worksheet) => {
    const type = worksheet.tool_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(worksheet);
    return acc;
  }, {} as Record<string, typeof worksheets>);

  // Sync edit form with world data
  useEffect(() => {
    if (world) {
      setEditName(world.name);
      setEditDescription(world.description || "");
      setEditIcon(world.icon || "globe");
      setEditHeaderImageUrl(world.header_image_url);
      setEditHeaderImageFocusY(world.header_image_focus_y ?? 50);
    }
  }, [world]);

  const handleDeleteWorld = async () => {
    if (!worldId) return;
    await deleteWorld.mutateAsync(worldId);
    navigate("/");
  };

  const handleArchiveWorld = async () => {
    if (!worldId) return;
    await archiveWorld.mutateAsync(worldId);
    navigate("/");
  };

  const handleDeleteWorksheet = async () => {
    if (!worksheetToDelete) return;
    await deleteWorksheet.mutateAsync(worksheetToDelete);
    setWorksheetToDelete(null);
  };

  const handleRenameWorksheet = async () => {
    if (!worksheetToRename || !renameValue.trim()) return;
    await renameWorksheet.mutateAsync({
      worksheetId: worksheetToRename.id,
      title: renameValue.trim(),
    });
    setWorksheetToRename(null);
    setRenameValue("");
  };

  const openRenameDialog = (id: string, currentTitle: string) => {
    setWorksheetToRename({ id, title: currentTitle });
    setRenameValue(currentTitle);
  };

  const handleEditWorld = async () => {
    if (!worldId || !editName.trim()) return;
    await updateWorld.mutateAsync({
      worldId,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      icon: editIcon,
      header_image_url: editHeaderImageUrl,
      header_image_focus_y: editHeaderImageFocusY,
    });
    setEditDialogOpen(false);
  };

  if (worldLoading) {
    const loadingSkeleton = (
      <>
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-48 w-full mb-8 rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </>
    );

    if (isInWorldLayout) {
      return <div className="sf-tool-content">{loadingSkeleton}</div>;
    }
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">{loadingSkeleton}</main>
      </div>
    );
  }

  if (worldError || !world) {
    const errorContent = (
      <>
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
      </>
    );

    if (isInWorldLayout) {
      return <div className="sf-tool-content">{errorContent}</div>;
    }
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">{errorContent}</main>
      </div>
    );
  }

  const dashboardContent = (
    <>
      <PageBursts bursts={WORLD_DASHBOARD_BURSTS} />
        <PageBursts bursts={WORLD_DASHBOARD_BURSTS} />
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/worlds/${worldId}/connections`}>
                <Network className="w-4 h-4 mr-2" />
                View Connections
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setSnapshotDialogOpen(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Snapshot
            </Button>
            )}
            {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setViewExportDialogOpen(true)}>
              <Layers className="w-4 h-4 mr-2" />
              Export View
            </Button>
            )}
            {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setWorldBibleDialogOpen(true)}>
              <BookOpen className="w-4 h-4 mr-2" />
              World Bible
            </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit World
                </DropdownMenuItem>
                )}
                {canEdit && (
                <DropdownMenuItem onClick={() => setTagsDialogOpen(true)}>
                  <Tag className="w-4 h-4 mr-2" />
                  Edit Tags
                </DropdownMenuItem>
                )}
                {isOwner && (
                <DropdownMenuItem onClick={handleArchiveWorld}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive World
                </DropdownMenuItem>
                )}
                {isOwner && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete World
                </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Collaborator Banner */}
        {!isOwner && role && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span>
              You have <Badge variant="secondary" className="mx-1">{role === "editor" ? "Editor" : "Viewer"}</Badge> access to this world
            </span>
          </div>
        )}

        {/* World Header */}
        <div className="mb-8">
          <WorldHeader
            name={world.name}
            description={world.description}
            headerImageUrl={world.header_image_url}
            headerImageFocusY={world.header_image_focus_y}
            icon={world.icon || "globe"}
            tags={world.tags || []}
            onEditClick={isOwner ? () => setEditDialogOpen(true) : undefined}
            onAddTag={() => setTagsDialogOpen(true)}
            canEdit={canEdit}
          />
          <p className="text-sm text-muted-foreground mt-3 px-1">
            Last updated {format(new Date(world.updated_at), "MMMM d, yyyy")}
          </p>
        </div>

        {/* World Notes */}
        {worldId && (
          <section className="mb-8">
            <WorldNotes worldId={worldId} readOnly={!canEdit} />
          </section>
        )}

        {/* Version History — owner only */}
        {isOwner && worldId && (
          <section className="mb-8">
            <VersionHistory worldId={worldId} worldName={world.name} />
          </section>
        )}

        {/* World Outline */}
        {worldId && (
          <section className="mb-8">
            <WorldOutline worldId={worldId} worldName={world.name} />
          </section>
        )}

        {/* Tools Grid - hidden for viewers */}
        {canEdit && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Worldbuilding Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <Link key={tool.id} to={`${tool.path}?worldId=${worldId}`}>
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const SvgIcon = getToolSvgIcon(tool.id);
                      return SvgIcon ? (
                        <SvgIcon className="w-10 h-10 rounded-sm shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center shrink-0">
                          <tool.icon className="w-5 h-5 text-primary" />
                        </div>
                      );
                    })()}
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
        )}

        {/* Saved Worksheets - Grouped by Tool Type */}
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
              <p className="text-sm text-muted-foreground mb-4">
                Use the tools above to start building your world. Your progress will be saved here.
              </p>
              <CosmicTelemetry
                data={EPOCH_DATA}
                variant="horizontal"
                align="center"
              />
            </GlassPanel>
          ) : (
            <div className="space-y-6">
              {TOOLS.map((tool) => {
                const toolWorksheets = worksheetsByType[tool.id] || [];
                if (toolWorksheets.length === 0) return null;

                const SvgIcon = getToolSvgIcon(tool.id);

                return (
                  <div key={tool.id} className="space-y-3">
                    {/* Tool Type Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {SvgIcon ? (
                          <SvgIcon className="w-6 h-6 rounded-sm" />
                        ) : (
                          <tool.icon className="w-5 h-5 text-primary" />
                        )}
                        <h3 className="font-semibold">{tool.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {toolWorksheets.length}
                        </Badge>
                      </div>
                      {canEdit && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`${tool.path}?worldId=${worldId}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          New
                        </Link>
                      </Button>
                      )}
                    </div>

                    {/* Worksheets for this tool type */}
                    <div className="space-y-2 pl-7">
                      {toolWorksheets.map((worksheet) => (
                        <GlassPanel
                          key={worksheet.id}
                          className="p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-medium truncate">
                                {worksheet.title || "Untitled"}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Updated {format(new Date(worksheet.updated_at), "MMM d, yyyy")}
                              </p>
                              {worksheet.tags && worksheet.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {worksheet.tags.slice(0, 4).map((tag: string) => {
                                    const hash = tag.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                                    return (
                                      <TagBadge key={tag} name={tag} color={getTagColor(hash)} size="sm" />
                                    );
                                  })}
                                  {worksheet.tags.length > 4 && (
                                    <span className="text-xs text-muted-foreground">+{worksheet.tags.length - 4}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`${tool.path}?worldId=${worldId}&worksheetId=${worksheet.id}`}>
                                Open
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                            </Button>
                            {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openRenameDialog(worksheet.id, worksheet.title || "Untitled")}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                {isOwner && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setWorksheetToDelete(worksheet.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                          </div>
                        </GlassPanel>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
    </>
  );

  return (
    <>
      {isInWorldLayout ? (
        <div className="sf-tool-content">{dashboardContent}</div>
      ) : (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="relative container mx-auto px-4 pt-24 pb-16">
            {dashboardContent}
          </main>
        </div>
      )}

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

      {/* Rename Worksheet Dialog */}
      <Dialog open={!!worksheetToRename} onOpenChange={() => setWorksheetToRename(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Worksheet</DialogTitle>
            <DialogDescription>
              Enter a new name for this worksheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-worksheet">Name</Label>
              <Input
                id="rename-worksheet"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter worksheet name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorksheetToRename(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameWorksheet}
              disabled={!renameValue.trim() || renameWorksheet.isPending}
            >
              {renameWorksheet.isPending ? (
                <>
                  <Loader variant="inline" size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit World Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit World</DialogTitle>
            <DialogDescription>
              Update the details for your world.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Header Image */}
            <div className="space-y-2">
              <Label>Header Image</Label>
              <HeaderImageUpload
                currentImageUrl={editHeaderImageUrl}
                onImageChange={(url) => {
                  setEditHeaderImageUrl(url);
                  if (url === null) setEditHeaderImageFocusY(50);
                }}
                focusY={editHeaderImageFocusY}
              />
              {editHeaderImageUrl && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Vertical Position</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{editHeaderImageFocusY}%</span>
                  </div>
                  <Slider
                    value={[editHeaderImageFocusY]}
                    onValueChange={([v]) => setEditHeaderImageFocusY(v)}
                    min={0}
                    max={100}
                    step={1}
                    aria-label="Vertical image position"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Top</span>
                    <span>Center</span>
                    <span>Bottom</span>
                  </div>
                </div>
              )}
            </div>

            {/* Icon and Name Row */}
            <div className="space-y-2">
              <div className="flex gap-4">
                <Label className="w-12 shrink-0 text-center">Icon</Label>
                <Label htmlFor="edit-name">World Name</Label>
              </div>
              <div className="flex items-end gap-4">
                <IconPicker value={editIcon} onChange={setEditIcon} />
                <div className="flex-1">
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter world name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your world..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditWorld}
              disabled={!editName.trim() || updateWorld.isPending}
            >
              {updateWorld.isPending ? (
                <>
                  <Loader variant="inline" size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export World Dialog */}
      <WorldExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        worldName={world.name}
        worldId={worldId!}
      />

      {/* Hierarchical View Export Dialog */}
      <HierarchicalExportDialog
        open={viewExportDialogOpen}
        onOpenChange={setViewExportDialogOpen}
        worldName={world.name}
        worldId={worldId!}
      />

      {/* World Bible Export Dialog */}
      <WorldBibleDialog
        open={worldBibleDialogOpen}
        onOpenChange={setWorldBibleDialogOpen}
        worldName={world.name}
        worldDescription={world.description || undefined}
        worldId={worldId!}
      />

      {/* World Snapshot Dialog */}
      <WorldSnapshotDialog
        open={snapshotDialogOpen}
        onOpenChange={setSnapshotDialogOpen}
        worldName={world.name}
        worldId={worldId!}
      />

      {/* Edit Tags Dialog */}
      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-visible">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit World Tags</DialogTitle>
            <DialogDescription>
              Add tags to organize and categorize your world.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 pb-4">
            <TagInput
              tags={world.tags || []}
              onChange={(newTags) => {
                if (worldId) {
                  updateWorld.mutate({ worldId, tags: newTags });
                }
              }}
              placeholder="Add world tag..."
              maxTags={10}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorldDashboard;
