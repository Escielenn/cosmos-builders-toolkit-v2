import { type ReactNode, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Printer, Download, Share2, StickyNote, ImageIcon, FolderOpen, Cloud, CloudOff, ChevronUp, BookOpen, ChevronDown, MoreHorizontal } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLinkedEntryId } from "@/hooks/use-linked-entry";

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
  onWikiClick?: () => void;
  /** Pass worldId + worksheetId to auto-show a "Wiki" button when a linked entry exists */
  worldId?: string;
  worksheetId?: string;
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
  onWikiClick,
  worldId,
  worksheetId,
}: ToolActionBarProps) => {
  const navigate = useNavigate();
  const barRef = useRef<HTMLDivElement>(null);

  // Auto-resolve linked wiki entry for the "Wiki" button
  const { data: linkedEntryId } = useLinkedEntryId(worldId, worksheetId);
  const handleWikiClick = onWikiClick ?? (
    linkedEntryId && worldId
      ? () => navigate(`/worlds/${worldId}/pages/${linkedEntryId}`)
      : undefined
  );
  const [showBottomBar, setShowBottomBar] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowBottomBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <div ref={barRef} className={`no-print ${className}`}>
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
        {/* One Export control instead of three competing ones. Quick Export,
            the format dialog, and Print/PDF used to sit side by side in this
            row, which read as three different features. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {exportLabel}
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 bg-sf-surface/95 backdrop-blur-sf-side border-sf-border rounded-none">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-[1.5px] text-t3 font-medium">
              Export
            </DropdownMenuLabel>
            {extraActions && (
              <div className="px-1 py-1 [&_button]:w-full [&_button]:justify-start">
                {extraActions}
              </div>
            )}
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Choose format…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print / Save as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onNotesClick && (
          <Button variant="outline" size="sm" onClick={onNotesClick}>
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </Button>
        )}

        {/* Secondary actions collapse into one overflow menu so the bar stays
            scannable no matter how many a given tool enables. */}
        {(onOpen || onMoodboardClick || handleWikiClick || onShare) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More actions">
                <MoreHorizontal className="w-4 h-4 mr-2" />
                More
                <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-sf-surface/95 backdrop-blur-sf-side border-sf-border rounded-none">
              {onMoodboardClick && (
                <DropdownMenuItem onClick={onMoodboardClick}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Moodboard
                  {moodboardCount != null && moodboardCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                      {moodboardCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
              )}
              {handleWikiClick && (
                <DropdownMenuItem onClick={handleWikiClick}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Open wiki entry
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                  {isShared && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-sm bg-primary" />
                  )}
                </DropdownMenuItem>
              )}
              {onOpen && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onOpen}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open saved worksheet…
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>

    {/* Sticky bottom bar, appears when top bar scrolls out of view */}
    <div
      className={`no-print fixed bottom-6 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        showBottomBar ? "translate-y-0" : "translate-y-[calc(100%+24px)]"
      }`}
    >
      {/* Light arc glow on top edge */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[hsl(157_100%_62%/0.25)] to-transparent" />

      <div className="bg-[hsl(222_25%_9%/0.95)] backdrop-blur-xl border-t border-white/[0.08]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
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

            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              {exportLabel}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-t4 hover:text-t2"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Top
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default ToolActionBar;
