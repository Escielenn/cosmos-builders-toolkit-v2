import { useState } from "react";
import { Loader2, Globe, Plus, HardDrive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorlds } from "@/hooks/use-worlds";
import { cn } from "@/lib/utils";

export type SaveSelection =
  | { type: "local" }
  | { type: "existing"; worldId: string; worldName: string }
  | { type: "new"; worldName: string; worldDescription?: string };

interface WorldSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (selection: SaveSelection) => Promise<void>;
  isLoading?: boolean;
}

const WorldSelectDialog = ({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: WorldSelectDialogProps) => {
  const { worlds, isLoading: worldsLoading } = useWorlds();
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [newWorldName, setNewWorldName] = useState("");
  const [newWorldDescription, setNewWorldDescription] = useState("");
  const [activeTab, setActiveTab] = useState<string>("existing");

  const selectedWorld = worlds.find((w) => w.id === selectedWorldId);

  const handleSaveToExisting = async () => {
    if (!selectedWorldId || !selectedWorld) return;
    await onSave({
      type: "existing",
      worldId: selectedWorldId,
      worldName: selectedWorld.name,
    });
  };

  const handleSaveToNew = async () => {
    if (!newWorldName.trim()) return;
    await onSave({
      type: "new",
      worldName: newWorldName.trim(),
      worldDescription: newWorldDescription.trim() || undefined,
    });
  };

  const handleSaveLocal = async () => {
    await onSave({ type: "local" });
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedWorldId(null);
      setNewWorldName("");
      setNewWorldDescription("");
    }
    onOpenChange(newOpen);
  };

  // Default to "new" tab if user has no worlds
  const defaultTab = worlds.length === 0 ? "new" : "existing";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Save Your Work</DialogTitle>
          <DialogDescription>
            Choose where to save this worksheet.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={defaultTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing" className="text-xs sm:text-sm">
              <Globe className="w-3 h-3 mr-1 sm:mr-2" />
              Existing
            </TabsTrigger>
            <TabsTrigger value="new" className="text-xs sm:text-sm">
              <Plus className="w-3 h-3 mr-1 sm:mr-2" />
              New World
            </TabsTrigger>
            <TabsTrigger value="local" className="text-xs sm:text-sm">
              <HardDrive className="w-3 h-3 mr-1 sm:mr-2" />
              Local
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-4">
            {worldsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : worlds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>You don't have any worlds yet.</p>
                <Button
                  variant="link"
                  onClick={() => setActiveTab("new")}
                  className="mt-2"
                >
                  Create your first world
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-48 pr-4">
                  <div className="space-y-2">
                    {worlds.map((world) => (
                      <button
                        key={world.id}
                        onClick={() => setSelectedWorldId(world.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedWorldId === world.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="font-medium">{world.name}</div>
                        {world.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {world.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  onClick={handleSaveToExisting}
                  disabled={!selectedWorldId || isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save to {selectedWorld?.name || "Selected World"}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="worldName">World Name</Label>
              <Input
                id="worldName"
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                placeholder="e.g., Kepler-442b Colony"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worldDescription">Description (optional)</Label>
              <Textarea
                id="worldDescription"
                value={newWorldDescription}
                onChange={(e) => setNewWorldDescription(e.target.value)}
                placeholder="A brief description of your world..."
                className="min-h-[80px]"
              />
            </div>
            <Button
              onClick={handleSaveToNew}
              disabled={!newWorldName.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create World & Save
            </Button>
          </TabsContent>

          <TabsContent value="local" className="mt-4">
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Save to your browser's local storage. Your work will be
                available only on this device.
              </p>
              <Button
                variant="outline"
                onClick={handleSaveLocal}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Locally
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WorldSelectDialog;
