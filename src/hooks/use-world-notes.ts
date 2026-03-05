import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";

export interface WorldNote {
  id: string;
  world_id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Fetch all notes for a world
// ---------------------------------------------------------------------------

export const useWorldNotes = (worldId: string | undefined) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["world-notes", worldId],
    queryFn: async () => {
      if (!worldId || !user) return [];

      const { data, error } = await supabase
        .from("world_notes")
        .select("*")
        .eq("world_id", worldId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as WorldNote[];
    },
    enabled: !!user && !!worldId,
  });

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

// ---------------------------------------------------------------------------
// Create a new note
// ---------------------------------------------------------------------------

export const useCreateWorldNote = (worldId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get next sort order
      const { data: existing } = await supabase
        .from("world_notes")
        .select("sort_order")
        .eq("world_id", worldId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("world_notes")
        .insert({
          world_id: worldId,
          user_id: user.id,
          title: title ?? "Untitled Note",
          content: "",
          tags: [],
          sort_order: nextSort,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorldNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-notes", worldId] });
    },
  });
};

// ---------------------------------------------------------------------------
// Delete a note
// ---------------------------------------------------------------------------

export const useDeleteWorldNote = (worldId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("world_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-notes", worldId] });
    },
  });
};

// ---------------------------------------------------------------------------
// Update note title
// ---------------------------------------------------------------------------

export const useUpdateNoteTitle = (worldId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, title }: { noteId: string; title: string }) => {
      const { error } = await supabase
        .from("world_notes")
        .update({ title })
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-notes", worldId] });
    },
  });
};

// ---------------------------------------------------------------------------
// Update note tags
// ---------------------------------------------------------------------------

export const useUpdateNoteTags = (worldId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, tags }: { noteId: string; tags: string[] }) => {
      const { error } = await supabase
        .from("world_notes")
        .update({ tags })
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-notes", worldId] });
    },
  });
};

// ---------------------------------------------------------------------------
// Auto-saving content hook for a single note
// ---------------------------------------------------------------------------

export const useNoteContent = (noteId: string | null, worldId: string) => {
  const queryClient = useQueryClient();
  const [localContent, setLocalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!noteId) throw new Error("No note ID");

      const { error } = await supabase
        .from("world_notes")
        .update({ content })
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-notes", worldId] });
    },
  });

  // Debounced save
  const saveContent = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveMutation.mutateAsync(content);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    },
    [saveMutation]
  );

  const updateContent = useCallback(
    (content: string) => {
      setLocalContent(content);
      saveContent(content);
    },
    [saveContent]
  );

  // Keep refs for flush-on-unmount
  const localContentRef = useRef(localContent);
  localContentRef.current = localContent;
  const saveMutationRef = useRef(saveMutation);
  saveMutationRef.current = saveMutation;
  const noteIdRef = useRef(noteId);
  noteIdRef.current = noteId;

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current && noteIdRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveMutationRef.current.mutate(localContentRef.current);
      }
    };
  }, []);

  return {
    localContent,
    setLocalContent,
    updateContent,
    isSaving,
  };
};
