import { GlassPanel } from "@/components/ui/glass-panel";
import { ImageIcon, Plus } from "lucide-react";
import WorldIconRenderer from "./WorldIconRenderer";
import { Button } from "@/components/ui/button";
import TagBadge from "@/components/tags/TagBadge";
import { getTagColor } from "@/hooks/use-tags";

interface WorldHeaderProps {
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImageFocusY?: number;
  icon: string;
  tags?: string[];
  onEditClick?: () => void;
  onAddTag?: () => void;
  canEdit?: boolean;
}

const WorldHeader = ({
  name,
  description,
  headerImageUrl,
  headerImageFocusY,
  icon,
  tags = [],
  onEditClick,
  onAddTag,
  canEdit = false,
}: WorldHeaderProps) => {
  return (
    <GlassPanel>
      {/* Header Banner */}
      {headerImageUrl ? (
        <div
          className="relative w-full h-32 md:h-48 cursor-pointer group"
          onClick={onEditClick}
        >
          <div className="absolute inset-0 overflow-hidden rounded-t-none">
            <img
              src={headerImageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${headerImageFocusY ?? 50}%` }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent rounded-t-none" />
          {onEditClick && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-none">
              <span className="text-white text-sm font-medium">Click to change</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative w-full h-24 md:h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 cursor-pointer group rounded-t-none"
          onClick={onEditClick}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
          {onEditClick && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <ImageIcon className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Add header image</span>
            </div>
          )}
        </div>
      )}

      {/* Content area with icon */}
      <div className="relative px-6 pb-6">
        {/* Icon - positioned to overlap the banner */}
        <div className="absolute -top-8 left-6">
          <div
            className="w-16 h-16 rounded-none bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-background flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform overflow-hidden"
            onClick={onEditClick}
          >
            <WorldIconRenderer iconId={icon} className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Name, description, and tags */}
        <div className="pt-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl md:text-3xl font-light tracking-[0.12em]">{name}</h1>
            {description && (
              <p className="text-t3 mt-2 max-w-2xl">{description}</p>
            )}
          </div>

          {/* Tags - right side on desktop */}
          <div className="flex flex-wrap gap-1.5 md:justify-end md:max-w-xs shrink-0 items-center">
            {tags.map((tag) => {
              const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
              return (
                <TagBadge key={tag} name={tag} color={getTagColor(hash)} size="sm" />
              );
            })}
            {canEdit && onAddTag && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-t3 hover:text-t1"
                onClick={onAddTag}
              >
                <Plus className="w-3 h-3 mr-1" />
                {tags.length > 0 ? "Tag" : "Add Tags"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default WorldHeader;
