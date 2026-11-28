import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Printer, Download, Share2, StickyNote, ImageIcon, FolderOpen, Cloud, CloudOff, BookOpen, ChevronDown, MoreHorizontal } from "lucide-react";
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
  /** The rail's Sections button (ToolRailTrigger), shown below xl. */
  railTrigger?: ReactNode;
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
  railTrigger,
}: ToolActionBarProps) => {
  const navigate = useNavigate();

  // Auto-resolve linked wiki entry for the "Wiki" button
  const { data: linkedEntryId } = useLinkedEntryId(worldId, worksheetId);
  const handleWikiClick = onWikiClick ?? (
    linkedEntryId && worldId
      ? () => navigate(`/worlds/${worldId}/codex/${linkedEntryId}`)
      : undefined
  );
  return (
    <>
    {/* Sticky under the site header (or the top of the world frame): the
        one action row. It replaces the fixed bottom bar that used to slide
        in over content once this row scrolled away (finding 8/14). One row
        at every width: on phones labels drop to icons and Notes moves into
        the More menu (finding 19). */}
    <div
      className={`no-print sticky top-[var(--sf-tool-sticky-top,4rem)] z-30 -mx-4 border-b border-sf-line-hairline bg-sf-void/95 px-4 py-2 backdrop-blur-sf-side ${className}`}
    >
      {/* Buttons keep their width (they used to shrink and clip their own
          labels between 640 and 900px); if the row is still too narrow it
          scrolls sideways inside itself, never the page. */}
      <div className="flex flex-nowrap gap-2 items-center overflow-x-auto sf-sb -my-1 py-1 [&>*]:shrink-0">
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
              {isSaving ? "SAVING..." : isCloudEnabled ? "Save" : (
                <span>Save<span className="hidden sm:inline"> draft</span></span>
              )}
              {isCloudEnabled ? (
                <Cloud className="w-3 h-3 ml-1.5 text-sf-primary-text" aria-label="Cloud sync enabled" />
              ) : (
                <CloudOff className="w-3 h-3 ml-1.5 text-t4" aria-label="Local only" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{isCloudEnabled ? "Cloud sync enabled" : "Local only"} · <span className="font-mono">Ctrl/⌘ S</span></p>
          </TooltipContent>
        </Tooltip>
        {/* One Export control instead of three competing ones. Quick Export,
            the format dialog, and Print/PDF used to sit side by side in this
            row, which read as three different features. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label={exportLabel}>
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{exportLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-t4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 bg-sf-surface/95 backdrop-blur-sf-side border-sf-line rounded-none">
            <DropdownMenuLabel className="text-[12px] uppercase tracking-[1.5px] text-t3 font-medium">
              Export
            </DropdownMenuLabel>
            {extraActions && (
              <div className="px-1 py-1 [&_button]:w-full [&_button]:justify-start">
                {extraActions}
              </div>
            )}
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Choose Format…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print / Save as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onNotesClick && (
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={onNotesClick}>
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </Button>
        )}

        {/* Secondary actions collapse into one overflow menu so the bar stays
            scannable no matter how many a given tool enables. */}
        {(onOpen || onMoodboardClick || handleWikiClick || onShare || onNotesClick) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="More actions"
                className={!(onOpen || onMoodboardClick || handleWikiClick || onShare) ? "sm:hidden" : undefined}
              >
                <MoreHorizontal className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">More</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-t4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-sf-surface/95 backdrop-blur-sf-side border-sf-line rounded-none">
              {onNotesClick && (
                <DropdownMenuItem className="sm:hidden" onClick={onNotesClick}>
                  <StickyNote className="w-4 h-4 mr-2" />
                  Notes
                </DropdownMenuItem>
              )}
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
                  Open Wiki Entry
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                  {isShared && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-none bg-sf-primary" />
                  )}
                </DropdownMenuItem>
              )}
              {onOpen && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onOpen}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open Saved Worksheet…
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {railTrigger && <div className="ml-auto">{railTrigger}</div>}
      </div>
      {/* 1.9 F-20: on a phone the row scrolls sideways; a fade at the right
          edge says there is more. Decoration only, below sm. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-sf-void to-transparent sm:hidden" />
    </div>
    </>
  );
};

export default ToolActionBar;
