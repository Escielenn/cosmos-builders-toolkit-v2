import { Save, Printer, Download, FileText } from "lucide-react";
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
}

const ToolActionBar = ({
  onSave,
  onPrint,
  onExport,
  exportLabel = "Export JSON",
  className = "",
}: ToolActionBarProps) => {
  return (
    <GlassPanel className={`p-6 no-print ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button variant="outline" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Draft
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
