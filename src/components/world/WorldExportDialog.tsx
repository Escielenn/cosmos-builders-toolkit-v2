import { useState, useEffect } from "react";
import { Download, FileJson, FileType, FileSpreadsheet, FileText, BookOpen, ExternalLink, Unplug } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNotion } from "@/hooks/use-notion";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { compileWorldSnapshot } from "@/lib/export/world-snapshot";
import { formatWorldForExport } from "@/services/worldExportFormatter";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";

// Dynamic imports for heavy libraries
const loadDocxGenerator = () => import("@/lib/docx");
const loadMarkdownExport = () => import("@/lib/export/markdown-export");
const loadScrivenerExport = () => import("@/lib/export/scrivener-export");

interface Worksheet {
  id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

type ExportFormat = "json" | "text" | "word" | "markdown" | "scrivener" | "notion";

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
  const { isSubscribed } = useSubscription();
  const { connection, isConnected, isConnecting, isExporting: isNotionExporting, connect, disconnect, exportToNotion } = useNotion();
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingWorksheets, setIsLoadingWorksheets] = useState(false);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
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

  const PRO_FORMATS: ExportFormat[] = ["word", "markdown", "scrivener"];

  const handleExport = async () => {
    // Pro-tier gate for formatted exports
    if (PRO_FORMATS.includes(format) && !isSubscribed) {
      setShowUpgrade(true);
      return;
    }

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
            title: "EXPORT COMPLETE.",
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
            title: "EXPORT COMPLETE.",
            description: `Exported ${worksheets.length} worksheet${worksheets.length === 1 ? "" : "s"} as text file.`,
          });
          break;
        }

        case "word": {
          const { generateWorldDocx } = await loadDocxGenerator();
          const snapshot = await compileWorldSnapshot(worldId);
          const exportSections = formatWorldForExport(snapshot);
          await generateWorldDocx({
            worldName,
            worldDescription: snapshot.world.description || undefined,
            sections: exportSections,
          });
          toast({
            title: "EXPORT COMPLETE.",
            description: `Exported world as Word document with wiki prose, connections, and timeline.`,
          });
          break;
        }

        case "markdown": {
          const { downloadMarkdownZip } = await loadMarkdownExport();
          const snapshot = await compileWorldSnapshot(worldId);
          const exportSections = formatWorldForExport(snapshot);
          await downloadMarkdownZip(
            worldName,
            snapshot.world.description || undefined,
            exportSections,
          );
          toast({
            title: "EXPORT COMPLETE.",
            description: `Exported world as Markdown ZIP with wiki links and chronicle.`,
          });
          break;
        }

        case "scrivener": {
          const { downloadScrivenerProject } = await loadScrivenerExport();
          const snapshot = await compileWorldSnapshot(worldId);
          const exportSections = formatWorldForExport(snapshot);
          await downloadScrivenerProject(
            worldName,
            snapshot.world.description || undefined,
            exportSections,
          );
          toast({
            title: "EXPORT COMPLETE.",
            description: `Exported world as Scrivener project. Unzip and open .scriv folder.`,
          });
          break;
        }

        case "notion": {
          if (!isConnected) {
            toast({
              title: "Notion not connected",
              description: "Connect Notion workspace to proceed.",
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
              title: "EXPORT COMPLETE.",
              description: "Your world has been exported to Notion.",
            });
            if (result.pageUrl) {
              window.open(result.pageUrl, "_blank");
            }
          } else {
            toast({
              title: "EXPORT FAILED.",
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
        title: "EXPORT FAILED.",
        description: "Export generation failed. Retry when ready.",
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
            <Loader />
          </div>
        ) : (
          <>
            <Tabs defaultValue="json" className="w-full" onValueChange={(v) => setFormat(v as ExportFormat)}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="word">Word</TabsTrigger>
                <TabsTrigger value="markdown">MD</TabsTrigger>
                <TabsTrigger value="scrivener">Scriv</TabsTrigger>
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
                      Machine-readable format. For backups or importing into other tools.
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

              <TabsContent value="markdown" className="space-y-4 pt-4">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5"
                >
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">Markdown (.zip)</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Organized .md files with [[wiki-links]] and a chronicle folder. Opens in Obsidian, Notion, or any text editor.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scrivener" className="space-y-4 pt-4">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5"
                >
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">Scrivener Project (.zip)</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Full .scriv project with RTF documents. Unzip and open in Scrivener 3.
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
                        <Loader variant="inline" size="sm" className="mr-2" />
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
                <Loader variant="inline" size="sm" className="mr-2" />
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

        <div className="sf-export-sovereignty-footer">
          <hr className="sf-sovereignty-divider mt-0 mb-3" />
          <p>YOUR WORLDS ARE YOURS ALONE.</p>
          <p>Encrypted at rest. Never accessed. Never used for training. Ever.</p>
        </div>
      </DialogContent>

      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        toolName="Formatted World Export"
      />
    </Dialog>
  );
};

export default WorldExportDialog;
