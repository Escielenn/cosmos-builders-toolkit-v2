import { useState } from "react";
import { Download, FileJson, FolderArchive, Save, History } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  compileWorldSnapshot,
  saveWorldSnapshotRpc,
  downloadSnapshotAsJson,
  downloadSnapshotAsZip,
} from "@/lib/export/world-snapshot";

type SnapshotAction = "download-json" | "download-zip" | "save-version";

interface WorldSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldName: string;
  worldId: string;
}

const WorldSnapshotDialog = ({
  open,
  onOpenChange,
  worldName,
  worldId,
}: WorldSnapshotDialogProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<SnapshotAction>("download-json");
  const [versionLabel, setVersionLabel] = useState("");

  const handleSnapshot = async () => {
    setIsProcessing(true);

    try {
      if (action === "save-version") {
        // RPC compiles + saves atomically — no separate compile needed
        const result = await saveWorldSnapshotRpc(worldId, versionLabel || undefined);
        toast({
          title: "VERSION SAVED.",
          description: `Version ${result.version_number}${versionLabel ? ` "${versionLabel}"` : ""} saved.`,
        });
      } else {
        const snapshot = await compileWorldSnapshot(worldId);

        if (action === "download-json") {
          downloadSnapshotAsJson(snapshot, worldName);
          toast({
            title: "SNAPSHOT EXPORTED.",
            description: `${snapshot.worksheets.length} worksheet${snapshot.worksheets.length === 1 ? "" : "s"} exported as JSON.`,
          });
        } else {
          await downloadSnapshotAsZip(snapshot, worldName);
          toast({
            title: "SNAPSHOT ARCHIVED.",
            description: `Complete world archive downloaded as ZIP.`,
          });
        }
      }

      onOpenChange(false);
      setVersionLabel("");
    } catch (error) {
      console.error("Snapshot error:", error);
      toast({
        title: "SNAPSHOT FAILED.",
        description:
          error instanceof Error ? error.message : "Failed to compile snapshot.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const actions: { id: SnapshotAction; icon: typeof FileJson; label: string; description: string }[] = [
    {
      id: "download-json",
      icon: FileJson,
      label: "Download JSON",
      description: "Complete world snapshot as a single .json file. Machine-readable, importable.",
    },
    {
      id: "download-zip",
      icon: FolderArchive,
      label: "Download ZIP",
      description: "World archive with worksheets organized by tool type. Includes README.",
    },
    {
      id: "save-version",
      icon: History,
      label: "Save Version",
      description: "Save a point-in-time snapshot to the database. Restorable later.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>World Snapshot</DialogTitle>
          <DialogDescription>
            Compile a complete snapshot of "{worldName}" — all worksheets, notes, connections, and entries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {actions.map(({ id, icon: Icon, label, description }) => (
            <button
              key={id}
              onClick={() => setAction(id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                action === id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:border-border/80 hover:bg-accent/5"
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${action === id ? "text-primary" : "text-t3"}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${action === id ? "text-foreground" : "text-t2"}`}>
                  {label}
                </span>
                <p className="text-xs text-t3 mt-0.5">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {action === "save-version" && (
          <div className="space-y-2">
            <Label htmlFor="version-label" className="text-xs uppercase tracking-wider text-t3">
              Version Label (optional)
            </Label>
            <Input
              id="version-label"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="e.g., Before restructuring biology"
              className="text-sm"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSnapshot} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader variant="inline" size="sm" className="mr-2" />
                Compiling...
              </>
            ) : action === "save-version" ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Version
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorldSnapshotDialog;
