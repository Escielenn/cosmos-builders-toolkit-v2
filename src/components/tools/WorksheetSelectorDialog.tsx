import { useState } from "react";
import { Plus, FileText, Calendar } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getToolIcon } from "@/components/icons/tool-icons";
import TagBadge from "@/components/tags/TagBadge";
import { getTagColor } from "@/hooks/use-tags";

interface Worksheet {
  id: string;
  title: string | null;
  updated_at: string;
  tags?: string[];
}

interface WorksheetSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  worldName?: string;
  toolType: string;
  toolDisplayName: string;
  worksheets: Worksheet[];
  isLoading: boolean;
  onSelect: (worksheetId: string) => void;
  onCreate: (name: string) => Promise<string>;
}

const WorksheetSelectorDialog = ({
  open,
  onOpenChange,
  worldName,
  toolType,
  toolDisplayName,
  worksheets,
  isLoading,
  onSelect,
  onCreate,
}: WorksheetSelectorDialogProps) => {
  const ToolIcon = getToolIcon(toolType);
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string | null>(null);
  const [newWorksheetName, setNewWorksheetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const selectedWorksheet = worksheets.find((w) => w.id === selectedWorksheetId);

  const handleOpenSelected = () => {
    if (selectedWorksheetId) {
      onSelect(selectedWorksheetId);
      handleClose();
    }
  };

  const handleCreate = async () => {
    if (!newWorksheetName.trim()) return;

    setIsCreating(true);
    try {
      const newId = await onCreate(newWorksheetName.trim());
      onSelect(newId);
      handleClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedWorksheetId(null);
    setNewWorksheetName("");
    setShowCreateForm(false);
    onOpenChange(false);
  };

  // If no worksheets exist, show create form by default
  const shouldShowCreateForm = showCreateForm || worksheets.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {ToolIcon && <ToolIcon className="w-7 h-7 rounded-sm shrink-0" />}
            {shouldShowCreateForm ? `New ${toolDisplayName}` : `Select ${toolDisplayName}`}
          </DialogTitle>
          <DialogDescription>
            {worldName && (
              <span className="text-primary font-medium">{worldName}</span>
            )}
            {worldName && "—"}
            {shouldShowCreateForm
              ? `Enter a name for your new ${toolDisplayName.toLowerCase()}.`
              : `You have ${worksheets.length} ${toolDisplayName.toLowerCase()}${worksheets.length !== 1 ? "s" : ""} in this world.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size="sm" />
          </div>
        ) : shouldShowCreateForm ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="worksheetName">Name (required)</Label>
              <Input
                id="worksheetName"
                value={newWorksheetName}
                onChange={(e) => setNewWorksheetName(e.target.value)}
                placeholder={`e.g., ${getPlaceholderName(toolDisplayName)}`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newWorksheetName.trim()) {
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              {worksheets.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                  className="flex-1"
                >
                  Back to List
                </Button>
              )}
              <Button
                onClick={handleCreate}
                disabled={!newWorksheetName.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <Loader variant="inline" size="sm" className="mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-2">
                {worksheets.map((worksheet) => (
                  <button
                    key={worksheet.id}
                    onClick={() => setSelectedWorksheetId(worksheet.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-none border transition-colors",
                      selectedWorksheetId === worksheet.id
                        ? "border-primary bg-primary/10"
                        : "border-sf-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-t3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {worksheet.title || "Untitled"}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-t3 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(worksheet.updated_at), { addSuffix: true })}
                        </div>
                        {worksheet.tags && worksheet.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {worksheet.tags.slice(0, 3).map((tag) => {
                              const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                              return (
                                <TagBadge key={tag} name={tag} color={getTagColor(hash)} size="sm" />
                              );
                            })}
                            {worksheet.tags.length > 3 && (
                              <span className="text-xs text-t3">+{worksheet.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4 pt-4 border-t border-sf-border">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
              <Button
                onClick={handleOpenSelected}
                disabled={!selectedWorksheetId}
                className="flex-1"
              >
                Open Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper to generate placeholder names based on tool type
function getPlaceholderName(toolDisplayName: string): string {
  const placeholders: Record<string, string> = {
    "Planetary Profile": "Kepler-442b",
    "Environmental Chain Reaction": "Desert World Ecosystem",
    "Spacecraft Designer": "ISV Aurora",
    "Propulsion Consequences Map": "Alcubierre Drive Analysis",
    "Drake Equation Calculator": "Optimistic Galaxy Scenario",
    "Xenomythology Framework": "The Crystalline Singers",
    "Evolutionary Biology": "The Silicate Swimmers",
    "Physics Declaration: The One Big Lie": "The Epstein Drive",
    "Time Dilation Calculator": "Earth to Alpha Centauri at 0.9c",
  };
  return placeholders[toolDisplayName] || "My " + toolDisplayName;
}

export default WorksheetSelectorDialog;
