import { useState, ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText, FileJson, Loader2, Eye } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export type ExportFormat = "summary" | "full" | "json";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  worldName?: string;
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
  formState,
  summaryTemplate,
  fullTemplate,
  defaultFilename = "export",
}: ExportDialogProps) => {
  const { toast } = useToast();
  const [format, setFormat] = useState<ExportFormat>("summary");
  const [filename, setFilename] = useState(defaultFilename);
  const [includeWorldName, setIncludeWorldName] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      if (format === "json") {
        // Export as JSON
        const dataStr = JSON.stringify(formState, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Exported",
          description: "Downloaded as JSON file.",
        });
      } else {
        // Export as PDF
        const template = format === "summary" ? summaryTemplate : fullTemplate;

        if (!template) {
          toast({
            title: "Template not available",
            description: "This export format is not yet available for this tool.",
            variant: "destructive",
          });
          return;
        }

        const blob = await pdf(template).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "PDF Generated",
          description: `${format === "summary" ? "Summary" : "Full report"} PDF downloaded.`,
        });
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
    if (format === "json") {
      // For JSON, just show the data in a new tab
      const dataStr = JSON.stringify(formState, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      return;
    }

    setIsPreviewing(true);

    try {
      const template = format === "summary" ? summaryTemplate : fullTemplate;

      if (!template) {
        toast({
          title: "Template not available",
          description: "This export format is not yet available for this tool.",
          variant: "destructive",
        });
        return;
      }

      const blob = await pdf(template).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
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

  // Generate filename based on options
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

  // Update filename when options change
  const updateFilename = () => {
    setFilename(generateFilename());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Choose how you want to export your {toolName} worksheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Template</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="flex-1 cursor-pointer">
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
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Full Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All content including notes and worldbuilding
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">JSON Export</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Machine-readable data file
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

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
                .{format === "json" ? "json" : "pdf"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isGenerating || isPreviewing}
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
