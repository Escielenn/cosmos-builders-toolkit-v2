import { useState, useEffect } from "react";
import { Link2, RefreshCw, Unlink, ChevronDown, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorksheetsByType, useWorksheet } from "@/hooks/use-worksheets";
import BrokenLinkBadge from "./BrokenLinkBadge";
import {
  LinkedWorksheetRef,
  extractSyncedData,
  getToolDisplayName,
} from "@/lib/worksheet-links-config";
import { formatDistanceToNow } from "date-fns";

interface WorksheetLinkSelectorProps {
  worldId: string;
  targetToolType: string;
  label: string;
  description?: string;
  syncFields: string[];
  value?: LinkedWorksheetRef;
  onChange: (ref: LinkedWorksheetRef | undefined) => void;
  disabled?: boolean;
}

const WorksheetLinkSelector = ({
  worldId,
  targetToolType,
  label,
  description,
  syncFields,
  value,
  onChange,
  disabled = false,
}: WorksheetLinkSelectorProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBroken, setIsBroken] = useState(false);

  // Fetch available worksheets of the target type
  const { data: worksheets = [], isLoading: loadingWorksheets } =
    useWorksheetsByType(worldId, targetToolType);

  // Fetch the linked worksheet to check if it still exists and get fresh data
  const { data: linkedWorksheet, isLoading: loadingLinked } = useWorksheet(
    value?.worksheetId
  );

  // Check if the link is broken (worksheet was deleted)
  useEffect(() => {
    if (value?.worksheetId && !loadingLinked) {
      setIsBroken(!linkedWorksheet);
    } else {
      setIsBroken(false);
    }
  }, [value?.worksheetId, linkedWorksheet, loadingLinked]);

  const handleSelect = async (worksheetId: string) => {
    if (worksheetId === "none") {
      onChange(undefined);
      return;
    }

    const worksheet = worksheets.find((w) => w.id === worksheetId);
    if (!worksheet) return;

    // Extract synced data from the worksheet
    const worksheetData = worksheet.data as Record<string, unknown>;
    const syncedData = extractSyncedData(worksheetData, syncFields);

    // Include title in synced data
    syncedData.title = worksheet.title || "Untitled";

    onChange({
      worksheetId,
      syncedAt: new Date().toISOString(),
      syncedData,
    });
  };

  const handleRefresh = async () => {
    if (!value?.worksheetId || !linkedWorksheet) return;

    setIsRefreshing(true);
    try {
      const worksheetData = linkedWorksheet.data as Record<string, unknown>;
      const syncedData = extractSyncedData(worksheetData, syncFields);
      syncedData.title = linkedWorksheet.title || "Untitled";

      onChange({
        worksheetId: value.worksheetId,
        syncedAt: new Date().toISOString(),
        syncedData,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnlink = () => {
    onChange(undefined);
  };

  const handleRemoveBrokenLink = () => {
    onChange(undefined);
    setIsBroken(false);
  };

  // Show broken link badge if the linked worksheet was deleted
  if (isBroken) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          {label}
        </Label>
        <BrokenLinkBadge label={label} onRemoveLink={handleRemoveBrokenLink} />
      </div>
    );
  }

  const linkedTitle = value?.syncedData?.title as string | undefined;
  const syncedAt = value?.syncedAt
    ? formatDistanceToNow(new Date(value.syncedAt), { addSuffix: true })
    : null;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        {label}
      </Label>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={value?.worksheetId || "none"}
          onValueChange={handleSelect}
          disabled={disabled || loadingWorksheets}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={`Select ${getToolDisplayName(targetToolType)}...`}>
              {value?.worksheetId && linkedTitle
                ? linkedTitle
                : `Select ${getToolDisplayName(targetToolType)}...`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">No link</span>
            </SelectItem>
            {worksheets.map((worksheet) => (
              <SelectItem key={worksheet.id} value={worksheet.id}>
                {worksheet.title || "Untitled"}
              </SelectItem>
            ))}
            {worksheets.length === 0 && !loadingWorksheets && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No {getToolDisplayName(targetToolType)} worksheets in this world
              </div>
            )}
          </SelectContent>
        </Select>

        {value?.worksheetId && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing || disabled}
                  className="h-10 w-10"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh synced data</p>
                {syncedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced {syncedAt}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleUnlink}
                  disabled={disabled}
                  className="h-10 w-10"
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unlink</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Show synced data preview */}
      {value?.syncedData && Object.keys(value.syncedData).length > 1 && (
        <div className="p-3 rounded-lg border border-border/50 bg-muted/30 text-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Synced data from "{linkedTitle}"</span>
            {syncedAt && <span>{syncedAt}</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {Object.entries(value.syncedData)
              .filter(([key]) => key !== "title")
              .slice(0, 6)
              .map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground truncate">
                    {formatFieldName(key)}:
                  </span>
                  <span className="font-medium truncate ml-2">
                    {formatFieldValue(val)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to format field names for display
function formatFieldName(field: string): string {
  // Handle nested paths like "biochemistry.biochemicalBasis"
  const parts = field.split(".");
  const lastPart = parts[parts.length - 1];

  // Convert camelCase to Title Case
  return lastPart
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Helper to format field values for display
function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default WorksheetLinkSelector;
