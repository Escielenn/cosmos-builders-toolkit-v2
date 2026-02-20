import { type ReactNode } from "react";
import { Save, Printer, Download, Share2, StickyNote, ImageIcon, FolderOpen, Cloud, CloudOff } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolActionBarProps {
  onSave: () => void;
  onPrint: () => void;
  onExport: () => void;
  onShare?: () => void;
  onOpen?: () => void;
  exportLabel?: string;
  className?: string;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  isShared?: boolean;
  isCloudEnabled?: boolean;
  /** Optional slot for QuickExportButton or other extra actions */
  extraActions?: ReactNode;
  onNotesClick?: () => void;
  onMoodboardClick?: () => void;
  moodboardCount?: number;
}

const ToolActionBar = ({
  onSave,
  onPrint,
  onExport,
  onShare,
  onOpen,
  exportLabel = "Export",
  className = "",
  hasUnsavedChanges = false,
  isSaving = false,
  isShared = false,
  isCloudEnabled = false,
  extraActions,
  onNotesClick,
  onMoodboardClick,
  moodboardCount,
}: ToolActionBarProps) => {
  return (
    <div className={`no-print ${className}`}>
      <div className="flex flex-wrap gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasUnsavedChanges ? "default" : "outline"}
              size="sm"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader variant="inline" size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving..." : isCloudEnabled ? "Save" : "Save Draft"}
              {isCloudEnabled ? (
                <Cloud className="w-3 h-3 ml-1.5 text-green-500" />
              ) : (
                <CloudOff className="w-3 h-3 ml-1.5 opacity-50" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{isCloudEnabled ? "Cloud sync enabled" : "Local only"}</p>
          </TooltipContent>
        </Tooltip>
        {onOpen && (
          <Button variant="outline" size="sm" onClick={onOpen}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onPrint}>
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
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          {exportLabel}
        </Button>
        {extraActions}
        {onNotesClick && (
          <Button variant="outline" size="sm" onClick={onNotesClick}>
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </Button>
        )}
        {onMoodboardClick && (
          <Button variant="outline" size="sm" onClick={onMoodboardClick}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Moodboard
            {moodboardCount != null && moodboardCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {moodboardCount}
              </Badge>
            )}
          </Button>
        )}
        {onShare && (
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
            {isShared && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ToolActionBar;
