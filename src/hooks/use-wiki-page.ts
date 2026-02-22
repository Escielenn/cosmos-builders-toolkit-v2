import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { WorldEntry } from "@/services/world-data";

interface UseWikiPageResult {
  entry: WorldEntry | null;
  toolData: Record<string, unknown> | null;
  connections: WikiConnection[];
  backlinks: Backlink[];
  isLoading: boolean;
  error: Error | null;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  updateCoverImage: (url: string | null) => void;
  isSaving: boolean;
}

export interface WikiConnection {
  id: string;
  connectionType: string;
  targetId: string;
  targetTitle: string;
  direction: "outgoing" | "incoming";
}

export interface Backlink {
  id: string;
  title: string;
}

export function useWikiPage(
  worldId: string,
  entryId: string | undefined
): UseWikiPageResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch the entry
  const entryQuery = useQuery({
    queryKey: ["wiki-page", entryId],
    queryFn: async () => {
      if (!entryId) return null;
      const { data, error } = await supabase
        .from("world_entries")
        .select("*")
        .eq("id", entryId)
        .single();
      if (error) throw error;
      return data as WorldEntry;
    },
    enabled: !!entryId,
  });

  // Fetch linked tool data (worksheet)
  const toolDataQuery = useQuery({
    queryKey: ["wiki-page-tool-data", entryQuery.data?.tool_data_id],
    queryFn: async () => {
      const entry = entryQuery.data;
      if (!entry?.tool_data_id) return null;
      const { data, error } = await supabase
        .from("worksheets")
        .select("data")
        .eq("id", entry.tool_data_id)
        .single();
      if (error) throw error;
      return (data?.data as Record<string, unknown>) ?? null;
    },
    enabled: !!entryQuery.data?.tool_data_id,
  });

  // Fetch connections involving this entry
  const connectionsQuery = useQuery({
    queryKey: ["wiki-page-connections", worldId, entryId],
    queryFn: async () => {
      if (!entryId) return [];
      const { data, error } = await supabase
        .from("world_connections")
        .select("*")
        .eq("world_id", worldId)
        .or(
          `source_entry_id.eq.${entryId},target_entry_id.eq.${entryId},source_worksheet_id.eq.${entryId},target_worksheet_id.eq.${entryId}`
        );
      if (error) throw error;

      // Resolve connection targets
      const connections: WikiConnection[] = [];
      for (const conn of data || []) {
        const isSource =
          conn.source_entry_id === entryId ||
          conn.source_worksheet_id === entryId;
        const targetEntryId = isSource
          ? conn.target_entry_id || conn.target_worksheet_id
          : conn.source_entry_id || conn.source_worksheet_id;

        if (!targetEntryId) continue;

        // Try to resolve title from entries
        const { data: target } = await supabase
          .from("world_entries")
          .select("title")
          .eq("id", targetEntryId)
          .maybeSingle();

        let title = target?.title || "";
        if (!title) {
          // Try worksheets
          const { data: ws } = await supabase
            .from("worksheets")
            .select("title")
            .eq("id", targetEntryId)
            .maybeSingle();
          title = ws?.title || "Unknown";
        }

        connections.push({
          id: conn.id,
          connectionType: conn.connection_type,
          targetId: targetEntryId,
          targetTitle: title,
          direction: isSource ? "outgoing" : "incoming",
        });
      }

      return connections;
    },
    enabled: !!entryId && !!worldId,
  });

  // Fetch backlinks — entries whose content contains a wiki-link to this entry
  const backlinksQuery = useQuery({
    queryKey: ["wiki-page-backlinks", worldId, entryId],
    queryFn: async () => {
      if (!entryId) return [];
      const { data, error } = await supabase
        .from("world_entries")
        .select("id, title, content")
        .eq("world_id", worldId)
        .neq("id", entryId)
        .not("content", "is", null);
      if (error) throw error;

      return (data || [])
        .filter(
          (e) =>
            e.content && e.content.includes(`data-element-id="${entryId}"`)
        )
        .map((e) => ({ id: e.id, title: e.title }))
        .slice(0, 20);
    },
    enabled: !!entryId && !!worldId,
  });

  // Update content mutation
  const contentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!entryId) return;
      const { error } = await supabase
        .from("world_entries")
        .update({ content })
        .eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-page", entryId] });
      queryClient.invalidateQueries({
        queryKey: ["wiki-page-backlinks", worldId],
      });
      queryClient.invalidateQueries({
        queryKey: ["codex-data", worldId],
      });
    },
  });

  // Update title mutation
  const titleMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!entryId) return;
      const { error } = await supabase
        .from("world_entries")
        .update({ title })
        .eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-page", entryId] });
      queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
    },
  });

  // Update cover image mutation
  const coverMutation = useMutation({
    mutationFn: async (url: string | null) => {
      if (!entryId) return;
      const { error } = await supabase
        .from("world_entries")
        .update({ cover_image_url: url })
        .eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-page", entryId] });
    },
  });

  return {
    entry: entryQuery.data ?? null,
    toolData: toolDataQuery.data ?? null,
    connections: connectionsQuery.data ?? [],
    backlinks: backlinksQuery.data ?? [],
    isLoading: entryQuery.isLoading,
    error: entryQuery.error as Error | null,
    updateContent: (content: string) => contentMutation.mutate(content),
    updateTitle: (title: string) => titleMutation.mutate(title),
    updateCoverImage: (url: string | null) => coverMutation.mutate(url),
    isSaving: contentMutation.isPending,
  };
}
