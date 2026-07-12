/**
 * Reads a world's environmental parameters (the cascade drivers chosen
 * in the Environmental Chain Reaction tool) for the World Influence panel.
 * Source: worksheets.tool_type = 'environmental-chain-reaction',
 * data.parameter.type + data.parameter.types[].
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseParameterSlug, type WorldParameter } from "@/lib/world-parameters";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSlugs(data: any): string[] {
  const p = data?.parameter;
  if (!p) return [];
  const slugs: string[] = [];
  if (typeof p.type === "string" && p.type) slugs.push(p.type);
  if (Array.isArray(p.types)) for (const t of p.types) if (typeof t === "string" && t) slugs.push(t);
  return slugs;
}

export function useWorldParameters(worldId: string | undefined | null) {
  return useQuery<WorldParameter[]>({
    queryKey: ["world-parameters", worldId],
    enabled: !!worldId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheets")
        .select("data")
        .eq("world_id", worldId!)
        .eq("tool_type", "environmental-chain-reaction");
      if (error) throw error;
      const seen = new Set<string>();
      const params: WorldParameter[] = [];
      for (const row of data ?? []) {
        for (const slug of extractSlugs((row as { data: unknown }).data)) {
          if (seen.has(slug)) continue;
          const parsed = parseParameterSlug(slug);
          if (parsed && parsed.category !== "other") {
            seen.add(slug);
            params.push(parsed);
          }
        }
      }
      return params;
    },
  });
}
