import { MoreHorizontal, Trash2, Download, Share2, Archive, ArchiveRestore } from "lucide-react";
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
import { getWorldIcon } from "@/lib/world-icons";
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
  icon: string;
  tags?: string[];
  archivedAt?: string | null;
  updatedAt: string;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

const WorldCard = ({
  id,
  name,
  description,
  headerImageUrl,
  icon,
  tags = [],
  archivedAt,
  updatedAt,
  onDelete,
  onArchive,
  onUnarchive,
}: WorldCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isArchived = !!archivedAt;

  const handleShare = async () => {
    const worldUrl = `${window.location.origin}/worlds/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description || `Check out my world "${name}" on StellarForge`,
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
        title: "Link copied",
        description: "World link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
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

  const worldIcon = getWorldIcon(icon);
  const IconComponent = worldIcon.icon;

  return (
    <>
      <GlassPanel hover className={cn("flex flex-col min-h-[200px]", isArchived && "opacity-60")}>
        {/* Header Image */}
        <div className="relative">
          {headerImageUrl ? (
            <div className="w-full h-24 overflow-hidden">
              <img
                src={headerImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-16 bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
          )}
          {/* Icon overlay - positioned outside overflow-hidden container */}
          <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center shadow-lg z-10">
            <IconComponent className="w-5 h-5 text-primary" />
          </div>
          {/* Archived badge */}
          {isArchived && (
            <Badge variant="secondary" className="absolute top-2 right-2 gap-1">
              <Archive className="w-3 h-3" />
              Archived
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-5 pt-8 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <Link to={`/worlds/${id}`} className="flex-1">
              <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/worlds/${id}`}>Edit World</Link>
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
                    Restore from Archive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onArchive?.(id)}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1">
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
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
                  <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 mt-auto">
            <p className="text-xs text-muted-foreground">
              Last updated: {formattedDate}
            </p>
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
