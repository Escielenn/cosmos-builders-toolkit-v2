import { useState, useEffect, ReactElement } from "react";
import { Download, FileText, FileJson, Loader2, Eye, FileType, FileSpreadsheet, ExternalLink, Unplug } from "lucide-react";
import { useNotion } from "@/hooks/use-notion";
import { useAuth } from "@/contexts/AuthContext";
import { getExportPreferences, saveExportPreferences } from "@/lib/export-preferences";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { safeOpenWindow } from "@/lib/url-validation";

// Dynamic imports for heavy libraries - only loaded when actually exporting
const loadPdfRenderer = () => import("@react-pdf/renderer");
const loadTextGenerator = () => import("@/lib/text");
const loadDocxGenerator = () => import("@/lib/docx");

export type ExportFormat = "pdf-summary" | "pdf-full" | "text" | "word" | "json" | "notion";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  worldName?: string;
  worksheetTitle?: string;
  formState: unknown;
  summaryTemplate?: ReactElement;
  fullTemplate?: ReactElement;
  defaultFilename?: string;
}

const ExportDialog = ({
  open,
  onOpenChange,
  toolName,
  worldName,
  worksheetTitle,
  formState,
  summaryTemplate,
  fullTemplate,
  defaultFilename = "export",
}: ExportDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { connection, isConnected, isConnecting, isExporting, connect, disconnect, exportToNotion } = useNotion();
  const hasPdfTemplates = !!(summaryTemplate || fullTemplate);

  // Load stored preferences for initial state
  const prefs = getExportPreferences();
  const resolveInitialFormat = (): ExportFormat => {
    const saved = prefs.lastUsedFormat;
    // Validate saved format is usable with current templates
    if (saved === "pdf-summary" && summaryTemplate) return saved;
    if (saved === "pdf-full" && fullTemplate) return saved;
    if (saved === "text" || saved === "word" || saved === "json" || saved === "notion") return saved;
    // Fallback
    return hasPdfTemplates ? "pdf-summary" : "text";
  };

  const [format, setFormat] = useState<ExportFormat>(resolveInitialFormat);
  const [filename, setFilename] = useState(defaultFilename);
  const [includeWorldName, setIncludeWorldName] = useState(prefs.includeWorldName);
  const [includeDate, setIncludeDate] = useState(prefs.includeDate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Sync tab selection when dialog opens with a stored format
  const initialTab = format.startsWith("pdf") ? "pdf" : format === "notion" ? "notion" : format;
  useEffect(() => {
    if (open) {
      setFilename(defaultFilename);
    }
  }, [open, defaultFilename]);

  const getFileExtension = (fmt: ExportFormat): string => {
    switch (fmt) {
      case "pdf-summary":
      case "pdf-full":
        return "pdf";
      case "text":
        return "txt";
      case "word":
        return "docx";
      case "json":
        return "json";
      case "notion":
        return "";
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      switch (format) {
        case "json": {
          const dataStr = JSON.stringify(formState, null, 2);
          const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
          downloadBlob(blob, `${filename}.json`);
          toast({ title: "Exported", description: "Downloaded as JSON file." });
          break;
        }

        case "text": {
          const { generateGenericText } = await loadTextGenerator();
          const textContent = generateGenericText({
            toolName,
            worldName,
            worksheetTitle,
            data: formState as Record<string, unknown>,
          });
          const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
          downloadBlob(blob, `${filename}.txt`);
          toast({ title: "Exported", description: "Downloaded as text file." });
          break;
        }

        case "word": {
          const { generateDocx } = await loadDocxGenerator();
          await generateDocx({
            toolName,
            worldName,
            worksheetTitle,
            data: formState as Record<string, unknown>,
          });
          toast({ title: "Exported", description: "Downloaded as Word document." });
          break;
        }

        case "pdf-summary":
        case "pdf-full": {
          const template = format === "pdf-summary" ? summaryTemplate : fullTemplate;
          if (!template) {
            console.error("PDF template is undefined", { format, summaryTemplate: !!summaryTemplate, fullTemplate: !!fullTemplate });
            toast({
              title: "Template not available",
              description: "This PDF format is not yet available for this tool.",
              variant: "destructive",
            });
            return;
          }
          try {
            console.log("Loading PDF renderer...");
            const { pdf } = await loadPdfRenderer();
            console.log("Generating PDF blob...");
            const blob = await pdf(template).toBlob();
            console.log("PDF generated:", blob.size, "bytes");
            downloadBlob(blob, `${filename}.pdf`);
            toast({
              title: "PDF Generated",
              description: `${format === "pdf-summary" ? "Summary" : "Full report"} PDF downloaded.`,
            });
          } catch (pdfError) {
            console.error("PDF generation error:", pdfError);
            toast({
              title: "PDF generation failed",
              description: "There was an error creating the PDF. Please try again.",
              variant: "destructive",
            });
            return;
          }
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
            toolName,
            worldName,
            worksheetTitle,
            data: formState as Record<string, unknown>,
          });
          if (result.success) {
            toast({
              title: "Exported to Notion",
              description: "Your worksheet has been created in Notion.",
            });
            if (result.pageUrl) {
              safeOpenWindow(result.pageUrl, "notion");
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

      // Persist preferences after successful export
      saveExportPreferences({
        lastUsedFormat: format,
        includeWorldName,
        includeDate,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error generating your export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);

    try {
      switch (format) {
        case "json": {
          const dataStr = JSON.stringify(formState, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          window.open(URL.createObjectURL(blob), "_blank");
          break;
        }

        case "text": {
          const { generateGenericText } = await loadTextGenerator();
          const textContent = generateGenericText({
            toolName,
            worldName,
            worksheetTitle,
            data: formState as Record<string, unknown>,
          });
          const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
          window.open(URL.createObjectURL(blob), "_blank");
          break;
        }

        case "word": {
          toast({
            title: "Preview not available",
            description: "Word documents cannot be previewed. Download to view.",
          });
          break;
        }

        case "pdf-summary":
        case "pdf-full": {
          const template = format === "pdf-summary" ? summaryTemplate : fullTemplate;
          if (!template) {
            toast({
              title: "Template not available",
              description: "This PDF format is not yet available for this tool.",
              variant: "destructive",
            });
            return;
          }
          const { pdf } = await loadPdfRenderer();
          const blob = await pdf(template).toBlob();
          window.open(URL.createObjectURL(blob), "_blank");
          break;
        }
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast({
        title: "Preview failed",
        description: "There was an error generating the preview.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateFilename = () => {
    const parts = [toolName.toLowerCase().replace(/\s+/g, "-")];
    if (includeWorldName && worldName) {
      parts.push(worldName.toLowerCase().replace(/\s+/g, "-"));
    }
    if (includeDate) {
      parts.push(new Date().toISOString().split("T")[0]);
    }
    return parts.join("-");
  };

  const updateFilename = () => {
    setFilename(generateFilename());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Choose how you want to export your {toolName} worksheet.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={initialTab}
          className="w-full"
          onValueChange={(tab) => {
            switch (tab) {
              case "pdf":
                // Select the first available PDF format
                setFormat(summaryTemplate ? "pdf-summary" : fullTemplate ? "pdf-full" : "pdf-summary");
                break;
              case "text":
                setFormat("text");
                break;
              case "word":
                setFormat("word");
                break;
              case "json":
                setFormat("json");
                break;
              case "notion":
                setFormat("notion");
                break;
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="word">Word</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="notion">Notion</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 pt-4">
            {!hasPdfTemplates ? (
              <div className="text-center p-6 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">PDF export coming soon</p>
                <p className="text-sm mt-1">
                  PDF templates for this tool are not yet available. Use Text, Word, or JSON export instead.
                </p>
              </div>
            ) : (
              <RadioGroup
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
                className="space-y-2"
              >
                <div className={`flex items-center space-x-3 p-3 rounded-lg border border-border transition-colors ${summaryTemplate ? "hover:bg-accent/10 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                  <RadioGroupItem value="pdf-summary" id="pdf-summary" disabled={!summaryTemplate} />
                  <Label htmlFor="pdf-summary" className={`flex-1 ${summaryTemplate ? "cursor-pointer" : "cursor-not-allowed"}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Summary (1-2 pages)</span>
                      {!summaryTemplate && <span className="text-xs text-muted-foreground">(Coming soon)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Key results and variable values only
                    </p>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-3 rounded-lg border border-border transition-colors ${fullTemplate ? "hover:bg-accent/10 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                  <RadioGroupItem value="pdf-full" id="pdf-full" disabled={!fullTemplate} />
                  <Label htmlFor="pdf-full" className={`flex-1 ${fullTemplate ? "cursor-pointer" : "cursor-not-allowed"}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Full Report</span>
                      {!fullTemplate && <span className="text-xs text-muted-foreground">(Coming soon)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      All content including notes and worldbuilding
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5 cursor-pointer"
              onClick={() => setFormat("text")}
            >
              <FileType className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <span className="font-medium">Plain Text (.txt)</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Universal format, works everywhere. ASCII formatted with sections and tables.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="word" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5 cursor-pointer"
              onClick={() => setFormat("word")}
            >
              <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <span className="font-medium">Microsoft Word (.docx)</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Fully editable document with formatting. Great for collaboration and further editing.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5 cursor-pointer"
              onClick={() => setFormat("json")}
            >
              <FileJson className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <span className="font-medium">JSON Export (.json)</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Machine-readable data file. Perfect for backups or importing into other tools.
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
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/5 cursor-pointer"
                  onClick={() => setFormat("notion")}
                >
                  <img
                    src="https://www.notion.so/images/favicon.ico"
                    alt="Notion"
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Export to Notion</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a new page in your Notion workspace with all worksheet data.
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
                  Connect your Notion workspace to export worksheets directly as pages.
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

        {format !== "notion" && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWorld"
                    checked={includeWorldName}
                    onCheckedChange={(checked) => {
                      setIncludeWorldName(checked as boolean);
                      setTimeout(updateFilename, 0);
                    }}
                  />
                  <Label htmlFor="includeWorld" className="text-sm cursor-pointer">
                    Include world name in filename
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDate"
                    checked={includeDate}
                    onCheckedChange={(checked) => {
                      setIncludeDate(checked as boolean);
                      setTimeout(updateFilename, 0);
                    }}
                  />
                  <Label htmlFor="includeDate" className="text-sm cursor-pointer">
                    Include date in filename
                  </Label>
                </div>
              </div>
            </div>

            {/* Filename */}
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-sm font-medium">
                Filename
              </Label>
              <div className="flex gap-2">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center text-sm text-muted-foreground">
                  .{getFileExtension(format)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4">
          {format !== "notion" && (
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isGenerating || isPreviewing || format === "word"}
            >
              {isPreviewing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Preview
            </Button>
          )}
          <Button
            onClick={handleExport}
            disabled={isGenerating || isPreviewing || isExporting || (format === "notion" && !isConnected)}
          >
            {isGenerating || isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : format === "notion" ? (
              <ExternalLink className="w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {format === "notion" ? "Export to Notion" : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
