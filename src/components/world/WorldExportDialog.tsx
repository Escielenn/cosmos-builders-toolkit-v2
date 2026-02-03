import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
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

interface Worksheet {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface WorldExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldName: string;
  worksheets: Worksheet[];
}

const WorldExportDialog = ({
  open,
  onOpenChange,
  worldName,
  worksheets,
}: WorldExportDialogProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Group worksheets by tool type
      const worksheetsByTool = worksheets.reduce((acc, worksheet) => {
        const type = worksheet.tool_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({
          id: worksheet.id,
          title: worksheet.title || "Untitled",
          data: worksheet.data,
          created_at: worksheet.created_at,
          updated_at: worksheet.updated_at,
        });
        return acc;
      }, {} as Record<string, Array<{ id: string; title: string; data: Record<string, unknown>; created_at: string; updated_at: string }>>);

      const exportData = {
        worldName,
        exportedAt: new Date().toISOString(),
        totalWorksheets: worksheets.length,
        worksheets: worksheetsByTool,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${worldName.toLowerCase().replace(/\s+/g, "-")}-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "World Exported",
        description: `Exported ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"} from "${worldName}".`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your world. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export World</DialogTitle>
          <DialogDescription>
            Download all worksheets from "{worldName}" as a single JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">World Name</span>
            <span className="font-medium">{worldName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Worksheets</span>
            <span className="font-medium">{worksheets.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Export Format</span>
            <span className="font-medium">JSON</span>
          </div>
        </div>

        {worksheets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            This world has no worksheets to export yet. Create some worksheets using the tools above first.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || worksheets.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export World
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorldExportDialog;
