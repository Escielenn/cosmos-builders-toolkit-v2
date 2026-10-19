import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptPendingChanges, dismissPendingChanges } from "@/services/entity-sync";
import { getToolDisplayName } from "@/lib/tools-config";
import { Notice } from "@/components/layout/page-chrome";

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

  // `fields` undefined = accept all; otherwise only the named field keys.
  const acceptMutation = useMutation({
    mutationFn: (fields?: string[]) => acceptPendingChanges(entryId, fields),
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
    <Notice
      tone="caution"
      icon={<AlertTriangle className="w-4 h-4" />}
      label="WORKSHEET UPDATE AVAILABLE"
      actions={
        <>
          <Button
            size="sm"
            variant="sf-ghost"
            onClick={() => acceptMutation.mutate(undefined)}
            disabled={isAnyPending}
            className="min-h-hit gap-1 text-[12px]"
          >
            <Check className="w-3 h-3" aria-hidden />
            Accept all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dismissMutation.mutate()}
            disabled={isAnyPending}
            className="min-h-hit gap-1 text-[12px]"
          >
            <X className="w-3 h-3" aria-hidden />
            Dismiss
          </Button>
        </>
      }
    >
      <p>{toolName} has new data that differs from this entry's details.</p>
      <div className="mt-2 space-y-1">
        {pendingChanges.map((change) => (
          <div key={change.field} className="flex items-center gap-2 text-[13px]">
            <span className="text-t2 font-medium">{change.label}:</span>
            <span className="text-t4 line-through">
              {formatValue(change.oldValue)}
            </span>
            <span className="text-t2" aria-hidden>→</span>
            <span className="text-sf-amber-text font-mono">
              {formatValue(change.newValue)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => acceptMutation.mutate([change.field])}
              disabled={isAnyPending}
              aria-label={`Accept ${change.label}`}
              className="ml-auto min-h-hit gap-1 text-[12px] text-sf-amber-text"
            >
              <Check className="w-3 h-3" aria-hidden />
              Accept
            </Button>
          </div>
        ))}
      </div>
    </Notice>
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
