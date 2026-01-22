import { getWorldIcon } from "@/lib/world-icons";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ImageIcon } from "lucide-react";

interface WorldHeaderProps {
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  icon: string;
  onEditClick?: () => void;
}

const WorldHeader = ({
  name,
  description,
  headerImageUrl,
  icon,
  onEditClick,
}: WorldHeaderProps) => {
  const worldIcon = getWorldIcon(icon);
  const IconComponent = worldIcon.icon;

  return (
    <GlassPanel className="overflow-hidden">
      {/* Header Banner */}
      {headerImageUrl ? (
        <div
          className="relative w-full h-32 md:h-48 overflow-hidden cursor-pointer group"
          onClick={onEditClick}
        >
          <img
            src={headerImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          {onEditClick && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Click to change</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative w-full h-24 md:h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 cursor-pointer group"
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
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-background flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
            onClick={onEditClick}
          >
            <IconComponent className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Name and description */}
        <div className="pt-10">
          <h1 className="font-display text-2xl md:text-3xl font-bold">{name}</h1>
          {description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
    </GlassPanel>
  );
};

export default WorldHeader;
