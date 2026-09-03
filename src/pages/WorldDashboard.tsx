import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, Edit, Globe, FileText, Rocket, Zap, Trash2, MoreVertical, Calculator, Plus, Sparkles, Pencil, ChevronRight, Dna, Network, Sun, Crown, Cpu, Users, Download, Layers, BookOpen, Atom, Clock, Archive, Tag, Orbit, Languages, Weight, Eye, Camera, Palette, Library, GripVertical, PenLine } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { CosmicTelemetry } from "@/components/layout/CosmicVelocityTicker";
import CascadeProgressBar from "@/components/dashboard/CascadeProgressBar";
import GuidedFirstWorld from "@/components/dashboard/GuidedFirstWorld";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// AlertDialog imports removed, using DeleteConfirmDialog instead
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorld } from "@/hooks/use-world";
import { useWorksheets, useRenameWorksheet } from "@/hooks/use-worksheets";
import { Badge } from "@/components/ui/badge";
import { useWorlds } from "@/hooks/use-worlds";
import { getToolIcon as getToolSvgIcon } from "@/components/icons/tool-icons";
import { useMyWorldRole } from "@/hooks/use-collaborators";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useToolOrder } from "@/hooks/use-tool-order";
import WorldHeader from "@/components/world/WorldHeader";
import WorldNotes from "@/components/world/WorldNotes";
import IconPicker from "@/components/world/IconPicker";
import HeaderImageUpload from "@/components/world/HeaderImageUpload";
import WorldExportDialog from "@/components/world/WorldExportDialog";
import HierarchicalExportDialog from "@/components/world/HierarchicalExportDialog";
import WorldBibleDialog from "@/components/world/WorldBibleDialog";
import WorldSnapshotDialog from "@/components/world/WorldSnapshotDialog";
import WorldAppearanceDialog from "@/components/world/WorldAppearanceDialog";
import VersionHistory from "@/components/world/VersionHistory";
import EntityPickerDialog from "@/components/world/EntityPickerDialog";
import CreateElementDialog from "@/components/world/CreateElementDialog";
import { FLAGS } from "@/lib/feature-flags";
import { useWorldEntities } from "@/hooks/use-world-entities";
import { ENTITY_TYPE_LABELS } from "@/lib/entity-config";
import { useIsWorldLayout } from "@/contexts/WorldLayoutContext";
import { PageBursts } from "@/components/ui/data-burst";
import { WORLD_DASHBOARD_BURSTS } from "@/lib/data-bursts";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useMetaTags } from "@/hooks/use-meta-tags";
import RecentActivity from "@/components/world/RecentActivity";
// Secondary panels, collapsed into a single rail. Ordered by how often a
// writer reaches for them when opening a world.
const DRAWERS: { id: string; label: string; ownerOnly?: boolean }[] = [
  { id: "worksheets", label: "Worksheets" },
  { id: "elements", label: "Elements" },
  { id: "build", label: "Build" },
  { id: "notes", label: "Notes" },
  { id: "history", label: "History", ownerOnly: true },
];

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
  {
    id: "kardashev-scale",
    name: "K-Scale: Kardashev Scale Calculator",
    description: "Classify civilizations by energy consumption with cascade implications",
    icon: Zap,
    path: "/tools/kardashev-scale",
  },
];

const DEFAULT_TOOL_ORDER = TOOLS.map((t) => t.id);
const TOOLS_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

