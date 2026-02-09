import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  EXPORT_CATEGORIES,
  type ExportCategory,
} from "@/lib/export/categories";

interface WorksheetRecord {
  id: string;
  world_id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CategoryWorksheets {
  category: ExportCategory;
  worksheets: WorksheetRecord[];
}

export function useCategoryWorksheets(worldId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["category-worksheets", worldId],
    queryFn: async (): Promise<CategoryWorksheets[]> => {
      if (!worldId) return [];

      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .eq("world_id", worldId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const worksheets = (data as WorksheetRecord[]) || [];

      // Group worksheets by category, only include categories that have worksheets
      return EXPORT_CATEGORIES.map((category) => ({
        category,
        worksheets: worksheets.filter((ws) =>
          category.toolTypes.includes(ws.tool_type)
        ),
      })).filter((cw) => cw.worksheets.length > 0);
    },
    enabled: !!user && !!worldId,
  });
}
