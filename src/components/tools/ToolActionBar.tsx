import { Save, Printer, Download, FileText, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolActionBarProps {
  onSave: () => void;
  onPrint: () => void;
  onExport: () => void;
  exportLabel?: string;
  className?: string;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
}

const ToolActionBar = ({
  onSave,
  onPrint,
  onExport,
  exportLabel = "Export",
  className = "",
  hasUnsavedChanges = false,
  isSaving = false,
}: ToolActionBarProps) => {
  return (
    <GlassPanel className={`p-6 no-print ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          variant={hasUnsavedChanges ? "default" : "outline"}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? "Saving..." : hasUnsavedChanges ? "Save to Cloud" : "Save Draft"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print / PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              Use your browser's print dialog and select "Save as PDF" to export as a PDF file.
            </p>
          </TooltipContent>
        </Tooltip>
        <Button onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          {exportLabel}
        </Button>
      </div>
    </GlassPanel>
  );
};

export default ToolActionBar;