// Sortable tool card for the grid
const SortableToolCard = ({ tool, worldId }: { tool: typeof TOOLS[number]; worldId: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tool.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const SvgIcon = getToolSvgIcon(tool.id);

  return (
    <div ref={setNodeRef} style={style} className="group/card relative">
      <button
        type="button"
        className="absolute top-2 right-2 z-10 p-1 cursor-grab active:cursor-grabbing text-t4 opacity-0 group-hover/card:opacity-100 transition-opacity touch-none"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Link to={`${tool.path}?worldId=${worldId}`}>
        <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-start gap-3">
            {SvgIcon ? (
              <SvgIcon className="w-10 h-10 rounded-sm shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center shrink-0">
                <tool.icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-medium">{tool.name}</h3>
              <p className="text-sm text-t3 mt-1">{tool.description}</p>
            </div>
          </div>
        </GlassPanel>
      </Link>
    </div>
  );
};

// Sortable worksheet group
const SortableWorksheetGroup = ({
  tool,
  worksheets: toolWorksheets,
  worldId,
  canEdit,
  isOwner,
  worksheetEntryMap,
  onRename,
  onDelete,
}: {
  tool: typeof TOOLS[number];
  worksheets: any[];
  worldId: string;
  canEdit: boolean;
  isOwner: boolean;
  worksheetEntryMap: Map<string, string>;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tool.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const SvgIcon = getToolSvgIcon(tool.id);

  return (
    <div ref={setNodeRef} style={style} className="space-y-3 group/wsgroup">
      {/* Tool Type Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-0.5 cursor-grab active:cursor-grabbing text-t4 opacity-0 group-hover/wsgroup:opacity-100 transition-opacity touch-none"
            {...attributes}
            {...listeners}
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {SvgIcon ? (
            <SvgIcon className="w-6 h-6 rounded-sm" />
          ) : (
            <tool.icon className="w-5 h-5 text-primary" />
          )}
          <h3 className="font-medium">{tool.name}</h3>
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
        {toolWorksheets.map((worksheet: any) => (
          <GlassPanel
            key={worksheet.id}
            className="p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-4 h-4 text-t3 shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium truncate">
                  {worksheet.title || "Untitled"}
                </h4>
                <p className="text-xs text-t3">
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
                      <span className="text-xs text-t3">+{worksheet.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {worksheetEntryMap.get(worksheet.id) && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Wiki page">
                  <Link to={`/worlds/${worldId}/codex/${worksheetEntryMap.get(worksheet.id)}`}>
                    <BookOpen className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${tool.path}?worldId=${worldId}&worksheetId=${worksheet.id}`}>
                  Open
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Worksheet actions">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRename(worksheet.id, worksheet.title || "Untitled")}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    {isOwner && (
                      <DropdownMenuItem
                        className="text-sf-crimson"
                        onClick={() => onDelete(worksheet.id, worksheet.title || "Untitled")}
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
};

// Drag overlay preview for tool cards
const ToolDragPreview = ({ tool }: { tool: typeof TOOLS[number] }) => {
  const SvgIcon = getToolSvgIcon(tool.id);
  return (
    <div className="bg-sf-surface-elevated border border-primary shadow-lg shadow-primary/10 p-4 flex items-center gap-3 max-w-xs">
      {SvgIcon ? (
        <SvgIcon className="w-8 h-8 rounded-sm shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-sm bg-primary/20 flex items-center justify-center shrink-0">
          <tool.icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <span className="font-medium text-sm truncate">{tool.name}</span>
    </div>
  );
};

const WorldDashboard = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const notesRef = useRef<HTMLElement>(null);
  const isInWorldLayout = useIsWorldLayout();
  const { toast } = useToast();
  const { data: world, isLoading: worldLoading, error: worldError } = useWorld(worldId);
  useMetaTags({ title: world?.name || "World Dashboard" });
  const { worksheets, isLoading: worksheetsLoading, deleteWorksheet } = useWorksheets(worldId);
  const { deleteWorld, updateWorld, archiveWorld, unarchiveWorld } = useWorlds();
  const renameWorksheet = useRenameWorksheet();
  const { data: role } = useMyWorldRole(worldId);
  const isOwner = role === "owner";
  const canEdit = role === "owner" || role === "editor";

  // Drag-and-drop tool ordering
  const { order: toolOrder, reorder: reorderTools } = useToolOrder(worldId, DEFAULT_TOOL_ORDER);
  const orderedTools = useMemo(
    () => toolOrder.map((id) => TOOLS_BY_ID[id]).filter(Boolean),
    [toolOrder]
  );
  const [draggingToolId, setDraggingToolId] = useState<string | null>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleToolDragStart = useCallback((event: DragStartEvent) => {
    setDraggingToolId(event.active.id as string);
  }, []);

  const handleToolDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingToolId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const fromIndex = toolOrder.indexOf(active.id as string);
        const toIndex = toolOrder.indexOf(over.id as string);
        if (fromIndex !== -1 && toIndex !== -1) {
          reorderTools(fromIndex, toIndex);
        }
      }
    },
    [toolOrder, reorderTools]
  );

  const handleToolDragCancel = useCallback(() => {
    setDraggingToolId(null);
  }, []);

  // Build worksheetId → entryId map for wiki links
  const entryMapQuery = useQuery({
    queryKey: ["worksheet-entry-map", worldId],
    queryFn: async () => {
      const { data } = await supabase
        .from("world_entries")
        .select("id, tool_data_id")
        .eq("world_id", worldId!)
        .not("tool_data_id", "is", null);
      const map = new Map<string, string>();
      for (const e of data || []) {
        if (e.tool_data_id) map.set(e.tool_data_id, e.id);
      }
      return map;
    },
    enabled: !!worldId,
  });
  const worksheetEntryMap = entryMapQuery.data ?? new Map<string, string>();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState<{ id: string; title: string } | null>(null);
  const [worksheetToRename, setWorksheetToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [viewExportDialogOpen, setViewExportDialogOpen] = useState(false);
  const [worldBibleDialogOpen, setWorldBibleDialogOpen] = useState(false);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`sf-world-drawer-${worldId}`) || null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (openDrawer) localStorage.setItem(`sf-world-drawer-${worldId}`, openDrawer);
      else localStorage.removeItem(`sf-world-drawer-${worldId}`);
    } catch { /* storage unavailable */ }
  }, [openDrawer, worldId]);
  const [appearanceDialogOpen, setAppearanceDialogOpen] = useState(false);
  const [entityPickerOpen, setEntityPickerOpen] = useState(false);
  const { entities: worldEntities, grouped: entitiesByType } = useWorldEntities(worldId);
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

  // Scroll to notes section when navigating with #notes hash
  useEffect(() => {
    if (location.hash === "#notes" && notesRef.current) {
      notesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  const handleDeleteWorld = async () => {
    if (!worldId) return;
    await deleteWorld.mutateAsync(worldId);
    navigate("/");
  };

  const handleArchiveWorld = async () => {
    if (!worldId) return;
    await archiveWorld.mutateAsync(worldId);
    toast({
      title: "World archived",
      description: `"${world?.name}" has been moved to your archive.`,
      action: (
        <ToastAction
          altText="Undo archive"
          onClick={() => {
            unarchiveWorld.mutate(worldId);
          }}
        >
          Undo
        </ToastAction>
      ),
    });
    navigate("/");
  };

  const handleDeleteWorksheet = async () => {
    if (!worksheetToDelete) return;
    await deleteWorksheet.mutateAsync(worksheetToDelete.id);
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
          className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-[0.2em] font-medium text-t3 hover:text-sf-primary-bright transition-colors duration-base mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Bridge
        </Link>
        <GlassPanel className="p-12 text-center">
          <p className="font-mono text-[12px] tracking-[0.18em] text-sf-crimson uppercase mb-4">// STATUS: UNREACHABLE</p>
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-sf-title uppercase text-t1 mb-4">WORLD NOT FOUND</h1>
          <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-t3 mb-6">
            RECORD DOES NOT EXIST OR CLEARANCE INSUFFICIENT.
          </p>
          <Button variant="sf-primary" size="sf-md" asChild>
            <Link to="/">Return to Bridge</Link>
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
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-[0.2em] font-medium text-t3 hover:text-sf-primary-bright transition-colors duration-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Bridge
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link to={`/worlds/${worldId}/write`}>
                <PenLine className="w-4 h-4 mr-2" />
                Write
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/worlds/${worldId}/wiki`}>
                <Library className="w-4 h-4 mr-2" />
                Wiki
              </Link>
            </Button>
            {/* One Export control. Export, Export View, World Bible and
                Snapshot used to sit here as four peer buttons, reading as four
                unrelated features rather than four ways to get data out. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-[12px] uppercase tracking-[1.5px] text-t3 font-medium">
                  Export
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export world…
                </DropdownMenuItem>
                {isOwner && (
                  <DropdownMenuItem onClick={() => setViewExportDialogOpen(true)}>
                    <Layers className="w-4 h-4 mr-2" />
                    Export current view…
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem onClick={() => setWorldBibleDialogOpen(true)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    World Bible…
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSnapshotDialogOpen(true)}>
                      <Camera className="w-4 h-4 mr-2" />
                      Take a snapshot
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" aria-label="World actions">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={`/worlds/${worldId}/connections`}>
                    <Network className="w-4 h-4 mr-2" />
                    Connections
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/worlds/${worldId}/showcase`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Showcase
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isOwner && (
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit World
                </DropdownMenuItem>
                )}
                {isOwner && (
                <DropdownMenuItem onClick={() => setAppearanceDialogOpen(true)}>
                  <Palette className="w-4 h-4 mr-2" />
                  Appearance
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
                  className="text-sf-crimson"
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
          <div className="mb-4 p-3 rounded-none bg-primary/5 border border-primary flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span>
              You have <Badge variant="secondary" className="mx-1">{role === "editor" ? "Editor" : "Viewer"}</Badge> access to this world
            </span>
          </div>
        )}

        {/* Theme Cover Image */}
        {world.theme?.cover_image_url && (
          <div className="relative w-full h-[200px] mb-6 overflow-hidden">
            <img
              src={world.theme.cover_image_url}
              alt={world.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-background to-transparent" />
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
          <div className="flex items-center gap-3 mt-3 px-1">
            <p className="text-sm text-t3">
              Last updated {format(new Date(world.updated_at), "MMMM d, yyyy")}
            </p>
            {worksheets.length > 0 && (
              <CascadeProgressBar
                worksheetToolTypes={worksheets.map((w) => w.tool_type)}
              />
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {worldId && <RecentActivity worldId={worldId} />}

        {/* ── Drawers ────────────────────────────────────────────────
            Opening a world should answer "where was I, and what next?".
            These five panels used to stack on one page — roughly a thousand
            pixels of chrome, the tool grid alone contributing 21 cards, with
            World Elements and Saved Worksheets both duplicating what the Codex
            sidebar already navigates. One opens at a time; nothing was removed,
            and the choice persists per world. */}
        <div className="mb-8 flex flex-wrap items-center gap-1 border-y border-sf-line-interactive py-2">
          {DRAWERS.filter((d) => !d.ownerOnly || isOwner).map((d) => (
            <button
              key={d.id}
              onClick={() => setOpenDrawer((cur) => (cur === d.id ? null : d.id))}
              aria-expanded={openDrawer === d.id}
              className={`px-3 py-1.5 font-serif text-[15px] italic transition-colors ${
                openDrawer === d.id ? "text-sf-primary-text" : "text-t3 hover:text-t1"
              }`}
            >
              {d.label}
            </button>
          ))}
          {openDrawer && (
            <button
              onClick={() => setOpenDrawer(null)}
              className="ml-auto px-2 py-1.5 font-serif text-[13px] italic text-t4 hover:text-t2"
            >
              Close
            </button>
          )}
        </div>

        {/* World Notes */}
        {worldId && openDrawer === "notes" && (
          <section id="notes" ref={notesRef} className="mb-8">
            <WorldNotes worldId={worldId} readOnly={!canEdit} />
          </section>
        )}

        {/* Version History, owner only */}
        {isOwner && worldId && openDrawer === "history" && (
          <section className="mb-8">
            <VersionHistory worldId={worldId} worldName={world.name} />
          </section>
        )}

        {/* World Elements, entity-first entries */}
        {worldId && openDrawer === "elements" && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">World Elements</h2>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEntityPickerOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Element
                </Button>
              )}
            </div>

            {worldEntities.length === 0 ? (
              <GlassPanel className="p-6 text-center">
                <p className="text-sm text-t3/40 italic">
                  No elements yet. Create planets, species, factions, and more, then attach worksheets to them.
                </p>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setEntityPickerOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Element
                  </Button>
                )}
              </GlassPanel>
            ) : (
              <div className="space-y-3">
                {Object.entries(entitiesByType).map(([type, entries]) => (
                  <div key={type}>
                    <h3 className="font-heading text-xs font-light uppercase tracking-[2px] text-t3 mb-2">
                      {ENTITY_TYPE_LABELS[type] ?? type}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {entries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/worlds/${worldId}/codex/${entry.id}`}
                        >
                          <GlassPanel className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-sm text-t2 group-hover:text-t1 transition-colors truncate">
                                {entry.title}
                              </span>
                            </div>
                            {(entry.metadata as Record<string, unknown>)?.description && (
                              <p className="text-[12px] text-t4 mt-1 line-clamp-1">
                                {String((entry.metadata as Record<string, unknown>).description)}
                              </p>
                            )}
                          </GlassPanel>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {openDrawer === "build" && (<>
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Worldbuilding Tools</h2>
          <DndContext
            sensors={dndSensors}
            collisionDetection={closestCenter}
            onDragStart={handleToolDragStart}
            onDragEnd={handleToolDragEnd}
            onDragCancel={handleToolDragCancel}
          >
            <SortableContext items={toolOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderedTools.map((tool) => (
                  <SortableToolCard key={tool.id} tool={tool} worldId={worldId!} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
              {draggingToolId && TOOLS_BY_ID[draggingToolId] ? (
                <ToolDragPreview tool={TOOLS_BY_ID[draggingToolId]} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </section></>)}

        {openDrawer === "worksheets" && (<>
        <section>
          <h2 className="text-xl font-medium mb-4">Saved Worksheets</h2>
          {worksheetsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : worksheets.length === 0 ? (
            <GuidedFirstWorld worldId={worldId!} />
          ) : (
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={handleToolDragStart}
              onDragEnd={handleToolDragEnd}
              onDragCancel={handleToolDragCancel}
            >
              <SortableContext
                items={toolOrder.filter((id) => (worksheetsByType[id] || []).length > 0)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  {orderedTools.map((tool) => {
                    const toolWorksheets = worksheetsByType[tool.id] || [];
                    if (toolWorksheets.length === 0) return null;
                    return (
                      <SortableWorksheetGroup
                        key={tool.id}
                        tool={tool}
                        worksheets={toolWorksheets}
                        worldId={worldId!}
                        canEdit={canEdit}
                        isOwner={isOwner}
                        worksheetEntryMap={worksheetEntryMap}
                        onRename={openRenameDialog}
                        onDelete={(id, title) => setWorksheetToDelete({ id, title })}
                      />
                    );
                  })}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {draggingToolId && TOOLS_BY_ID[draggingToolId] ? (
                  <ToolDragPreview tool={TOOLS_BY_ID[draggingToolId]} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </section></>)}
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
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={world.name}
        itemType="world"
        onConfirm={handleDeleteWorld}
        isDeleting={deleteWorld.isPending}
      />

      {/* Delete Worksheet Dialog */}
      <DeleteConfirmDialog
        open={!!worksheetToDelete}
        onOpenChange={(open) => { if (!open) setWorksheetToDelete(null); }}
        itemName={worksheetToDelete?.title ?? "Untitled"}
        itemType="worksheet"
        onConfirm={handleDeleteWorksheet}
        isDeleting={deleteWorksheet.isPending}
      />

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
                    <Label className="text-xs text-t3">Vertical Position</Label>
                    <span className="text-xs text-t3 tabular-nums">{editHeaderImageFocusY}%</span>
                  </div>
                  <Slider
                    value={[editHeaderImageFocusY]}
                    onValueChange={([v]) => setEditHeaderImageFocusY(v)}
                    min={0}
                    max={100}
                    step={1}
                    aria-label="Vertical image position"
                  />
                  <div className="flex justify-between text-[12px] text-t3">
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

      <WorldAppearanceDialog
        open={appearanceDialogOpen}
        onOpenChange={setAppearanceDialogOpen}
        worldId={worldId!}
        currentTheme={world.theme}
      />

      {worldId && (
        FLAGS.UNIFIED_ENTITIES ? (
          <CreateElementDialog
            open={entityPickerOpen}
            onOpenChange={setEntityPickerOpen}
            worldId={worldId}
          />
        ) : (
          <EntityPickerDialog
            open={entityPickerOpen}
            onOpenChange={setEntityPickerOpen}
            worldId={worldId}
          />
        )
      )}

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
