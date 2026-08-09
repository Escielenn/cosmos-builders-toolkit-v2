import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useWorksheets } from "@/hooks/use-worksheets";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import { getToolIcon } from "@/components/icons/tool-icons";
import { cn } from "@/lib/utils";

interface ElementPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onSelect: (worksheetId: string, worksheetTitle: string, toolType: string) => void;
  /** Tool types to exclude from the picker (e.g., "timeline") */
  excludeToolTypes?: string[];
}

const ElementPickerDialog = ({
  open,
  onOpenChange,
  worldId,
  onSelect,
  excludeToolTypes = ["timeline"],
}: ElementPickerDialogProps) => {
  const { worksheets } = useWorksheets(worldId);
  const [search, setSearch] = useState("");

  // Group worksheets by tool type, excluding specified types
  const groups = useMemo(() => {
    const filtered = worksheets.filter(
      (ws) => !excludeToolTypes.includes(ws.tool_type)
    );

    // Apply search filter
    const searched = search.trim()
      ? filtered.filter((ws) => {
          const q = search.toLowerCase();
          const title = (ws.title || "Untitled").toLowerCase();
          const toolName = getToolDisplayName(ws.tool_type).toLowerCase();
          return title.includes(q) || toolName.includes(q);
        })
      : filtered;

    // Group by tool type
    const map = new Map<string, typeof searched>();
    for (const ws of searched) {
      const existing = map.get(ws.tool_type) || [];
      existing.push(ws);
      map.set(ws.tool_type, existing);
    }

    return Array.from(map.entries())
      .map(([toolType, items]) => ({
        toolType,
        displayName: getToolDisplayName(toolType),
        items,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [worksheets, search, excludeToolTypes]);

  const handleSelect = (ws: { id: string; title: string | null; tool_type: string }) => {
    onSelect(ws.id, ws.title || "Untitled", ws.tool_type);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link World Element</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worksheets..."
            className="pl-9"
          />
        </div>

        {/* Worksheet list */}
        <div className="max-h-80 overflow-y-auto -mx-1 space-y-3">
          {groups.length === 0 ? (
            <p className="text-sm text-t3 text-center py-6">
              {worksheets.length === 0
                ? "No worksheets in this world yet."
                : "No worksheets match your search."}
            </p>
          ) : (
            groups.map((group) => {
              const ToolIcon = getToolIcon(group.toolType);
              return (
                <div key={group.toolType}>
                  <div className="flex items-center gap-2 px-2 py-1">
                    {ToolIcon && <ToolIcon className="w-4 h-4 rounded-sm" />}
                    <span className="text-[10px] font-medium text-t3 uppercase tracking-wider">
                      {group.displayName}
                    </span>
                  </div>
                  {group.items.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSelect(ws)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm text-left",
                        "hover:bg-muted/50 transition-colors"
                      )}
                    >
                      <span className="truncate">{ws.title || "Untitled"}</span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ElementPickerDialog;
