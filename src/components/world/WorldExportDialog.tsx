import { useState, useEffect } from "react";
import { Download, Loader2, FileJson, FileType, FileSpreadsheet, ExternalLink, Unplug } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNotion } from "@/hooks/use-notion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Dynamic imports for heavy libraries
const loadDocxGenerator = () => import("@/lib/docx");

interface Worksheet {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

type ExportFormat = "json" | "text" | "word" | "notion";

interface WorldExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldName: string;
  worldId: string;
}

const WorldExportDialog = ({
  open,
  onOpenChange,
  worldName,
  worldId,
}: WorldExportDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { connection, isConnected, isConnecting, isExporting: isNotionExporting, connect, disconnect, exportToNotion } = useNotion();
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingWorksheets, setIsLoadingWorksheets] = useState(false);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [format, setFormat] = useState<ExportFormat>("json");

  // Fetch worksheets when dialog opens
  useEffect(() => {
    if (open && worldId) {
      setIsLoadingWorksheets(true);
      supabase
        .from("worksheets")
        .select("*")
        .eq("world_id", worldId)
        .order("updated_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to fetch worksheets:", error);
            toast({
              title: "Error loading worksheets",
              description: "Could not load worksheets for export.",
              variant: "destructive",
            });
          } else {
            setWorksheets(data as Worksheet[]);
          }
          setIsLoadingWorksheets(false);
        });
    }
  }, [open, worldId, toast]);

  const getGroupedWorksheets = () => {
    return worksheets.reduce((acc, worksheet) => {
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
  };

  const generateFilename = (ext: string) => {
    return `${worldName.toLowerCase().replace(/\s+/g, "-")}-export-${new Date().toISOString().split("T")[0]}.${ext}`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const worksheetsByTool = getGroupedWorksheets();
      const exportData = {
        worldName,
        exportedAt: new Date().toISOString(),
        totalWorksheets: worksheets.length,
        worksheets: worksheetsByTool,
      };

      switch (format) {
        case "json": {
          const dataStr = JSON.stringify(exportData, null, 2);
          const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
          downloadBlob(blob, generateFilename("json"));
          toast({
            title: "World Exported",
            description: `Exported ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"} as JSON.`,
          });
          break;
        }

        case "text": {
          let textContent = `${worldName.toUpperCase()}\n`;
          textContent += `${"=".repeat(worldName.length)}\n\n`;
          textContent += `Exported: ${new Date().toLocaleDateString()}\n`;
          textContent += `Total Worksheets: ${worksheets.length}\n\n`;

          for (const [toolType, toolWorksheets] of Object.entries(worksheetsByTool)) {
            const formattedToolName = toolType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            textContent += `\n${formattedToolName}\n`;
            textContent += `${"-".repeat(formattedToolName.length)}\n\n`;

            for (const worksheet of toolWorksheets) {
              textContent += `  ${worksheet.title}\n`;
              textContent += `  Updated: ${new Date(worksheet.updated_at).toLocaleDateString()}\n`;
              textContent += `  ${JSON.stringify(worksheet.data, null, 2).split("\n").join("\n  ")}\n\n`;
            }
          }

          const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
          downloadBlob(blob, generateFilename("txt"));
          toast({
            title: "World Exported",
            description: `Exported ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"} as text file.`,
          });
          break;
        }

        case "word": {
          const { generateDocx } = await loadDocxGenerator();
          await generateDocx({
            toolName: `${worldName} - Complete World Export`,
            worldName,
            worksheetTitle: "All Worksheets",
            data: exportData as Record<string, unknown>,
          });
          toast({
            title: "World Exported",
            description: `Exported ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"} as Word document.`,
          });
          break;
        }

        case "notion": {
          if (!isConnected) {
            toast({
              title: "Notion not connected",
              description: "Please connect your Notion workspace first.",
              variant: "destructive",
            });
            return;
          }
          const result = await exportToNotion({
            toolName: `${worldName} - World Export`,
            worldName,
            worksheetTitle: "Complete World Export",
            data: exportData as Record<string, unknown>,
          });
          if (result.success) {
            toast({
              title: "Exported to Notion",
              description: "Your world has been exported to Notion.",
            });
            if (result.pageUrl) {
              window.open(result.pageUrl, "_blank");
            }
          } else {
            toast({
              title: "Export failed",
              description: result.error || "Failed to export to Notion.",
              variant: "destructive",
            });
            return;
          }
          break;
        }
      }

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export World</DialogTitle>
          <DialogDescription>
            {isLoadingWorksheets ? (
              "Loading worksheets..."
            ) : (
              <>Export all {worksheets.length} worksheet{worksheets.length === 1 ? "" : "s"} from "{worldName}".</>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoadingWorksheets ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Tabs defaultValue="json" className="w-full" onValueChange={(v) => setFormat(v as ExportFormat)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="word">Word</TabsTrigger>
                <TabsTrigger value="notion">Notion</TabsTrigger>
              </TabsList>

              <TabsContent value="json" className="space-y-4 pt-4">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5"
                >
                  <FileJson className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">JSON Export (.json)</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Machine-readable format. Perfect for backups or importing into other tools.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 pt-4">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5"
                >
                  <FileType className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">Plain Text (.txt)</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Universal format, works everywhere. Human-readable with sections.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="word" className="space-y-4 pt-4">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5"
                >
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">Microsoft Word (.docx)</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fully editable document with formatting. Great for sharing.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notion" className="space-y-4 pt-4">
                {!user ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <p>Please sign in to export to Notion.</p>
                  </div>
                ) : isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5">
                      <img
                        src="https://www.notion.so/images/favicon.ico"
                        alt="Notion"
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Export to Notion</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create a new page in your Notion workspace with all world data.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {connection?.workspace_icon ? (
                          connection.workspace_icon.startsWith("http") ? (
                            <img
                              src={connection.workspace_icon}
                              alt=""
                              className="w-6 h-6 rounded flex-shrink-0"
                            />
                          ) : (
                            <span className="text-lg flex-shrink-0">{connection.workspace_icon}</span>
                          )
                        ) : (
                          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                        <span className="text-sm truncate">
                          Connected to <strong className="truncate">{connection?.workspace_name || "Notion"}</strong>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={disconnect}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <Unplug className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <img
                      src="https://www.notion.so/images/favicon.ico"
                      alt="Notion"
                      className="w-12 h-12 mx-auto opacity-50"
                    />
                    <p className="text-muted-foreground">
                      Connect your Notion workspace to export worlds directly as pages.
                    </p>
                    <Button onClick={connect} disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Connect Notion
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {worksheets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                This world has no worksheets to export yet.
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || isNotionExporting || isLoadingWorksheets || worksheets.length === 0 || (format === "notion" && !isConnected)}
          >
            {isExporting || isNotionExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : format === "notion" ? (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Export to Notion
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

export default WorldExportDialog;
