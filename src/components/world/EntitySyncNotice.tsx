import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptPendingChanges, dismissPendingChanges } from "@/services/entity-sync";
import { getToolDisplayName } from "@/lib/tools-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  sourceWorksheetId: string;
  sourceToolType: string;
}

interface EntitySyncNoticeProps {
  entryId: string;
  worldId: string;
  pendingChanges: PendingChange[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EntitySyncNotice({
  entryId,
  worldId,
  pendingChanges,
}: EntitySyncNoticeProps) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["wiki-page", worldId, entryId] });
    queryClient.invalidateQueries({ queryKey: ["world-entities", worldId] });
    queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => acceptPendingChanges(entryId),
    onSuccess: invalidate,
  });

  const dismissMutation = useMutation({
    mutationFn: () => dismissPendingChanges(entryId),
    onSuccess: invalidate,
  });

  const isAnyPending = acceptMutation.isPending || dismissMutation.isPending;

  if (!pendingChanges || pendingChanges.length === 0) return null;

  // Group by source tool
  const sourceTool = pendingChanges[0]?.sourceToolType;
  const toolName = sourceTool ? getToolDisplayName(sourceTool) : "worksheet";

  return (
    <div className="border border-amber/20 bg-amber/[0.04] p-3 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-heading uppercase tracking-wider text-amber">
            Worksheet Update Available
          </p>
          <p className="text-[11px] text-t3 mt-1">
            {toolName} has new data that differs from this entity's details.
          </p>
        </div>
      </div>

      <div className="space-y-1 ml-6">
        {pendingChanges.map((change) => (
          <div key={change.field} className="flex items-baseline gap-2 text-[11px]">
            <span className="text-t3 font-medium">{change.label}:</span>
            <span className="text-t4 line-through">
              {formatValue(change.oldValue)}
            </span>
            <span className="text-t2">→</span>
            <span className="text-amber font-mono">
              {formatValue(change.newValue)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-6">
        <Button
          size="sm"
          variant="outline"
          onClick={() => acceptMutation.mutate()}
          disabled={isAnyPending}
          className="gap-1 h-6 text-[10px] border-amber/20 text-amber hover:bg-amber/10"
        >
          <Check className="w-3 h-3" />
          Accept All
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => dismissMutation.mutate()}
          disabled={isAnyPending}
          className="gap-1 h-6 text-[10px]"
        >
          <X className="w-3 h-3" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return String(value);
  return String(value);
}
