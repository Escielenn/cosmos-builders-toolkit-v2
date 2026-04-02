import { useCallback, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { Layers, LayoutGrid } from "lucide-react";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { useWorldOutline } from "@/hooks/use-world-outline";
import { useCreateEntry } from "@/hooks/use-world-entries";
import { useCreateConnection, useDeleteConnection } from "@/hooks/use-world-connections";
import type { WorldElement } from "@/services/world-data";

const KnowledgeGraphView = lazy(
  () => import("@/components/outline/KnowledgeGraphView")
);

const WorldGraph = () => {
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();
  const layoutContext = useWorldLayoutContext();
  const resolvedWorldId = layoutContext?.worldId ?? worldId ?? "";

  const { layers, entries, connections, isLoading, error } =
    useWorldOutline(resolvedWorldId);

  const createEntry = useCreateEntry(resolvedWorldId || undefined);
  const createConnection = useCreateConnection(resolvedWorldId || undefined);
  const deleteConnection = useDeleteConnection(resolvedWorldId || undefined);

  const [entriesOnly, setEntriesOnly] = useState(false);

  const allElements = useMemo(() => {
    return layers.flatMap((l) => l.elements);
  }, [layers]);

  // When entriesOnly, show only entries (filter out worksheets without linked entries)
  const filteredElements = useMemo(() => {
    if (!entriesOnly) return allElements;
    return [];
  }, [allElements, entriesOnly]);

  const filteredEntries = useMemo(() => {
    return entries;
  }, [entries]);

  // Filter connections to only those between visible nodes
  const filteredConnections = useMemo(() => {
    if (!entriesOnly) return connections;
    const entryIds = new Set(entries.map((e) => e.id));
    return connections.filter(
      (c) =>
        (c.source_entry_id && entryIds.has(c.source_entry_id)) ||
        (c.target_entry_id && entryIds.has(c.target_entry_id))
    );
  }, [connections, entries, entriesOnly]);

  const handleElementClick = useCallback(
    (element: WorldElement) => {
      if (element.kind === "worksheet" && element.toolType) {
        navigate(
          `/worlds/${resolvedWorldId}/tools/${element.toolType}?worksheetId=${element.id}`
        );
      }
    },
    [navigate, resolvedWorldId]
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

  const handleCreateEntry = useCallback(
    (input: { title: string; entryType: string }) => {
      createEntry.mutate({
        title: input.title,
        entryType: input.entryType as "note" | "milestone" | "decision" | "reference" | "lore",
      });
    },
    [createEntry]
  );

  if (!resolvedWorldId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/50">
          No world selected.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs uppercase tracking-wider text-destructive/60">
          Graph unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Title + description */}
      <div className="absolute top-3 left-3 z-10 max-w-xs pointer-events-none">
        <p className="font-heading text-[10px] uppercase tracking-[2px] text-tier-3">
          Knowledge Graph
        </p>
        <p className="text-[9px] text-tier-4 font-sans normal-case tracking-normal mt-0.5">
          Visualize entities and their relationships across your world
        </p>
      </div>

      {/* Entries-only toggle */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        <button
          onClick={() => setEntriesOnly(false)}
          className={`flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[1.5px] transition-colors ${
            !entriesOnly
              ? "bg-teal/10 border border-teal/25 text-teal"
              : "bg-[#0D1117]/90 border border-border/20 text-tier-4 hover:text-tier-3"
          }`}
          title="Show all elements"
        >
          <Layers className="w-3 h-3" />
          All
        </button>
        <button
          onClick={() => setEntriesOnly(true)}
          className={`flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[1.5px] transition-colors ${
            entriesOnly
              ? "bg-teal/10 border border-teal/25 text-teal"
              : "bg-[#0D1117]/90 border border-border/20 text-tier-4 hover:text-tier-3"
          }`}
          title="Show entries only"
        >
          <LayoutGrid className="w-3 h-3" />
          Entries
        </button>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader size="sm" />
          </div>
        }
      >
        <KnowledgeGraphView
          elements={filteredElements}
          entries={filteredEntries}
          connections={filteredConnections}
          worldId={resolvedWorldId}
          onElementClick={handleElementClick}
          onCreateConnection={handleCreateConnection}
          onDeleteConnection={handleDeleteConnection}
          onCreateEntry={handleCreateEntry}
        />
      </Suspense>
    </div>
  );
};

export default WorldGraph;
