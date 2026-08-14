/** Register: WRITER (Lora) for chrome only; the graph canvas keeps its instrument styling. */
import { useCallback, useMemo, useState, lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { Layers, LayoutGrid, Network, GitBranch } from "lucide-react";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { useWorldOutline } from "@/hooks/use-world-outline";
import { useCreateEntry } from "@/hooks/use-world-entries";
import { useCreateConnection, useDeleteConnection } from "@/hooks/use-world-connections";
import type { WorldElement } from "@/services/world-data";

const KnowledgeGraphView = lazy(
  () => import("@/components/outline/KnowledgeGraphView")
);

const WorldEntityGraph = lazy(
  () => import("@/components/graph/WorldEntityGraph")
);

type GraphMode = "entity" | "knowledge";

/** Inline error boundary so entity graph crashes don't take down the whole page */
class GraphErrorBoundary extends Component<
  { children: ReactNode; onFallback?: () => void },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Entity Graph error:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <p className="font-serif text-[14px] italic text-sf-crimson/80">
            Entity Graph encountered an error.
          </p>
          <p className="text-[12px] text-t4 font-sans max-w-xs text-center">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[12px] text-teal uppercase tracking-wider font-sans hover:text-teal/80"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WorldGraph = () => {
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();
  const layoutContext = useWorldLayoutContext();
  const resolvedWorldId = layoutContext?.worldId ?? worldId ?? "";

  const [graphMode, setGraphMode] = useState<GraphMode>("knowledge");

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
        <p className="font-serif text-[14px] italic text-t3">
          No world selected.
        </p>
      </div>
    );
  }

  if (isLoading && graphMode === "knowledge") {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="sm" />
      </div>
    );
  }

  if (error && graphMode === "knowledge") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-serif text-[14px] italic text-sf-crimson/80">
          Graph unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Graph mode toggle, top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5"
        style={{
          background: "rgba(15,15,16,0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "3px",
        }}
      >
        <button
          onClick={() => setGraphMode("entity")}
          className={`flex items-center gap-1 px-3 py-1 text-[12px] uppercase tracking-[1.5px] transition-colors ${
            graphMode === "entity"
              ? "bg-teal/10 text-teal"
              : "text-t4 hover:text-t3"
          }`}
        >
          <Network className="w-3 h-3" />
          Entity Graph
        </button>
        <button
          onClick={() => setGraphMode("knowledge")}
          className={`flex items-center gap-1 px-3 py-1 text-[12px] uppercase tracking-[1.5px] transition-colors ${
            graphMode === "knowledge"
              ? "bg-teal/10 text-teal"
              : "text-t4 hover:text-t3"
          }`}
        >
          <GitBranch className="w-3 h-3" />
          Knowledge Graph
        </button>
      </div>

      {graphMode === "entity" ? (
        <GraphErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader size="sm" />
              </div>
            }
          >
            <WorldEntityGraph worldId={resolvedWorldId} />
          </Suspense>
        </GraphErrorBoundary>
      ) : (
        <>
          {/* Title + description */}
          <div className="absolute top-12 left-3 z-10 max-w-xs pointer-events-none">
            <p className="font-serif text-[13px] italic text-t3">
              Knowledge Graph
            </p>
            <p className="text-[12px] text-t4 font-sans normal-case tracking-normal mt-0.5">
              Worksheets and wiki entries
            </p>
          </div>

          {/* Entries-only toggle */}
          <div className="absolute top-12 right-3 z-10 flex items-center gap-1">
            <button
              onClick={() => setEntriesOnly(false)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[12px] uppercase tracking-[1.5px] transition-colors ${
                !entriesOnly
                  ? "bg-teal/10 border border-teal/25 text-teal"
                  : "bg-sf-void/90 border border-sf-border text-t4 hover:text-t3"
              }`}
              title="Show all elements"
            >
              <Layers className="w-3 h-3" />
              All
            </button>
            <button
              onClick={() => setEntriesOnly(true)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[12px] uppercase tracking-[1.5px] transition-colors ${
                entriesOnly
                  ? "bg-teal/10 border border-teal/25 text-teal"
                  : "bg-sf-void/90 border border-sf-border text-t4 hover:text-t3"
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
        </>
      )}
    </div>
  );
};

export default WorldGraph;
