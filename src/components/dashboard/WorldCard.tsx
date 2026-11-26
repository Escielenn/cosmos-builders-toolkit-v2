import { MoreHorizontal, Trash2, Download, Share2, Archive, ArchiveRestore, GitFork, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import WorldCardArt from "@/components/world/WorldCardArt";
import WorldCoverDialog from "@/components/world/WorldCoverDialog";
import { useToast } from "@/hooks/use-toast";
import WorldExportDialog from "@/components/world/WorldExportDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { cn } from "@/lib/utils";

interface WorldCardProps {
  id: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImageFocusY?: number;
  /** Art behind the card; defaults to headerImageUrl (see worldCoverUrl). */
  coverUrl?: string | null;
  icon: string;
  tags?: string[];
  archivedAt?: string | null;
  snapshotAt?: string | null;
  updatedAt: string;
  forkedFrom?: string | null;
  source?: { id: string; name: string } | null;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

const WorldCard = ({
  id,
  name,
  description,
  headerImageUrl,
  headerImageFocusY,
  coverUrl,
  icon,
  tags = [],
  archivedAt,
  snapshotAt,
  updatedAt,
  forkedFrom,
  source,
  onDelete,
  onArchive,
  onUnarchive,
}: WorldCardProps) => {
  const isFork = !!forkedFrom;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isArchived = !!archivedAt;
  const art = coverUrl ?? headerImageUrl;

  const handleShare = async () => {
    const worldUrl = `${window.location.origin}/worlds/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description || `${name}, a world on StellarForge`,
          url: worldUrl,
        });
      } catch (error) {
        // User cancelled or share failed - fall back to clipboard
        if ((error as Error).name !== "AbortError") {
          await copyToClipboard(worldUrl);
        }
      }
    } else {
      await copyToClipboard(worldUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "LINK COPIED.",
        description: "World link copied to the clipboard.",
      });
    } catch {
      toast({
        title: "FAILED TO COPY.",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <GlassPanel hover className={cn("flex flex-col min-h-[200px] overflow-hidden", isArchived && "border-dashed")}>
        {/* The world's cover, faded behind the whole card (1.7). Nothing
            renders without a cover or with "World art on cards" off. */}
        <WorldCardArt url={art} focusY={headerImageUrl ? headerImageFocusY : 50} />

        {/* Header band */}
        <div className="relative">
          {art ? (
            // The art already fills the card; the band is just room for the icon.
            <div className="w-full h-16" />
          ) : (
            <div className="w-full h-16 bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
          )}
          {/* Icon overlay - positioned outside overflow-hidden container */}
          <div
            className={cn(
              "absolute -bottom-5 left-4 w-10 h-10 rounded-none border-2 border-background flex items-center justify-center shadow-lg z-10 overflow-hidden",
              art ? "bg-sf-surface" : "bg-gradient-to-br from-primary/20 to-accent/20",
            )}
          >
            <WorldIconRenderer iconId={icon} className="w-6 h-6 text-sf-primary-text" />
          </div>
          {/* Status badges (Fork / Archived), stacked top-right */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {isFork && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-sf-surface border border-sf-stellar text-sf-stellar-text font-mono text-[12px] tracking-wide uppercase"
                title={source ? `Forked from ${source.name}` : "Forked from another world"}
              >
                <GitFork className="w-3 h-3" />
                Fork
              </span>
            )}
            {isArchived && (
              <Badge variant="secondary" className="gap-1">
                <Archive className="w-3 h-3" />
                Archived
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative p-5 pt-8 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <Link to={`/worlds/${id}`} className="flex-1">
              <h3 className="font-heading font-medium text-lg hover:text-sf-primary-text transition-colors">
                {name}
              </h3>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 min-h-hit min-w-hit" aria-label="World options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/worlds/${id}`}>Open world</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCoverDialog(true)}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {headerImageUrl ? "Change cover" : "Set cover"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isArchived ? (
                  <DropdownMenuItem onClick={() => onUnarchive?.(id)}>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore from archive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onArchive?.(id)}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-sf-crimson-text focus:text-sf-crimson-text"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1">
            {description && (
              <p className="text-sm text-t2 line-clamp-2">
                {description}
              </p>
            )}
            {isFork && source && (
              <p className="text-xs text-t4 mt-1 inline-flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                Forked from <span className="text-t3">{source.name}</span>
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <span className="text-xs text-t3">+{tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-sf-line-hairline mt-auto flex items-center justify-between">
            <p className="text-xs text-t3">
              Updated {formattedDate}
            </p>
            {snapshotAt && (
              <span
                className={cn(
                  "w-2 h-2 rounded-none shrink-0",
                  Date.now() - new Date(snapshotAt).getTime() < 3_600_000
                    ? "bg-sf-emerald"
                    : Date.now() - new Date(snapshotAt).getTime() < 86_400_000
                      ? "bg-sf-amber"
                      : "bg-sf-disabled-line"
                )}
                role="img"
                aria-label={`Last backup: ${new Date(snapshotAt).toLocaleString()}`}
                title={`Last backup: ${new Date(snapshotAt).toLocaleString()}`}
              />
            )}
          </div>
        </div>
      </GlassPanel>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        itemName={name}
        itemType="world"
        onConfirm={() => {
          setIsDeleting(true);
          onDelete(id);
        }}
        isDeleting={isDeleting}
      />

      <WorldExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        worldName={name}
        worldId={id}
      />

      <WorldCoverDialog
        open={showCoverDialog}
        onOpenChange={setShowCoverDialog}
        worldId={id}
        worldName={name}
        currentUrl={headerImageUrl}
        currentFocusY={headerImageFocusY}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        entityType="world"
        entityId={id}
        entityTitle={name}
      />
    </>
  );
};

export default WorldCard;
