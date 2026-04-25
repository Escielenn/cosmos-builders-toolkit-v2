import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, Plus, ExternalLink } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getToolsForEntityType } from "@/lib/entity-config";
import { getToolDisplayName } from "@/lib/tools-config";
import { getToolIcon } from "@/components/icons/tool-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LinkedWorksheet {
  worksheet_id: string;
  worksheetTitle: string | null;
  toolType: string;
}

interface WorksheetLauncherGridProps {
  entityId: string;
  entityType: string;
  worldId: string;
  canEdit: boolean;
}

// ---------------------------------------------------------------------------
// Hook: fetch linked worksheets for an entity
// ---------------------------------------------------------------------------

function useEntityWorksheets(entityId: string | undefined) {
  return useQuery({
    queryKey: ["entity-worksheets", entityId],
    queryFn: async () => {
      if (!entityId) return [];

      const { data, error } = await supabase
        .from("entity_worksheets")
        .select("worksheet_id, worksheets(title, tool_type)")
        .eq("entity_id", entityId);

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        worksheet_id: row.worksheet_id,
        worksheetTitle: row.worksheets?.title ?? null,
        toolType: row.worksheets?.tool_type ?? "",
      })) as LinkedWorksheet[];
    },
    enabled: !!entityId,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorksheetLauncherGrid({
  entityId,
  entityType,
  worldId,
  canEdit,
}: WorksheetLauncherGridProps) {
  const navigate = useNavigate();
  const { data: linkedWorksheets = [] } = useEntityWorksheets(entityId);
  const relevantTools = getToolsForEntityType(entityType);

  if (relevantTools.length === 0) return null;

  // Build lookup: toolSlug → linked worksheet (if any)
  const linkedByTool = new Map<string, LinkedWorksheet>();
  for (const lw of linkedWorksheets) {
    if (!linkedByTool.has(lw.toolType)) {
      linkedByTool.set(lw.toolType, lw);
    }
  }

  const handleLaunch = (toolSlug: string) => {
    const existing = linkedByTool.get(toolSlug);
    if (existing) {
      // Open existing worksheet
      navigate(`/tools/${toolSlug}?worldId=${worldId}&worksheetId=${existing.worksheet_id}`);
    } else {
      // Navigate to tool page — user will create a new worksheet there
      // The entity linking happens in Phase 3 via entity-prepopulate
      navigate(`/tools/${toolSlug}?worldId=${worldId}&entityId=${entityId}`);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-xs font-light uppercase tracking-[3px] text-emerald">
        Worksheets
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {relevantTools.map((toolSlug) => {
          const linked = linkedByTool.get(toolSlug);
          const displayName = getToolDisplayName(toolSlug);
          const SvgIcon = getToolIcon(toolSlug);

          return (
            <button
              key={toolSlug}
              type="button"
              onClick={() => handleLaunch(toolSlug)}
              disabled={!canEdit && !linked}
              className="text-left"
            >
              <GlassPanel className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group h-full">
                <div className="flex items-start gap-3">
                  {SvgIcon ? (
                    <SvgIcon className="w-8 h-8 rounded-sm shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4 text-primary/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-heading text-t2 group-hover:text-t1 transition-colors line-clamp-1">
                      {displayName}
                    </span>
                    {linked ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-2.5 h-2.5 text-primary/40" />
                        <span className="text-[10px] text-primary/50 truncate">
                          {linked.worksheetTitle || "Open Worksheet"}
                        </span>
                      </div>
                    ) : canEdit ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Plus className="w-2.5 h-2.5 text-t4" />
                        <span className="text-[10px] text-t4">
                          Start Worksheet
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </GlassPanel>
            </button>
          );
        })}
      </div>
    </div>
  );
}
