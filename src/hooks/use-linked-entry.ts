import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the wiki entry ID linked to a given worksheet via tool_data_id.
 * Lightweight single-row query for tool pages that need a "View in Wiki" link.
 */
export function useLinkedEntryId(
  worldId: string | undefined,
  worksheetId: string | undefined
) {
  return useQuery({
    queryKey: ["linked-entry", worldId, worksheetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("world_entries")
        .select("id")
        .eq("world_id", worldId!)
        .eq("tool_data_id", worksheetId!)
        .maybeSingle();
      return data?.id ?? null;
    },
    enabled: !!worldId && !!worksheetId,
  });
}
