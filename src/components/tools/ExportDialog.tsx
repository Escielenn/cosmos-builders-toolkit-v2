import { useState, ReactElement } from "react";
import { Download, FileText, FileJson, Loader2, Eye, FileType, FileSpreadsheet } from "lucide-react";
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

// Dynamic imports for heavy libraries - only loaded when actually exporting
const loadPdfRenderer = () => import("@react-pdf/renderer");
const loadTextGenerator = () => import("@/lib/text");
const loadDocxGenerator = () => import("@/lib/docx");

export type ExportFormat = "pdf-summary" | "pdf-full" | "text" | "word" | "json";

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
  const [format, setFormat] = useState<ExportFormat>("pdf-summary");
  const [filename, setFilename] = useState(defaultFilename);
  const [includeWorldName, setIncludeWorldName] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

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
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      switch (format) {
        case "json": {
          const dataStr = JSON.stringify(formState, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
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
            toast({
              title: "Template not available",
              description: "This PDF format is not yet available for this tool.",
              variant: "destructive",
            });
            return;
          }
          const { pdf } = await loadPdfRenderer();
          const blob = await pdf(template).toBlob();
          downloadBlob(blob, `${filename}.pdf`);
          toast({
            title: "PDF Generated",
            description: `${format === "pdf-summary" ? "Summary" : "Full report"} PDF downloaded.`,
          });
          break;
        }
      }

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

        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="word">Word</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 pt-4">
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <RadioGroupItem value="pdf-summary" id="pdf-summary" />
                <Label htmlFor="pdf-summary" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Summary (1-2 pages)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Key results and variable values only
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <RadioGroupItem value="pdf-full" id="pdf-full" />
                <Label htmlFor="pdf-full" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Full Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All content including notes and worldbuilding
                  </p>
                </Label>
              </div>
            </RadioGroup>
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
        </Tabs>

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

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4">
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
          <Button onClick={handleExport} disabled={isGenerating || isPreviewing}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
