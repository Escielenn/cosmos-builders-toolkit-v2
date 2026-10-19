import { useParams } from "react-router-dom";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { WikiPage } from "@/components/world/WikiPage";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { PageContainer, Notice } from "@/components/layout/page-chrome";

/**
 * /worlds/:worldId/codex/:entityId — one URL per thing (Brief F1).
 *
 * The entity page IS the wiki article: header, generated infobox, prose
 * body, attached instruments, relations, mentions, chronicle. WikiPage is
 * that page; this route is its canonical address. /pages/:entryId redirects
 * here so nothing the app ever linked goes dark.
 */
const CodexEntityRoute = () => {
  useMetaTags({ title: "Codex" });
  const { entityId } = useParams<{ entityId: string }>();
  const layoutContext = useWorldLayoutContext();
  const worldId = layoutContext?.worldId ?? "";

  if (!worldId || !entityId) {
    return (
      <PageContainer variant="space">
        <Notice tone="danger" label="ENTRY NOT ON FILE">
          This Codex address does not name an entry in this world.
        </Notice>
      </PageContainer>
    );
  }

  return <WikiPage worldId={worldId} entryId={entityId} />;
};

export default CodexEntityRoute;
