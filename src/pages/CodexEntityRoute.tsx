import { useParams } from "react-router-dom";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { WikiPage } from "@/components/world/WikiPage";

/**
 * /worlds/:worldId/codex/:entityId — one URL per thing (Brief F1).
 *
 * The entity page IS the wiki article: header, generated infobox, prose
 * body, attached instruments, relations, mentions, chronicle. WikiPage is
 * that page; this route is its canonical address. /pages/:entryId redirects
 * here so nothing the app ever linked goes dark.
 */
const CodexEntityRoute = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const layoutContext = useWorldLayoutContext();
  const worldId = layoutContext?.worldId ?? "";

  if (!worldId || !entityId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-xs uppercase tracking-wider text-t3">
          ENTITY NOT ON FILE.
        </p>
      </div>
    );
  }

  return <WikiPage worldId={worldId} entryId={entityId} />;
};

export default CodexEntityRoute;
