import { getWorldIcon } from "@/lib/world-icons";
import { cn } from "@/lib/utils";

interface WorldIconRendererProps {
  iconId: string;
  className?: string;
}

/**
 * Unified renderer for world icons: supports both Lucide icon IDs (e.g. "globe")
 * and world-pic SVG paths (e.g. "/world-pics/007-astronaut.svg").
 */
const WorldIconRenderer = ({ iconId, className }: WorldIconRendererProps) => {
  if (iconId.startsWith("/world-pics/")) {
    return (
      <img
        src={iconId}
        alt=""
        className={cn("object-contain", className)}
        draggable={false}
      />
    );
  }

  const worldIcon = getWorldIcon(iconId);
  const IconComponent = worldIcon.icon;
  return <IconComponent className={className} />;
};

export default WorldIconRenderer;
