import { useState, useEffect, ReactElement } from "react";
import { Download, FileText, FileJson, Eye, FileType, FileSpreadsheet, ExternalLink, Unplug, Check, Table2 } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useNotion } from "@/hooks/use-notion";
import { useAuth } from "@/contexts/AuthContext";
import { useExportPreferences } from "@/hooks/use-export-preferences";
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
import { EXPORT_THEMES } from "@/lib/export/themes";
import { cn } from "@/lib/utils";
import { SocialShareButtons } from "@/components/sharing/SocialShareButtons";

import { setActiveTheme, resetActiveTheme } from "@/lib/pdf/styles";

// Dynamic imports for heavy libraries - only loaded when actually exporting
const loadPdfRenderer = () => import("@react-pdf/renderer");
const loadTextGenerator = () => import("@/lib/text");
const loadDocxGenerator = () => import("@/lib/docx");
const loadCsvExport = () => import("@/lib/export/csv-export");

export type ExportFormat = "pdf-summary" | "pdf-full" | "text" | "word" | "json" | "csv" | "notion";

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
  const { preferences: persistedPrefs, updatePreferences } = useExportPreferences();
  const hasPdfTemplates = !!(summaryTemplate || fullTemplate);

  // Load stored preferences for initial state
  const resolveInitialFormat = (): ExportFormat => {
    const saved = persistedPrefs.defaultFormat;
    // Validate saved format is usable with current templates
    if (saved === "pdf-summary" && summaryTemplate) return saved;
    if (saved === "pdf-full" && fullTemplate) return saved;
    if (saved === "text" || saved === "word" || saved === "json" || saved === "csv" || saved === "notion") return saved;
    // Fallback
    return hasPdfTemplates ? "pdf-summary" : "text";
  };

  const [format, setFormat] = useState<ExportFormat>(resolveInitialFormat);
  const [filename, setFilename] = useState(defaultFilename);
  const [includeWorldName, setIncludeWorldName] = useState(persistedPrefs.includeWorldName);
  const [includeDate, setIncludeDate] = useState(persistedPrefs.includeDate);
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
        return isTimelineData(formState) ? "md" : "txt";
      case "word":
        return "docx";
      case "json":
        return "json";
      case "csv":
        return "csv";
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
          toast({ title: "EXPORT COMPLETE.", description: "Downloaded as JSON file." });
          break;
        }

        case "csv": {
          const { worksheetToCSV, downloadCSV } = await loadCsvExport();
          const csvContent = worksheetToCSV(toolName, formState as Record<string, unknown>);
          downloadCSV(csvContent, `${filename}.csv`);
          toast({ title: "EXPORT COMPLETE.", description: "Downloaded as CSV file." });
          break;
        }

        case "text": {
          const isTimeline = isTimelineData(formState);
          if (isTimeline) {
            const { generateTimelineMarkdown } = await loadTextGenerator();
            const mdContent = generateTimelineMarkdown({
              worksheetTitle,
              worldName,
              state: formState as import("@/lib/timeline/types").TimelineState,
            });
            const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
            downloadBlob(blob, `${filename}.md`);
            toast({ title: "EXPORT COMPLETE.", description: "Downloaded as Markdown file." });
          } else {
            const { generateGenericText } = await loadTextGenerator();
            const textContent = generateGenericText({
              toolName,
              worldName,
              worksheetTitle,
              data: formState as Record<string, unknown>,
            });
            const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
            downloadBlob(blob, `${filename}.txt`);
            toast({ title: "EXPORT COMPLETE.", description: "TRANSMISSION LOGGED (TXT)." });
          }
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
          toast({ title: "EXPORT COMPLETE.", description: "TRANSMISSION LOGGED (DOCX)." });
          break;
        }

        case "pdf-summary":
        case "pdf-full": {
          const template = format === "pdf-summary" ? summaryTemplate : fullTemplate;
          if (!template) {
            console.error("PDF template is undefined", { format, summaryTemplate: !!summaryTemplate, fullTemplate: !!fullTemplate });
            toast({
              title: "TEMPLATE NOT AVAILABLE.",
              description: "This PDF format is not yet available for this tool.",
              variant: "destructive",
            });
            return;
          }
          try {
            console.log("Loading PDF renderer...");
            const { pdf } = await loadPdfRenderer();
            console.log("Generating PDF blob...");
            setActiveTheme(persistedPrefs.themeId);
            let blob: Blob;
            try {
              blob = await pdf(template).toBlob();
            } finally {
              resetActiveTheme();
            }
            // Ensure explicit PDF MIME type for reliable browser handling
            const pdfBlob = new Blob([blob], { type: "application/pdf" });
            console.log("PDF generated:", pdfBlob.size, "bytes");
            downloadBlob(pdfBlob, `${filename}.pdf`);
            toast({
              title: "PDF Generated",
              description: `${format === "pdf-summary" ? "Summary" : "Full report"} PDF downloaded.`,
            });
          } catch (pdfError) {
            console.error("PDF generation error:", pdfError);
            const errMsg = pdfError instanceof Error ? pdfError.message : String(pdfError);
            toast({
              title: "PDF generation failed",
              description: errMsg.length > 120 ? errMsg.slice(0, 120) + "..." : errMsg,
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
              description: "Connect Notion workspace to proceed.",
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
              title: "EXPORT COMPLETE.",
              description: "Your worksheet has been created in Notion.",
            });
            if (result.pageUrl) {
              safeOpenWindow(result.pageUrl, "notion");
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

      // Persist preferences after successful export
      updatePreferences({
        defaultFormat: format,
        includeWorldName,
        includeDate,
      });
      // Also sync to legacy localStorage for backwards compat
      saveExportPreferences({
        lastUsedFormat: format,
        includeWorldName,
        includeDate,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "EXPORT FAILED.",
        description: "Export generation failed. Retry when ready.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /** Open a blob URL in a new tab and revoke after a delay to free memory. */
  const previewBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Revoke after a generous delay so the new tab finishes loading
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handlePreview = async () => {
    setIsPreviewing(true);

    try {
      switch (format) {
        case "json": {
          const dataStr = JSON.stringify(formState, null, 2);
          previewBlob(new Blob([dataStr], { type: "application/json" }));
          break;
        }

        case "csv": {
          const { worksheetToCSV } = await loadCsvExport();
          const csvPreview = worksheetToCSV(toolName, formState as Record<string, unknown>);
          previewBlob(new Blob([csvPreview], { type: "text/csv;charset=utf-8" }));
          break;
        }

        case "text": {
          if (isTimelineData(formState)) {
            const { generateTimelineMarkdown } = await loadTextGenerator();
            const mdContent = generateTimelineMarkdown({
              worksheetTitle,
              worldName,
              state: formState as import("@/lib/timeline/types").TimelineState,
            });
            previewBlob(new Blob([mdContent], { type: "text/markdown;charset=utf-8" }));
          } else {
            const { generateGenericText } = await loadTextGenerator();
            const textContent = generateGenericText({
              toolName,
              worldName,
              worksheetTitle,
              data: formState as Record<string, unknown>,
            });
            previewBlob(new Blob([textContent], { type: "text/plain;charset=utf-8" }));
          }
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
              title: "TEMPLATE NOT AVAILABLE.",
              description: "This PDF format is not yet available for this tool.",
              variant: "destructive",
            });
            return;
          }
          const { pdf } = await loadPdfRenderer();
          setActiveTheme(persistedPrefs.themeId);
          let blob: Blob;
          try {
            blob = await pdf(template).toBlob();
          } finally {
            resetActiveTheme();
          }
          // Wrap with explicit MIME type so browsers open the PDF viewer
          previewBlob(new Blob([blob], { type: "application/pdf" }));
          break;
        }
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast({
        title: "PREVIEW FAILED.",
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
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Delay revocation so browser has time to initiate download
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
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
              case "csv":
                setFormat("csv");
                break;
              case "notion":
                setFormat("notion");
                break;
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="word">Word</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="notion">Notion</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 pt-4">
            {!hasPdfTemplates ? (
              <div className="text-center p-6 text-t3">
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
                <div className={`flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive transition-colors ${summaryTemplate ? "hover:bg-accent/10 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                  <RadioGroupItem value="pdf-summary" id="pdf-summary" disabled={!summaryTemplate} />
                  <Label htmlFor="pdf-summary" className={`flex-1 ${summaryTemplate ? "cursor-pointer" : "cursor-not-allowed"}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-t3" />
                      <span className="font-medium">Summary (1-2 pages)</span>
                      {!summaryTemplate && <span className="text-xs text-t3">(Coming soon)</span>}
                    </div>
                    <p className="text-xs text-t3 mt-1">
                      Key results and variable values only
                    </p>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive transition-colors ${fullTemplate ? "hover:bg-accent/10 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                  <RadioGroupItem value="pdf-full" id="pdf-full" disabled={!fullTemplate} />
                  <Label htmlFor="pdf-full" className={`flex-1 ${fullTemplate ? "cursor-pointer" : "cursor-not-allowed"}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-t3" />
                      <span className="font-medium">Full Report</span>
                      {!fullTemplate && <span className="text-xs text-t3">(Coming soon)</span>}
                    </div>
                    <p className="text-xs text-t3 mt-1">
                      All content including notes and worldbuilding
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            )}

            {/* Inline theme picker */}
            <div className="pt-3 border-t border-sf-line">
              <Label className="text-xs text-t3 mb-2 block">PDF Theme</Label>
              <div className="flex gap-2 flex-wrap">
                {EXPORT_THEMES.map((theme) => {
                  const isSelected = persistedPrefs.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updatePreferences({ themeId: theme.id })}
                      title={theme.name}
                      className={cn(
                        "flex gap-0.5 p-1.5 rounded-md border transition-all",
                        isSelected
                          ? "border-primary ring-1 ring-primary/50"
                          : "border-sf-line-interactive hover:border-primary"
                      )}
                    >
                      {theme.swatch.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-sm border border-sf-line"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive bg-accent/5 cursor-pointer"
              onClick={() => setFormat("text")}
            >
              <FileType className="w-5 h-5 text-t3" />
              <div className="flex-1">
                <span className="font-medium">
                  {isTimelineData(formState) ? "Markdown (.md)" : "Plain Text (.txt)"}
                </span>
                <p className="text-xs text-t3 mt-1">
                  {isTimelineData(formState)
                    ? "Structured Markdown with tracks, events, and links. Great for documentation and wikis."
                    : "Universal format, works everywhere. ASCII formatted with sections and tables."}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="word" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive bg-accent/5 cursor-pointer"
              onClick={() => setFormat("word")}
            >
              <FileSpreadsheet className="w-5 h-5 text-t3" />
              <div className="flex-1">
                <span className="font-medium">Microsoft Word (.docx)</span>
                <p className="text-xs text-t3 mt-1">
                  Fully editable document with formatting. Great for collaboration and further editing.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive bg-accent/5 cursor-pointer"
              onClick={() => setFormat("json")}
            >
              <FileJson className="w-5 h-5 text-t3" />
              <div className="flex-1">
                <span className="font-medium">JSON Export (.json)</span>
                <p className="text-xs text-t3 mt-1">
                  Machine-readable data file. For backups or importing into other tools.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 pt-4">
            <div
              className="flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive bg-accent/5 cursor-pointer"
              onClick={() => setFormat("csv")}
            >
              <Table2 className="w-5 h-5 text-t3" />
              <div className="flex-1">
                <span className="font-medium">CSV Export (.csv)</span>
                <p className="text-xs text-t3 mt-1">
                  Spreadsheet-compatible format. Flattened field/value rows for Excel, Google Sheets, or data analysis.
                </p>
              </div>
            </div>
            {formState && typeof formState === "object" && (
              <div className="rounded-none border border-sf-line bg-muted/30 p-3 max-h-40 overflow-auto">
                <p className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3 mb-2">
                  Preview
                </p>
                <pre className="text-xs font-mono text-t3 whitespace-pre-wrap">
                  {(() => {
                    try {
                      const pairs = Object.entries(formState as Record<string, unknown>).slice(0, 8);
                      return pairs
                        .map(([k, v]) => {
                          const val = typeof v === "object" ? JSON.stringify(v).slice(0, 50) : String(v ?? "").slice(0, 50);
                          return `${k}: ${val}`;
                        })
                        .join("\n") + (Object.keys(formState as Record<string, unknown>).length > 8 ? "\n..." : "");
                    } catch {
                      return "Preview not available";
                    }
                  })()}
                </pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notion" className="space-y-4 pt-4">
            {!user ? (
              <div className="text-center p-6 text-t3">
                <p>Please sign in to export to Notion.</p>
              </div>
            ) : isConnected ? (
              <div className="space-y-4">
                <div
                  className="flex items-center space-x-3 p-3 rounded-none border border-sf-line-interactive bg-accent/5 cursor-pointer"
                  onClick={() => setFormat("notion")}
                >
                  <img
                    src="https://www.notion.so/images/favicon.ico"
                    alt="Notion"
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Export to Notion</span>
                    <p className="text-xs text-t3 mt-1">
                      Create a new page in your Notion workspace with all worksheet data.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-none bg-muted/50 overflow-hidden">
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
                    className="text-t3 hover:text-sf-crimson flex-shrink-0"
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
                <p className="text-t3">
                  Connect your Notion workspace to export worksheets directly as pages.
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

        {format !== "notion" && (
          <div className="space-y-4 pt-4 border-t border-sf-line">
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
                <span className="flex items-center text-sm text-t3">
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
                <Loader variant="inline" size="sm" className="mr-2" />
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
              <Loader variant="inline" size="sm" className="mr-2" />
            ) : format === "notion" ? (
              <ExternalLink className="w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {format === "notion" ? "Export to Notion" : "Download"}
          </Button>
        </div>

        {/* Social sharing */}
        <div className="mt-4 pt-4 border-t border-sf-line">
          <SocialShareButtons
            url={window.location.href}
            title={`${toolName}, Built with StellarForge`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

/** Detect if formState is timeline data (has tracks + events arrays). */
function isTimelineData(formState: unknown): boolean {
  if (!formState || typeof formState !== "object") return false;
  const obj = formState as Record<string, unknown>;
  return Array.isArray(obj.tracks) && Array.isArray(obj.events);
}

export default ExportDialog;
