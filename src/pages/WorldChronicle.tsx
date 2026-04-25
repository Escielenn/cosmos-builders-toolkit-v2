import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { Chronicle } from "@/components/world/chronicle/Chronicle";

/**
 * Route component for /worlds/:worldId/chronicle
 * Renders Chronicle inside the WorldLayout (Codex sidebar visible).
 */
const WorldChronicle = () => {
  const layoutContext = useWorldLayoutContext();
  const worldId = layoutContext?.worldId ?? "";

  if (!worldId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs uppercase tracking-wider text-t3/50">
          World not found.
        </p>
      </div>
    );
  }

  return <Chronicle worldId={worldId} />;
};

export default WorldChronicle;
