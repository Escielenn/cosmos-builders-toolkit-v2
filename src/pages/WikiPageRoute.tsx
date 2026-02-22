import { useParams } from "react-router-dom";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { WikiPage } from "@/components/world/WikiPage";

/**
 * Route component for /worlds/:worldId/pages/:entryId
 * Renders WikiPage inside the WorldLayout (Codex sidebar visible).
 */
const WikiPageRoute = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const layoutContext = useWorldLayoutContext();
  const worldId = layoutContext?.worldId ?? "";

  if (!worldId || !entryId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/50">
          Page not found.
        </p>
      </div>
    );
  }

  return <WikiPage worldId={worldId} entryId={entryId} />;
};

export default WikiPageRoute;
