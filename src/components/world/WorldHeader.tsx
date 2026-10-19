import { GlassPanel } from "@/components/ui/glass-panel";
import { ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagBadge from "@/components/tags/TagBadge";
import { getTagColor } from "@/hooks/use-tags";

/**
 * The Bridge's cover: header image, tags, and whatever sits beside them
 * (last updated, cascade progress).
 *
 * It used to carry the world name as a second, Jura title inside the card,
 * 370px down the page. The name is the Bridge's PageHeader title now
 * (15-PAGE-CHROME §2), so this block never repeats it.
 */
interface WorldHeaderProps {
  /** Used for the image's accessible name only; never rendered as a title. */
  name: string;
  headerImageUrl: string | null;
  headerImageFocusY?: number;
  tags?: string[];
  onEditClick?: () => void;
  onAddTag?: () => void;
  canEdit?: boolean;
  /** Meta row under the cover (last updated, cascade progress). */
  meta?: React.ReactNode;
}

const WorldHeader = ({
  name,
  headerImageUrl,
  headerImageFocusY,
  tags = [],
  onEditClick,
  onAddTag,
  canEdit = false,
  meta,
}: WorldHeaderProps) => {
  // The banner is the edit target. Give it keyboard reach, not just a click.
  const bannerA11y = onEditClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": headerImageUrl ? "Change header image" : "Add header image",
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onEditClick();
          }
        },
      }
    : {};

  const hasBanner = !!headerImageUrl || !!onEditClick;
  const hasTagRow = tags.length > 0 || (canEdit && !!onAddTag) || !!meta;
  if (!hasBanner && !hasTagRow) return null;

  return (
    <GlassPanel>
      {headerImageUrl ? (
        <div
          className="relative w-full h-32 md:h-48 cursor-pointer group"
          onClick={onEditClick}
          {...bannerA11y}
        >
          <div className="absolute inset-0 overflow-hidden rounded-none">
            <img
              src={headerImageUrl}
              alt={`${name} header image`}
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${headerImageFocusY ?? 50}%` }}
            />
          </div>
          {onEditClick && (
            <div className="absolute inset-0 bg-[var(--sf-scrim)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-base flex items-center justify-center">
              <span className="font-heading text-sf-eyebrow uppercase text-t1">CHANGE HEADER IMAGE</span>
            </div>
          )}
        </div>
      ) : onEditClick ? (
        <div
          className="relative w-full h-16 cursor-pointer group border-b border-sf-line-hairline flex items-center justify-center gap-2 text-t3 transition-colors duration-base hover:text-t1"
          onClick={onEditClick}
          {...bannerA11y}
        >
          <ImageIcon className="w-4 h-4" aria-hidden="true" />
          <span className="font-heading text-sf-eyebrow uppercase">ADD HEADER IMAGE</span>
        </div>
      ) : null}

      {hasTagRow && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          {meta && <div className="flex flex-wrap items-center gap-3">{meta}</div>}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => {
              const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
              return <TagBadge key={tag} name={tag} color={getTagColor(hash)} size="sm" />;
            })}
            {canEdit && onAddTag && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-hit px-2 text-xs text-t3 hover:text-t1"
                onClick={onAddTag}
              >
                <Plus className="w-3 h-3 mr-1" aria-hidden />
                {tags.length > 0 ? "Tag" : "Add tags"}
              </Button>
            )}
          </div>
        </div>
      )}
    </GlassPanel>
  );
};

export default WorldHeader;
