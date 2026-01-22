import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";

interface WorldNote {
  id: string;
  world_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useWorldNotes = (worldId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localContent, setLocalContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noteIdRef = useRef<string | null>(null);

  // Fetch existing notes
  const notesQuery = useQuery({
    queryKey: ["world-notes", worldId],
    queryFn: async () => {
      if (!worldId || !user) return null;

      const { data, error } = await supabase
        .from("world_notes")
        .select("*")
        .eq("world_id", worldId)
        .maybeSingle();

      if (error) throw error;
      return data as WorldNote | null;
    },
    enabled: !!user && !!worldId,
  });

  // Sync local content when notes load
  useEffect(() => {
    if (notesQuery.data) {
      setLocalContent(notesQuery.data.content);
      noteIdRef.current = notesQuery.data.id;
    } else if (notesQuery.isSuccess && !notesQuery.data) {
      setLocalContent("");
      noteIdRef.current = null;
    }
  }, [notesQuery.data, notesQuery.isSuccess]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!worldId || !user) throw new Error("Missing world or user");

      if (noteIdRef.current) {
        // Update existing note
        const { data, error } = await supabase
          .from("world_notes")
          .update({ content })
          .eq("id", noteIdRef.current)
          .select()
          .single();

        if (error) throw error;
        return data as WorldNote;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from("world_notes")
          .insert({
            world_id: worldId,
            user_id: user.id,
            content,
          })
          .select()
          .single();

        if (error) throw error;
        noteIdRef.current = data.id;
        return data as WorldNote;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["world-notes", worldId], data);
    },
  });

  // Debounced save function
  const saveContent = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveMutation.mutateAsync(content);
        } finally {
          setIsSaving(false);
        }
      }, 1000); // 1 second debounce
    },
    [saveMutation]
  );

  // Update content and trigger save
  const updateContent = useCallback(
    (content: string) => {
      setLocalContent(content);
      saveContent(content);
    },
    [saveContent]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content: localContent,
    updateContent,
    isLoading: notesQuery.isLoading,
    isSaving,
    error: notesQuery.error,
    lastUpdated: notesQuery.data?.updated_at,
  };
};
