// ---------------------------------------------------------------------------
// useStartFromPrompt, "write" on a prompt opens a new Studio document.
//
// Replaces the retired /workshop flow, which wrote a writing_entries row that
// never reached the binder, compile or the graph. The document lands in the
// chosen world's root "Workshop" folder (created on first use, the same
// folder the workshop migration fills), seeded with the prompt in its
// synopsis and notes. The prose starts empty.
// ---------------------------------------------------------------------------

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mapError } from "@/lib/ship-voice";
import { localDay } from "@/lib/local-day";
import { nextSortOrder } from "@/hooks/use-writing-documents";
import { isWorkshopFolder, promptDocumentSeed } from "@/lib/writing/prompt-document";
import type { WritingPrompt } from "@/lib/writing/prompts";

interface Row {
  id: string;
  parent_id: string | null;
  entry_type: string;
  sort_order: number | null;
  metadata: unknown;
}

export function useStartFromPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ prompt, worldId }: { prompt: WritingPrompt; worldId: string }) => {
      if (!user) throw new Error("Not authenticated");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: rows, error: readError } = await db
        .from("world_entries")
        .select("id, parent_id, entry_type, sort_order, metadata")
        .eq("world_id", worldId)
        .in("entry_type", ["document", "folder"])
        .is("trashed_at", null);
      if (readError) throw readError;
      const all = (rows ?? []) as Row[];

      let folder = all.find((r) => r.parent_id === null && isWorkshopFolder(r));
      if (!folder) {
        const { data: created, error } = await db
          .from("world_entries")
          .insert({
            world_id: worldId,
            title: "Workshop",
            entry_type: "folder",
            content: "",
            metadata: { workshopFolder: true },
            sort_order: nextSortOrder(all.filter((r) => r.parent_id === null)),
            parent_id: null,
            created_by: user.id,
          })
          .select("id, parent_id, entry_type, sort_order, metadata")
          .single();
        if (error) throw error;
        folder = created as Row;
      }

      const seed = promptDocumentSeed(prompt, localDay());
      const { data: doc, error } = await db
        .from("world_entries")
        .insert({
          world_id: worldId,
          title: seed.title,
          entry_type: "document",
          content: seed.content,
          metadata: seed.metadata,
          sort_order: nextSortOrder(all.filter((r) => r.parent_id === folder!.id)),
          parent_id: folder.id,
          created_by: user.id,
        })
        .select("id, world_id")
        .single();
      if (error) throw error;
      return doc as { id: string; world_id: string };
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["writing-documents", doc.world_id] });
      qc.invalidateQueries({ queryKey: ["studio-doc-summaries"] });
      qc.invalidateQueries({ queryKey: ["studio-home"] });
    },
    onError: (error) => {
      toast({ title: "DOCUMENT CREATION FAILED.", description: mapError(error), variant: "destructive" });
    },
  });
}
