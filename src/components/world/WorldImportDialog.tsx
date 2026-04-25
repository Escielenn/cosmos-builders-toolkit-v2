import { useState, useRef } from "react";
import { Upload, FileJson, FolderArchive } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  importWorldFromJson,
  importWorldFromZip,
  createWorldFromSnapshot,
  type WorldSnapshot,
} from "@/lib/export/world-snapshot";

interface WorldImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WorldImportDialog = ({ open, onOpenChange }: WorldImportDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<WorldSnapshot | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      let snapshot: WorldSnapshot;

      if (file.name.endsWith(".zip")) {
        snapshot = await importWorldFromZip(file);
      } else if (file.name.endsWith(".json")) {
        snapshot = await importWorldFromJson(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please select a .json or .zip snapshot file.",
          variant: "destructive",
        });
        return;
      }

      setPreview(snapshot);
    } catch (error) {
      console.error("Failed to read snapshot:", error);
      toast({
        title: "INVALID SNAPSHOT.",
        description:
          error instanceof Error ? error.message : "Could not parse the file.",
        variant: "destructive",
      });
      setPreview(null);
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsImporting(true);

    try {
      const newWorldId = await createWorldFromSnapshot(preview);

      queryClient.invalidateQueries({ queryKey: ["worlds"] });

      toast({
        title: "WORLD IMPORTED.",
        description: `"${preview.world.name}" has been imported with ${preview.worksheets.length} worksheet${preview.worksheets.length === 1 ? "" : "s"}.`,
      });

      onOpenChange(false);
      setPreview(null);
      setSelectedFile(null);

      navigate(`/worlds/${newWorldId}`);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "IMPORT FAILED.",
        description:
          error instanceof Error ? error.message : "Could not import the world.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPreview(null);
      setSelectedFile(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import World</DialogTitle>
          <DialogDescription>
            Import a world from a StellarForge snapshot (.json or .zip).
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-sf-border hover:border-primary/30 hover:bg-accent/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-t3" />
              <div className="text-center">
                <p className="text-sm font-medium">Select snapshot file</p>
                <p className="text-xs text-t3 mt-1">
                  .json or .zip exported from StellarForge
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-sf-border">
              {selectedFile?.name.endsWith(".zip") ? (
                <FolderArchive className="w-5 h-5 text-t3 flex-shrink-0" />
              ) : (
                <FileJson className="w-5 h-5 text-t3 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile?.name}</p>
                <p className="text-xs text-t3">
                  Format v{preview.format_version}
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-t3 font-heading">
                  World Name
                </p>
                <p className="text-sm font-medium">{preview.world.name}</p>
              </div>
              {preview.world.description && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-t3 font-heading">
                    Description
                  </p>
                  <p className="text-sm text-t3 line-clamp-2">
                    {preview.world.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-t3 font-heading">
                    Worksheets
                  </p>
                  <p className="text-sm font-mono">{preview.worksheets.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-t3 font-heading">
                    Notes
                  </p>
                  <p className="text-sm font-mono">{preview.notes.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-t3 font-heading">
                    Connections
                  </p>
                  <p className="text-sm font-mono">{preview.connections.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-t3 font-heading">
                    Entries
                  </p>
                  <p className="text-sm font-mono">{preview.entries.length}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-t3">
              The world will be imported as "{preview.world.name} (imported)" under your account.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          {preview && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader variant="inline" size="sm" className="mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import World
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorldImportDialog;
