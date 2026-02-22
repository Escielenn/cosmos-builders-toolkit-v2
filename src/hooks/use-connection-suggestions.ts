import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConnectionSuggestion {
  sourceId: string;
  targetId: string;
  targetTitle: string;
}

/**
 * Detects new wiki-links in content and suggests creating world_connections.
 * Returns pending suggestions and handlers to accept/dismiss them.
 */
export function useConnectionSuggestions(worldId: string, entryId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const createConnectionMutation = useMutation({
    mutationFn: async (input: {
      sourceId: string;
      targetId: string;
      connectionType: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("world_connections").insert({
        world_id: worldId,
        source_entry_id: input.sourceId,
        target_entry_id: input.targetId,
        connection_type: input.connectionType,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wiki-page-connections", worldId, entryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["codex-data", worldId],
      });
    },
  });

  /**
   * Check content for wiki-links and generate suggestions for
   * any that don't have corresponding world_connections.
   */
  const checkForSuggestions = useCallback(
    async (htmlContent: string) => {
      const linkedIds = extractWikiLinkIds(htmlContent);
      if (linkedIds.length === 0) {
        setSuggestions([]);
        return;
      }

      const newSuggestions: ConnectionSuggestion[] = [];

      for (const targetId of linkedIds) {
        // Skip dismissed pairs
        const pairKey = `${entryId}-${targetId}`;
        if (dismissed.has(pairKey)) continue;

        // Check if connection already exists
        const { data: existing } = await supabase
          .from("world_connections")
          .select("id")
          .eq("world_id", worldId)
          .or(
            `and(source_entry_id.eq.${entryId},target_entry_id.eq.${targetId}),and(source_entry_id.eq.${targetId},target_entry_id.eq.${entryId})`
          )
          .maybeSingle();

        if (!existing) {
          // Get target title
          const { data: target } = await supabase
            .from("world_entries")
            .select("title")
            .eq("id", targetId)
            .maybeSingle();

          if (target) {
            newSuggestions.push({
              sourceId: entryId,
              targetId,
              targetTitle: target.title,
            });
          }
        }
      }

      setSuggestions(newSuggestions);
    },
    [worldId, entryId, dismissed]
  );

  const acceptSuggestion = useCallback(
    (suggestion: ConnectionSuggestion, connectionType: string) => {
      createConnectionMutation.mutate({
        sourceId: suggestion.sourceId,
        targetId: suggestion.targetId,
        connectionType,
      });
      setSuggestions((prev) =>
        prev.filter((s) => s.targetId !== suggestion.targetId)
      );
    },
    [createConnectionMutation]
  );

  const dismissSuggestion = useCallback(
    (suggestion: ConnectionSuggestion) => {
      const pairKey = `${entryId}-${suggestion.targetId}`;
      setDismissed((prev) => new Set(prev).add(pairKey));
      setSuggestions((prev) =>
        prev.filter((s) => s.targetId !== suggestion.targetId)
      );
    },
    [entryId]
  );

  return {
    suggestions,
    checkForSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  };
}

function extractWikiLinkIds(htmlContent: string): string[] {
  const regex = /data-element-id="([^"]+)"/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}
