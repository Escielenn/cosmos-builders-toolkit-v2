import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createDraftWikiPage } from "@/services/world-entries";
import { getLayerForTool } from "@/services/world-data";

interface AutoDraftInput {
  toolType: string;
  worksheetId: string;
  title: string;
}

/**
 * Hook that auto-creates a draft wiki page (world_entry) linked to a worksheet.
 * Call after a worksheet is created or saved. Idempotent — safe to call repeatedly.
 */
export function useAutoCreateDraftPage(worldId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AutoDraftInput) => {
      if (!worldId || !user) throw new Error("Missing world or user");
      return createDraftWikiPage(
        {
          worldId,
          toolSource: input.toolType,
          toolDataId: input.worksheetId,
          title: input.title,
          layer: getLayerForTool(input.toolType),
        },
        user.id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
    },
    // Silently fail — draft creation is a best-effort background operation
  });
}
