/**
 * useWritingEntityLinks, Manages linking writing entries to specific entities.
 *
 * After a writing entry is saved, extracts entity names from the text
 * content and suggests linking to existing world entries.
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 6
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EntitySuggestion {
  entryId: string;
  title: string;
  entryType: string;
}

interface WritingEntityLink {
  id: string;
  writing_entry_id: string;
  entity_id: string;
  created_at: string;
}

export function useWritingEntityLinks(writingEntryId: string | undefined, worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch existing links
  const linksQuery = useQuery({
    queryKey: ["writing-entity-links", writingEntryId],
    queryFn: async () => {
      if (!writingEntryId) return [];
      const { data, error } = await supabase
        .from("writing_entry_entities")
        .select("*")
        .eq("writing_entry_id", writingEntryId);

      if (error) throw error;
      return (data ?? []) as WritingEntityLink[];
    },
    enabled: !!writingEntryId,
  });

  // Create a link
  const createLink = useMutation({
    mutationFn: async (entityId: string) => {
      if (!writingEntryId) throw new Error("No writing entry");
      const { error } = await supabase
        .from("writing_entry_entities")
        .upsert(
          { writing_entry_id: writingEntryId, entity_id: entityId },
          { onConflict: "writing_entry_id,entity_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["writing-entity-links", writingEntryId] });
      toast({ title: "Entity linked", description: "Writing entry linked to entity." });
    },
  });

  // Remove a link
  const removeLink = useMutation({
    mutationFn: async (entityId: string) => {
      if (!writingEntryId) throw new Error("No writing entry");
      const { error } = await supabase
        .from("writing_entry_entities")
        .delete()
        .eq("writing_entry_id", writingEntryId)
        .eq("entity_id", entityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["writing-entity-links", writingEntryId] });
    },
  });

  // Scan text for entity name matches
  const scanForEntities = useCallback(
    async (textContent: string) => {
      if (!worldId || !textContent || textContent.length < 20) return;

      // Fetch all world entries
      const { data: entries } = await supabase
        .from("world_entries")
        .select("id, title, entry_type")
        .eq("world_id", worldId);

      if (!entries || entries.length === 0) return;

      // Simple substring matching: check if any entity title appears in the text
      const existingLinks = new Set(
        (linksQuery.data ?? []).map((l) => l.entity_id)
      );

      const plain = textContent.toLowerCase().replace(/<[^>]*>/g, ""); // strip HTML
      const matches = entries.filter((e) => {
        if (!e.title || e.title.length < 3) return false;
        if (existingLinks.has(e.id)) return false;
        return plain.includes(e.title.toLowerCase());
      });

      if (matches.length > 0) {
        setSuggestions(
          matches.map((e) => ({
            entryId: e.id,
            title: e.title!,
            entryType: e.entry_type ?? "custom",
          }))
        );
        setShowSuggestions(true);
      }
    },
    [worldId, linksQuery.data]
  );

  const dismissSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestions([]);
  }, []);

  return {
    links: linksQuery.data ?? [],
    isLoading: linksQuery.isLoading,
    createLink,
    removeLink,
    suggestions,
    showSuggestions,
    scanForEntities,
    dismissSuggestions,
  };
}
