import { useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
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

  const allElements = useMemo(() => {
    return layers.flatMap((l) => l.elements);
  }, [layers]);

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
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader size="sm" />
          </div>
        }
      >
        <KnowledgeGraphView
          elements={allElements}
          entries={entries}
          connections={connections}
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
