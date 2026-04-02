/**
 * One-click export button that uses the user's saved preferences.
 * Generates and downloads immediately — no dialog needed.
 */

import { useState, type ReactElement } from "react";
import { Zap } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useExportPreferences } from "@/hooks/use-export-preferences";
import { setActiveTheme, resetActiveTheme } from "@/lib/pdf/styles";

interface QuickExportButtonProps {
  toolName: string;
  worldName?: string;
  worksheetTitle?: string;
  formState: unknown;
  summaryTemplate?: ReactElement;
  fullTemplate?: ReactElement;
  defaultFilename?: string;
  className?: string;
}

const QuickExportButton = ({
  toolName,
  worldName,
  worksheetTitle,
  formState,
  summaryTemplate,
  fullTemplate,
  defaultFilename = "export",
  className,
}: QuickExportButtonProps) => {
  const { toast } = useToast();
  const { preferences } = useExportPreferences();
  const [isExporting, setIsExporting] = useState(false);

  const buildFilename = () => {
    const parts = [toolName.toLowerCase().replace(/\s+/g, "-")];
    if (preferences.includeWorldName && worldName) {
      parts.push(worldName.toLowerCase().replace(/\s+/g, "-"));
    }
    if (preferences.includeDate) {
      parts.push(new Date().toISOString().split("T")[0]);
    }
    return parts.join("-") || defaultFilename;
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolveFormat = () => {
    const fmt = preferences.defaultFormat;
    // Validate the saved format works with available templates
    if (fmt === "pdf-summary" && summaryTemplate) return fmt;
    if (fmt === "pdf-full" && fullTemplate) return fmt;
    if (fmt === "pdf-summary" || fmt === "pdf-full") {
      // PDF preference but no matching template — fallback to whatever is available
      if (summaryTemplate) return "pdf-summary" as const;
      if (fullTemplate) return "pdf-full" as const;
      return "json" as const;
    }
    // Non-PDF formats are always available
    if (fmt === "text" || fmt === "word" || fmt === "json") return fmt;
    return "json" as const;
  };

  const handleQuickExport = async () => {
    setIsExporting(true);
    const format = resolveFormat();
    const filename = buildFilename();

    try {
      switch (format) {
        case "json": {
          const dataStr = JSON.stringify(formState, null, 2);
          const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
          downloadBlob(blob, `${filename}.json`);
          toast({ title: "Exported", description: "Downloaded as JSON." });
          break;
        }

        case "text": {
          const { generateGenericText } = await import("@/lib/text");
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
          const { generateDocx } = await import("@/lib/docx");
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
              title: "Template unavailable",
              description: "PDF template not available for this tool. Try JSON or Text.",
              variant: "destructive",
            });
            return;
          }
          const { pdf } = await import("@react-pdf/renderer");
          setActiveTheme(preferences.themeId);
          let blob: Blob;
          try {
            blob = await pdf(template).toBlob();
          } finally {
            resetActiveTheme();
          }
          const pdfBlob = new Blob([blob], { type: "application/pdf" });
          downloadBlob(pdfBlob, `${filename}.pdf`);
          toast({
            title: "Exported",
            description: `Downloaded as ${format === "pdf-summary" ? "summary" : "full report"} PDF.`,
          });
          break;
        }
      }
    } catch (error) {
      console.error("Quick export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error generating your export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatLabel = (() => {
    const fmt = resolveFormat();
    switch (fmt) {
      case "pdf-summary": return "PDF Summary";
      case "pdf-full": return "PDF Full";
      case "text": return "Text";
      case "word": return "Word";
      case "json": return "JSON";
      default: return "Export";
    }
  })();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickExport}
          disabled={isExporting}
          className={className}
        >
          {isExporting ? (
            <Loader variant="inline" size="sm" className="mr-1.5" />
          ) : (
            <Zap className="w-4 h-4 mr-1.5" />
          )}
          Quick Export
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          One-click export as {formatLabel}. Change defaults in Profile &gt; Export Settings.
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default QuickExportButton;
