/** Chrome follows 15-PAGE-CHROME (PageHeader inside Chronicle); event data stays mono. */
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { Chronicle } from "@/components/world/chronicle/Chronicle";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { PageContainer, Notice } from "@/components/layout/page-chrome";

/**
 * Route component for /worlds/:worldId/chronicle
 * Renders Chronicle inside the WorldLayout (Codex sidebar visible).
 */
const WorldChronicle = () => {
  useMetaTags({ title: "Chronicle" });
  const layoutContext = useWorldLayoutContext();
  const worldId = layoutContext?.worldId ?? "";

  if (!worldId) {
    return (
      <PageContainer variant="space">
        <Notice tone="danger" label="WORLD NOT FOUND">
          This Chronicle has no world to belong to.
        </Notice>
      </PageContainer>
    );
  }

  return <Chronicle worldId={worldId} />;
};

export default WorldChronicle;
