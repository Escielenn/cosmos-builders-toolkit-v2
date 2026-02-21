import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import ViewToggle, { type OutlineView } from "./ViewToggle";
import FrameworkSpineView from "./FrameworkSpineView";
import FreeformTreeView from "./FreeformTreeView";
import { useWorldOutline } from "@/hooks/use-world-outline";
import { useCreateEntry, useUpdateEntry, useDeleteEntry, useMoveEntry } from "@/hooks/use-world-entries";
import { useCreateConnection, useDeleteConnection } from "@/hooks/use-world-connections";
import type { WorldElement } from "@/services/world-data";

// Lazy-load the heavy graph view
const KnowledgeGraphView = lazy(
  () => import("./KnowledgeGraphView")
);

// ---------------------------------------------------------------------------
// Tool navigation mapping
// ---------------------------------------------------------------------------

const TOOL_ROUTES: Record<string, string> = {
  "planetary-profile": "/tools/planetary-profile",
  "environmental-chain-reaction": "/tools/environmental-chain-reaction",
  "spacecraft-designer": "/tools/spacecraft-designer",
  "propulsion-consequences-map": "/tools/propulsion-consequences-map",
  "drake-equation-calculator": "/tools/drake-equation-calculator",
  "xenomythology-framework-builder": "/tools/xenomythology-framework-builder",
  "evolutionary-biology": "/tools/evolutionary-biology",
  "star-system-builder": "/tools/star-system-builder",
  "empire-designer": "/tools/empire-designer",
  "technology-consequences": "/tools/technology-consequences",
  "species-interaction-matrix": "/tools/species-interaction-matrix",
  "one-big-lie": "/tools/one-big-lie",
  "time-dilation": "/tools/time-dilation",
  "space-expansion-modeler": "/tools/space-expansion-modeler",
  "habitable-zone-calculator": "/tools/habitable-zone-calculator",
  "lexdrift": "/tools/lexdrift",
  "surface-gravity-calculator": "/tools/surface-gravity-calculator",
  "timeline": "/tools/timeline",
  "sensorium": "/tools/sensorium",
  "gravitas": "/tools/gravitas",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorldOutlineProps {
  worldId: string;
  worldName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorldOutline = ({ worldId, worldName }: WorldOutlineProps) => {
  const navigate = useNavigate();

  // Persist view preference
  const [activeView, setActiveView] = useState<OutlineView>(() => {
    try {
      return (localStorage.getItem("sf-outline-view") as OutlineView) || "framework";
    } catch {
      return "framework";
    }
  });

  const handleViewChange = useCallback((view: OutlineView) => {
    setActiveView(view);
    localStorage.setItem("sf-outline-view", view);
  }, []);

  // Data
  const { layers, entries, connections, totalCompletion, isLoading, error } =
    useWorldOutline(worldId);

  // CRUD hooks
  const createEntry = useCreateEntry(worldId);
  const updateEntry = useUpdateEntry(worldId);
  const deleteEntry = useDeleteEntry(worldId);
  const moveEntry = useMoveEntry(worldId);
  const createConnection = useCreateConnection(worldId);
  const deleteConnection = useDeleteConnection(worldId);

  // Flatten all elements for freeform + graph views
  const allElements = useMemo(() => {
    return layers.flatMap((l) => l.elements);
  }, [layers]);

  // Navigation
  const handleElementClick = useCallback(
    (element: WorldElement) => {
      if (element.kind === "worksheet" && element.toolType) {
        const route = TOOL_ROUTES[element.toolType];
        if (route) {
          navigate(`${route}?worldId=${worldId}&worksheetId=${element.id}`);
        }
      }
    },
    [navigate, worldId]
  );

  // Entry CRUD handlers
  const handleAddEntry = useCallback(
    (layerId: string) => {
      createEntry.mutate({
        title: "New Entry",
        entryType: "note",
      });
    },
    [createEntry]
  );

  const handleCreateEntry = useCallback(
    (input: { title: string; entryType: string; parentId?: string | null }) => {
      createEntry.mutate({
        title: input.title,
        entryType: input.entryType as "note" | "milestone" | "decision" | "reference" | "lore",
        parentId: input.parentId,
      });
    },
    [createEntry]
  );

  const handleRenameEntry = useCallback(
    (entryId: string, newTitle: string) => {
      updateEntry.mutate({ entryId, title: newTitle });
    },
    [updateEntry]
  );

  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      deleteEntry.mutate(entryId);
    },
    [deleteEntry]
  );

  const handleMoveEntry = useCallback(
    (entryId: string, newParentId: string | null, newSortOrder: number) => {
      moveEntry.mutate({ entryId, newParentId, newSortOrder });
    },
    [moveEntry]
  );

  const handleCreateConnection = useCallback(
    (input: {
      sourceId: string;
      sourceType: "worksheet" | "entry";
      targetId: string;
      targetType: "worksheet" | "entry";
      connectionType: string;
    }) => {
      createConnection.mutate(input);
    },
    [createConnection]
  );

  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      deleteConnection.mutate(connectionId);
    },
    [deleteConnection]
  );

  // Loading state
  if (isLoading) {
    return (
      <GlassPanel className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader size="sm" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Loading survey data...
          </span>
        </div>
      </GlassPanel>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">
          Survey data unavailable. Retry.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-0">
        <h2 className="font-heading text-[10px] uppercase tracking-[3px] text-muted-foreground mb-2">
          World: {worldName}
        </h2>
      </div>

      {/* View Toggle */}
      <ViewToggle activeView={activeView} onViewChange={handleViewChange} />

      {/* Active View */}
      <div className="min-h-[400px] max-h-[600px]">
        {activeView === "framework" && (
          <FrameworkSpineView
            layers={layers}
            totalCompletion={totalCompletion}
            onElementClick={handleElementClick}
            onAddEntry={handleAddEntry}
          />
        )}

        {activeView === "freeform" && (
          <FreeformTreeView
            elements={allElements}
            entries={entries}
            onElementClick={handleElementClick}
            onCreateEntry={handleCreateEntry}
            onRenameEntry={handleRenameEntry}
            onDeleteEntry={handleDeleteEntry}
            onMoveEntry={handleMoveEntry}
          />
        )}

        {activeView === "graph" && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[400px]">
                <Loader size="sm" />
              </div>
            }
          >
            <KnowledgeGraphView
              elements={allElements}
              entries={entries}
              connections={connections}
              worldId={worldId}
              onElementClick={handleElementClick}
              onCreateConnection={handleCreateConnection}
              onDeleteConnection={handleDeleteConnection}
              onCreateEntry={handleCreateEntry}
            />
          </Suspense>
        )}
      </div>
    </GlassPanel>
  );
};

export default WorldOutline;
